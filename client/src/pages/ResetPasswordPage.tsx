import { useState, useEffect } from "react";
import { useLocation, Redirect } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "../lib/queryClient";

// Password reset schema
const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [tokenEmail, setTokenEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Extract token from URL
  useEffect(() => {
    const path = window.location.pathname;
    const tokenMatch = path.match(/\/reset-password\/(.+)/);
    
    if (tokenMatch && tokenMatch[1]) {
      setToken(tokenMatch[1]);
      validateToken(tokenMatch[1]);
    } else {
      setError("Invalid reset token");
      setIsTokenValid(false);
    }
  }, []);

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  // Validate token with backend
  const validateToken = async (token: string) => {
    try {
      const response = await apiRequest("GET", `/api/password-reset/validate/${token}`);
      const data = await response.json();
      
      if (response.ok) {
        setIsTokenValid(true);
        setTokenEmail(data.email);
      } else {
        setIsTokenValid(false);
        setError(data.message || "Invalid or expired reset token");
      }
    } catch (error) {
      setIsTokenValid(false);
      setError("Failed to validate reset token");
    }
  };

  // Handle form submission
  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await apiRequest("POST", "/api/password-reset/reset", {
        token,
        password: data.password,
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        toast({
          title: "Password reset successful",
          description: "Your password has been updated. You can now log in with your new password.",
          variant: "default",
        });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/auth");
        }, 3000);
      } else {
        setError(result.message || "Failed to reset password");
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900">
      <div className="flex items-center justify-center w-full p-8">
        <div className="max-w-md w-full">
          <Card className="border-none bg-gray-800/50 text-white">
            <CardHeader>
              <CardTitle>Reset Your Password</CardTitle>
              <CardDescription className="text-gray-400">
                {tokenEmail ? `Create a new password for ${tokenEmail}` : 'Create a new password for your account'}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {isTokenValid === false && (
                <Alert variant="destructive" className="bg-red-900/40 border-red-900 text-white mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Invalid Token</AlertTitle>
                  <AlertDescription>
                    {error || "Your password reset link is invalid or has expired. Please request a new one."}
                  </AlertDescription>
                  <Button 
                    className="mt-2 w-full"
                    onClick={() => navigate("/auth")}
                  >
                    Back to Login
                  </Button>
                </Alert>
              )}
              
              {success && (
                <Alert className="bg-green-900/40 border-green-900 text-white mb-4">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Password Reset Successful</AlertTitle>
                  <AlertDescription>
                    Your password has been successfully reset. You will be redirected to the login page in a few seconds.
                  </AlertDescription>
                </Alert>
              )}
              
              {isTokenValid && !success && (
                <Form {...resetForm}>
                  <form onSubmit={resetForm.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={resetForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter your new password" 
                              {...field} 
                              className="bg-gray-700 border-gray-600"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={resetForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Confirm your new password" 
                              {...field} 
                              className="bg-gray-700 border-gray-600"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {error && (
                      <Alert variant="destructive" className="bg-red-900/40 border-red-900 text-white">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <Button 
                      type="submit" 
                      className="w-full mt-6" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Reset Password
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-sm text-gray-400 text-center">
                <span>Back to </span>
                <button
                  onClick={() => navigate("/auth")}
                  className="text-primary underline underline-offset-4 hover:text-primary/90"
                >
                  Login
                </button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}