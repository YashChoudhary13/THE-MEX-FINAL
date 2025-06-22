import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, User, Lock, ShoppingBag, AlertCircle, CheckCircle2, Clock, MapPin, CreditCard } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Order, OrderItem } from "@shared/schema";

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

  // Fetch user orders (without polling - will use WebSocket for updates)
  const { data: userOrders = [], isLoading: isLoadingOrders, refetch: refetchOrders } = useQuery<Order[]>({
    queryKey: ['/api/user/orders'],
    enabled: !!user, // Only fetch if user is logged in
  });

  // Clear success states when switching tabs
  useEffect(() => {
    setUpdateSuccess(false);
    setPasswordChangeSuccess(false);
    setUpdateError(null);
    setPasswordError(null);
  }, [activeTab]);

  // WebSocket connection for real-time order updates
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('Connecting to WebSocket for user orders:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('🔌 User WebSocket connected for user', user?.id);
      // Subscribe to user-specific order updates
      ws.send(JSON.stringify({
        type: 'SUBSCRIBE_USER_ORDERS',
        userId: user?.id
      }));
      console.log('📩 Subscribed to user order updates for user', user?.id);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('🔄 User WebSocket message received:', data);
        
        if (data.type === 'ORDER_UPDATE' || data.type === 'NEW_ORDER') {
          console.log('🔄 Order update received - refetching orders');
          refetchOrders();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('User WebSocket connection failed:', error);
    };
    
    ws.onclose = () => {
      console.log('❌ User WebSocket disconnected for user', user?.id);
    };
    
    return () => {
      console.log('Cleaning up user WebSocket connection');
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user, refetchOrders]);

  // If not logged in, redirect to the auth page
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Set up forms with default values from the user object
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
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
                  {isLoadingOrders ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="ml-2">Loading your orders...</span>
                    </div>
                  ) : userOrders.length === 0 ? (
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
                  ) : (
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-4">
                        {userOrders.map((order) => (
                          <Card key={order.id} className="bg-gray-700/50 border-gray-600">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-lg font-semibold text-white">
                                      Order #{order.dailyOrderNumber || order.id}
                                    </h3>
                                    <Badge 
                                      variant={
                                        order.status === 'completed' ? 'default' :
                                        order.status === 'cancelled' ? 'destructive' :
                                        order.status === 'ready' ? 'secondary' :
                                        'outline'
                                      }
                                      className="capitalize"
                                    >
                                      {order.status}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-400">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {new Date(order.createdAt).toLocaleDateString('en-IE', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      <span>{order.deliveryAddress || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <CreditCard className="h-4 w-4" />
                                      €{(order.total || 0).toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Order Items */}
                              {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                                <div className="border-t border-gray-600 pt-4">
                                  <div className="text-sm font-medium mb-2 text-gray-300">Ordered Items:</div>
                                  <div className="space-y-2">
                                    {(order.items as OrderItem[]).map((item: OrderItem, idx: number) => (
                                      <div key={idx} className="flex items-center justify-between text-sm">
                                        <span className="text-white">{item.quantity}x {item.name}</span>
                                        <span className="text-gray-400">€{(item.price * item.quantity).toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Order Summary */}
                                  <div className="mt-4 pt-2 border-t border-gray-600">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-400">Subtotal:</span>
                                      <span className="text-white">€{((order.total || 0) - (order.serviceFee || 0)).toFixed(2)}</span>
                                    </div>
                                    {order.serviceFee && order.serviceFee > 0 && (
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Service Fee:</span>
                                        <span className="text-white">€{(order.serviceFee || 0).toFixed(2)}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between text-base font-semibold">
                                      <span className="text-white">Total:</span>
                                      <span className="text-white">€{(order.total || 0).toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                              
                              {/* Additional Order Info */}
                              <div className="mt-4 text-xs text-gray-500">
                                {order.customerName && (
                                  <div>Customer: {order.customerName}</div>
                                )}
                                {order.customerPhone && (
                                  <div>Phone: {order.customerPhone}</div>
                                )}
                                {order.paymentReference && (
                                  <div>Payment Reference: {order.paymentReference}</div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
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