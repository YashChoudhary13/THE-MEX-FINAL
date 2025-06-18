import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  securityQuestion: z.string().min(5, "Security question must be at least 5 characters").optional().or(z.literal('')),
  securityAnswer: z.string().min(2, "Security answer must be at least 2 characters").optional().or(z.literal('')),
});

const resetPasswordSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

const securityAnswerSchema = z.object({
  securityAnswer: z.string().min(1, "Security answer is required"),
});

const newPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
type SecurityAnswerFormValues = z.infer<typeof securityAnswerSchema>;
type NewPasswordFormValues = z.infer<typeof newPasswordSchema>;

const securityQuestions = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What city were you born in?",
  "What is your favorite book?",
  "What was your childhood nickname?",
  "What is the name of your best friend from childhood?",
  "What was the first concert you attended?",
  "What is your favorite movie?",
  "What was the model of your first car?"
];

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetStep, setResetStep] = useState<'username' | 'security' | 'password'>('username');
  const [securityQuestion, setSecurityQuestion] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();

  // Clear errors when switching tabs
  useEffect(() => {
    setLoginError(null);
    setRegisterError(null);
    setShowResetForm(false);
    setResetSuccess(false);
  }, [activeTab]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      securityQuestion: "",
      securityAnswer: "",
    },
  });

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      username: "",
    },
  });

  const securityForm = useForm<SecurityAnswerFormValues>({
    resolver: zodResolver(securityAnswerSchema),
    defaultValues: {
      securityAnswer: "",
    },
  });

  const passwordForm = useForm<NewPasswordFormValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    setLoginError(null);
    loginMutation.mutate(data, {
      onError: (error) => {
        setLoginError(error.message);
      }
    });
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    setRegisterError(null);
    registerMutation.mutate(data, {
      onError: (error) => {
        setRegisterError(error.message);
      }
    });
  };

  const handlePasswordReset = async (values: ResetPasswordFormValues) => {
    setIsResettingPassword(true);
    
    try {
      const response = await apiRequest("POST", "/api/password-reset/request", values);
      
      if (response.ok) {
        const data = await response.json();
        setSecurityQuestion(data.securityQuestion);
        setCurrentUsername(values.username);
        setResetStep('security');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to find security question");
      }
    } catch (error: any) {
      toast({
        title: "Reset Failed", 
        description: error.message || "Failed to process password reset request",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSecurityAnswer = async (values: SecurityAnswerFormValues) => {
    setIsResettingPassword(true);
    
    try {
      const response = await apiRequest("POST", "/api/password-reset/verify", {
        username: currentUsername,
        securityAnswer: values.securityAnswer
      });
      
      if (response.ok) {
        const data = await response.json();
        setResetToken(data.resetToken);
        setResetStep('password');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid security answer");
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed", 
        description: error.message || "Invalid security answer",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleNewPassword = async (values: NewPasswordFormValues) => {
    setIsResettingPassword(true);
    
    try {
      const response = await apiRequest("POST", "/api/password-reset/reset", {
        resetToken,
        newPassword: values.newPassword
      });
      
      if (response.ok) {
        toast({
          title: "Password Reset Successful",
          description: "Your password has been successfully updated. Please log in with your new password.",
        });
        setResetSuccess(true);
        setShowResetForm(false);
        setResetStep('username');
        setActiveTab('login');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reset password");
      }
    } catch (error: any) {
      toast({
        title: "Reset Failed", 
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full">
        {/* Hero Section */}
        <div className="hidden lg:flex flex-col justify-center space-y-6 text-center">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Welcome to The Mex
            </h1>
            <p className="text-xl text-gray-600 max-w-md mx-auto">
              Authentic Mexican flavors delivered fresh to your door. Experience the taste of tradition with every bite.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">30+</div>
                <div className="text-sm text-gray-600">Menu Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">15 min</div>
                <div className="text-sm text-gray-600">Avg Prep Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">100%</div>
                <div className="text-sm text-gray-600">Fresh Ingredients</div>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Forms */}
        <div className="flex justify-center items-center">
          <Card className="w-full max-w-md shadow-2xl border-0 bg-gradient-to-br from-red-900/90 to-orange-900/90 backdrop-blur-sm">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-3xl font-bold text-white">
                {showResetForm ? "Reset Password" : "Get Started"}
              </CardTitle>
              <CardDescription className="text-gray-200">
                {showResetForm 
                  ? "Follow the steps to reset your password" 
                  : "Sign in to your account or create a new one"
                }
              </CardDescription>
            </CardHeader>

            {!showResetForm ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mx-6 mb-4 bg-white/20">
                  <TabsTrigger 
                    value="login" 
                    className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-white"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register" 
                    className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-white"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <CardContent className="space-y-4">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Enter your password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full bg-white text-gray-900 hover:bg-gray-100" 
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Signing In
                            </>
                          ) : (
                            "Sign In"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    {loginError && (
                      <Alert variant="destructive" className="bg-red-900/40 border-red-900 text-white">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Login Error</AlertTitle>
                        <AlertDescription>{loginError}</AlertDescription>
                      </Alert>
                    )}
                    
                    <Button
                      variant="link"
                      onClick={() => setShowResetForm(true)}
                      className="text-white hover:text-gray-200"
                    >
                      Forgot Password?
                    </Button>
                  </CardFooter>
                </TabsContent>

                <TabsContent value="register">
                  <CardContent className="space-y-4">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Choose a username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Create a password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full bg-white text-gray-900 hover:bg-gray-100" 
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating Account
                            </>
                          ) : (
                            "Create Account"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter>
                    {registerError && (
                      <Alert variant="destructive" className="bg-red-900/40 border-red-900 text-white">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Registration Error</AlertTitle>
                        <AlertDescription>{registerError}</AlertDescription>
                      </Alert>
                    )}
                  </CardFooter>
                </TabsContent>
              </Tabs>
            ) : (
              <CardContent className="space-y-4">
                {resetSuccess ? (
                  <Alert className="bg-green-900/40 border-green-900 text-white">
                    <AlertTitle>Password Reset Complete</AlertTitle>
                    <AlertDescription>
                      Your password has been successfully updated. You can now sign in with your new password.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {resetStep === 'username' && (
                      <Form {...resetForm}>
                        <form onSubmit={resetForm.handleSubmit(handlePasswordReset)} className="space-y-4">
                          <FormField
                            control={resetForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">Username</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your username" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button 
                            type="submit" 
                            className="w-full bg-white text-gray-900 hover:bg-gray-100" 
                            disabled={isResettingPassword}
                          >
                            {isResettingPassword ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Finding Security Question
                              </>
                            ) : (
                              "Continue"
                            )}
                          </Button>
                        </form>
                      </Form>
                    )}

                    {resetStep === 'security' && (
                      <Form {...securityForm}>
                        <form onSubmit={securityForm.handleSubmit(handleSecurityAnswer)} className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-white">Security Question</Label>
                            <div className="p-3 bg-white/20 rounded-md text-sm text-white">
                              {securityQuestion}
                            </div>
                          </div>
                          <FormField
                            control={securityForm.control}
                            name="securityAnswer"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">Your Answer</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your security answer" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex gap-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => {
                                setResetStep('username');
                                securityForm.reset();
                              }}
                            >
                              Back
                            </Button>
                            <Button 
                              type="submit" 
                              className="flex-1 bg-white text-gray-900 hover:bg-gray-100" 
                              disabled={isResettingPassword}
                            >
                              {isResettingPassword ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Verifying
                                </>
                              ) : (
                                "Verify Answer"
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    )}

                    {resetStep === 'password' && (
                      <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(handleNewPassword)} className="space-y-4">
                          <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">New Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Enter new password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">Confirm Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Confirm new password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button 
                            type="submit" 
                            className="w-full bg-white text-gray-900 hover:bg-gray-100" 
                            disabled={isResettingPassword}
                          >
                            {isResettingPassword ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Resetting Password
                              </>
                            ) : (
                              "Reset Password"
                            )}
                          </Button>
                        </form>
                      </Form>
                    )}
                  </>
                )}

                <div className="flex justify-center">
                  <Button
                    variant="link"
                    onClick={() => {
                      setShowResetForm(false);
                      setResetStep('username');
                      setResetSuccess(false);
                    }}
                    className="text-white hover:text-gray-200"
                  >
                    Back to Login
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}