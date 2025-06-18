import { useState, useEffect } from "react";
import { useLocation, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "../lib/queryClient";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
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

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [showResetForm, setShowResetForm] = useState(false);
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
    if (user && user.role === 'admin') {
      navigate('/admin');
    } else if (user) {
      navigate('/');
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

  const onResetPasswordSubmit = async (data: ResetPasswordFormValues) => {
    setIsResettingPassword(true);
    try {
      const response = await fetch('/api/password-reset/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });
      
      if (response.ok) {
        setResetSuccess(true);
        toast({
          title: "Password reset requested",
          description: "If an account with this email exists, you will receive instructions to reset your password.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to request password reset. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Password reset request error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900">
      {/* Left column - Form */}
      <div className="flex items-center justify-center w-full lg:w-1/2 p-8">
        <div className="max-w-md w-full">
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col space-y-4 text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-white">Welcome to The Mex</h1>
              <p className="text-muted-foreground">Sign in to your account or create a new one</p>
              <TabsList className="grid w-full grid-cols-2 mt-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="login">
              <Card className="border-none bg-gray-800/50 text-white">
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription className="text-gray-400">
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your username" 
                                {...field} 
                                className="bg-gray-700 border-gray-600"
                              />
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
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Enter your password" 
                                {...field} 
                                className="bg-gray-700 border-gray-600"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full mt-6" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Login
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
                  
                  {showResetForm ? (
                    <div className="space-y-4 w-full">
                      {resetSuccess ? (
                        <Alert className="bg-green-900/40 border-green-900 text-white">
                          <AlertTitle>Check Your Email</AlertTitle>
                          <AlertDescription>
                            If an account with this email exists, you will receive instructions to reset your password.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Form {...resetForm}>
                          <form onSubmit={resetForm.handleSubmit(onResetPasswordSubmit)} className="space-y-4">
                            <FormField
                              control={resetForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="email" 
                                      placeholder="Enter your email address" 
                                      {...field} 
                                      className="bg-gray-700 border-gray-600"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex gap-2">
                              <Button 
                                type="submit" 
                                className="flex-1"
                                disabled={isResettingPassword}
                              >
                                {isResettingPassword ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Reset Password
                              </Button>
                              <Button 
                                type="button" 
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowResetForm(false)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </Form>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-gray-400 text-center">
                        <span>Don't have an account? </span>
                        <button
                          onClick={() => setActiveTab("register")}
                          className="text-primary underline underline-offset-4 hover:text-primary/90"
                        >
                          Register
                        </button>
                      </div>
                      <div className="text-sm text-gray-400 text-center">
                        <button
                          onClick={() => setShowResetForm(true)}
                          className="text-primary underline underline-offset-4 hover:text-primary/90"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="border-none bg-gray-800/50 text-white">
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription className="text-gray-400">
                    Enter your details to create a new account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Choose a username" 
                                {...field} 
                                className="bg-gray-700 border-gray-600"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="Enter your email address" 
                                {...field} 
                                className="bg-gray-700 border-gray-600"
                              />
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
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Create a password" 
                                {...field} 
                                className="bg-gray-700 border-gray-600"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full mt-6" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Create Account
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  {registerError && (
                    <Alert variant="destructive" className="bg-red-900/40 border-red-900 text-white">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Registration Error</AlertTitle>
                      <AlertDescription>{registerError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="text-sm text-gray-400 text-center">
                    <span>Already have an account? </span>
                    <button
                      onClick={() => setActiveTab("login")}
                      className="text-primary underline underline-offset-4 hover:text-primary/90"
                    >
                      Login
                    </button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right column - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 to-amber-700 p-12 items-center justify-center">
        <div className="max-w-xl">
          <div className="text-white">
            <h2 className="text-5xl font-bold mb-6">Experience The Mex</h2>
            <p className="text-xl mb-8">
              Authentic Mexican cuisine with a modern twist. Order online for pickup and manage your favorite dishes.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center">
                <svg className="h-6 w-6 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Easy online ordering</span>
              </li>
              <li className="flex items-center">
                <svg className="h-6 w-6 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Daily specials and promotions</span>
              </li>
              <li className="flex items-center">
                <svg className="h-6 w-6 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Track your orders in real-time</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}