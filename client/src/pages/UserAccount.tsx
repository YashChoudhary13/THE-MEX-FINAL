import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, User, Lock, ShoppingBag, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Profile update form schema
const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal(''))
});

// Password change form schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function UserAccount() {
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  const { user, loginMutation } = useAuth();
  const { toast } = useToast();

  // If not logged in, redirect to the auth page
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Set up forms with default values from the user object
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user.username || "",
      email: user.email || "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Handle profile form submission
  const onProfileSubmit = async (data: ProfileFormValues) => {
    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        setUpdateSuccess(true);
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
          variant: "default",
        });
      } else {
        const errorData = await response.json();
        setUpdateError(errorData.message || "Failed to update profile");
      }
    } catch (error) {
      setUpdateError("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle password form submission
  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setIsChangingPassword(true);
    setPasswordError(null);
    setPasswordChangeSuccess(false);
    
    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      
      if (response.ok) {
        setPasswordChangeSuccess(true);
        passwordForm.reset();
        toast({
          title: "Password Changed",
          description: "Your password has been updated successfully.",
          variant: "default",
        });
      } else {
        const errorData = await response.json();
        setPasswordError(errorData.message || "Failed to update password");
      }
    } catch (error) {
      setPasswordError("An unexpected error occurred");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <Header />
      <main className="flex-grow container mx-auto p-6 pt-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">My Account</h1>
          
          <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger value="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>Password</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                <span>Orders</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="border-none bg-gray-800/50 text-white">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription className="text-gray-400">
                    Update your account details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {updateSuccess && (
                    <Alert className="bg-green-900/40 border-green-900 text-white mb-4">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Success</AlertTitle>
                      <AlertDescription>
                        Your profile has been updated successfully.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {updateError && (
                    <Alert variant="destructive" className="bg-red-900/40 border-red-900 text-white mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{updateError}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Your username" 
                                {...field} 
                                className="bg-gray-700 border-gray-600"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="Your email address" 
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
                        className="mt-6" 
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Update Profile
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Password Tab */}
            <TabsContent value="password">
              <Card className="border-none bg-gray-800/50 text-white">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription className="text-gray-400">
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {passwordChangeSuccess && (
                    <Alert className="bg-green-900/40 border-green-900 text-white mb-4">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Success</AlertTitle>
                      <AlertDescription>
                        Your password has been changed successfully.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {passwordError && (
                    <Alert variant="destructive" className="bg-red-900/40 border-red-900 text-white mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{passwordError}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Your current password" 
                                {...field} 
                                className="bg-gray-700 border-gray-600"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Your new password" 
                                {...field} 
                                className="bg-gray-700 border-gray-600"
                              />
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
                            <FormLabel>Confirm New Password</FormLabel>
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
                      
                      <Button 
                        type="submit" 
                        className="mt-6" 
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Change Password
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card className="border-none bg-gray-800/50 text-white">
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription className="text-gray-400">
                    View your past orders and track current ones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-medium mb-2">No orders yet</h3>
                    <p className="text-gray-400 mb-6">When you place orders, they will appear here.</p>
                    <Button 
                      onClick={() => window.location.href = "/"} 
                      className="inline-flex"
                    >
                      Start Ordering
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}