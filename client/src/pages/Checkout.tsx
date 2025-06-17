import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Bell, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart } from "@/context/CartContext";
import { useNotifications } from "@/context/NotificationContext";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PaymentPage from "@/pages/Payment";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Form validation schema for pickup-only
const checkoutFormSchema = z.object({
  customerName: z.string().min(2, { message: "Name is required" }),
  customerEmail: z.string().email({ message: "Valid email is required" }).optional().or(z.literal("")),
  customerPhone: z.string().min(6, { message: "Phone number is required" }),
  preparationInstructions: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

enum CheckoutStep {
  CustomerInfo = 1,
  OrderConfirmation = 2,
  Payment = 3,
  Success = 4,
}

export default function Checkout() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { 
    cart, 
    calculateTotals, 
    clearCart,
    promoCode,
    setPromoCode,
    promoDiscount,
    applyPromoCode,
    clearPromoCode
  } = useCart();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(CheckoutStep.CustomerInfo);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const { 
    isNotificationsEnabled, 
    notificationStatus, 
    isBrowserSupported, 
    checkPermission, 
    requestPermission 
  } = useNotifications();

  const { subtotal, serviceFee, tax, discount, total } = calculateTotals();
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Check notification permission status
    const checkNotificationStatus = async () => {
      await checkPermission();
    };
    
    checkNotificationStatus();
  }, [checkPermission]);

  // Initialize form
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      preparationInstructions: "",
    },
  });

  const onSubmit = async (data: CheckoutFormValues) => {
    // Check if cart is empty
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Please add some items before checkout.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Store checkout data for payment processing
      const orderData = {
        ...data,
        subtotal,
        serviceFee,
        tax,
        discount,
        total,
        promoCode: promoCode || null,
        items: cart.map(item => ({
          id: item.id,
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          prepTime: item.prepTime || null,
        })),
      };

      // Store order data in sessionStorage for payment processing
      sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
      
      // Move to payment step instead of creating order immediately
      setCurrentStep(CheckoutStep.Payment);

      toast({
        title: "Proceeding to Payment",
        description: "Please complete your payment to confirm the order.",
      });
    } catch (error) {
      console.error("Failed to place order:", error);
      toast({
        title: "Failed to Place Order",
        description: "There was an issue processing your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToNextStep = () => {
    if (currentStep < CheckoutStep.Success) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > CheckoutStep.CustomerInfo) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleRequestNotifications = async () => {
    try {
      // If browser doesn't support notifications
      if (!isBrowserSupported) {
        toast({
          title: "Notifications Not Supported",
          description: "Your browser doesn't support notifications. Try using a modern browser like Chrome or Firefox.",
          variant: "destructive",
        });
        return;
      }
      
      // If notifications are already denied and can't be requested again
      if (notificationStatus === 'unavailable') {
        toast({
          title: "Notification Permission Blocked",
          description: "Notifications are blocked in your browser settings. Please enable them in your browser settings to receive order updates.",
          variant: "destructive",
        });
        return;
      }
      
      // Request permission
      const granted = await requestPermission();
      
      if (granted) {
        toast({
          title: "Notifications Enabled",
          description: "You will receive notifications about your order status updates.",
        });
      } else {
        if (notificationStatus === 'denied') {
          toast({
            title: "Notifications Blocked",
            description: "You blocked notifications. To enable them, please update your browser settings.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Notifications Not Enabled",
            description: "You'll need to enable notifications to receive order status updates.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Notification Error",
        description: "Could not request notification permissions. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto px-4 py-12 flex-grow flex flex-col items-center justify-center">
          <div className="text-center max-w-md p-8 rounded-xl bg-card border border-border">
            <h1 className="text-3xl font-heading bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent mb-6">YOUR CART IS EMPTY</h1>
            <p className="text-muted-foreground mb-8">Please add some items to your cart before proceeding to checkout.</p>
            <Button 
              onClick={() => navigate("/")} 
              className="bg-primary hover:bg-primary/90 font-menu text-lg py-6 px-8"
            >
              EXPLORE MENU
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-6 flex-grow">
        <div className="max-w-3xl mx-auto bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          <div className="border-b p-5 bg-gradient-to-r from-primary/20 to-background">
            <h1 className="text-2xl font-heading bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">CHECKOUT</h1>
          </div>

          {/* Step Indicators */}
          <div className="flex p-6 border-b border-border">
            <div className="flex-1 text-center">
              <div className={`w-9 h-9 ${currentStep === CheckoutStep.CustomerInfo ? 'bg-primary' : 'bg-secondary/20'} text-foreground rounded-full mx-auto flex items-center justify-center font-heading`}>1</div>
              <span className={`text-xs mt-2 block font-medium font-menu ${currentStep === CheckoutStep.CustomerInfo ? 'text-primary' : 'text-muted-foreground'}`}>CUSTOMER</span>
            </div>
            <div className="flex-1 flex items-center">
              <div className={`h-1 ${currentStep >= CheckoutStep.OrderConfirmation ? 'bg-primary' : 'bg-muted'} flex-1`}></div>
            </div>
            <div className="flex-1 text-center">
              <div className={`w-9 h-9 ${currentStep === CheckoutStep.OrderConfirmation ? 'bg-primary' : 'bg-secondary/20'} text-foreground rounded-full mx-auto flex items-center justify-center font-heading`}>2</div>
              <span className={`text-xs mt-2 block font-medium font-menu ${currentStep === CheckoutStep.OrderConfirmation ? 'text-primary' : 'text-muted-foreground'}`}>CONFIRM</span>
            </div>
            <div className="flex-1 flex items-center">
              <div className={`h-1 ${currentStep >= CheckoutStep.Payment ? 'bg-primary' : 'bg-muted'} flex-1`}></div>
            </div>
            <div className="flex-1 text-center">
              <div className={`w-9 h-9 ${currentStep === CheckoutStep.Payment ? 'bg-primary' : 'bg-secondary/20'} text-foreground rounded-full mx-auto flex items-center justify-center font-heading`}>3</div>
              <span className={`text-xs mt-2 block font-medium font-menu ${currentStep === CheckoutStep.Payment ? 'text-primary' : 'text-muted-foreground'}`}>PAYMENT</span>
            </div>
            <div className="flex-1 flex items-center">
              <div className={`h-1 ${currentStep >= CheckoutStep.Success ? 'bg-primary' : 'bg-muted'} flex-1`}></div>
            </div>
            <div className="flex-1 text-center">
              <div className={`w-9 h-9 ${currentStep === CheckoutStep.Success ? 'bg-primary' : 'bg-secondary/20'} text-foreground rounded-full mx-auto flex items-center justify-center font-heading`}>4</div>
              <span className={`text-xs mt-2 block font-medium font-menu ${currentStep === CheckoutStep.Success ? 'text-primary' : 'text-muted-foreground'}`}>SUCCESS</span>
            </div>
          </div>

          <div className="p-6">
            {currentStep === CheckoutStep.CustomerInfo && (
              <div>
                <h2 className="font-heading text-lg font-bold mb-4 text-primary">Customer Information</h2>
                <Form {...form}>
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="preparationInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preparation Instructions (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any special requests for food preparation" 
                              className="resize-none" 
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>
            )}

            {currentStep === CheckoutStep.OrderConfirmation && (
              <div>
                <h2 className="font-heading text-lg font-bold mb-4 text-primary">Order Confirmation</h2>
                
                {/* Cart Summary */}
                <div className="border rounded-lg overflow-hidden bg-card mb-6">
                  <div className="bg-primary/10 p-3 border-b">
                    <h3 className="font-medium text-primary">Your Order</h3>
                  </div>
                  <div className="p-3 space-y-3">
                    {cart.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <div className="flex-1">
                          <span className="font-medium text-foreground">{item.name}</span>
                          <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                        </div>
                        <span className="font-medium text-foreground">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Details */}
                <div className="border rounded-lg overflow-hidden bg-card mb-6">
                  <div className="bg-primary/10 p-3 border-b">
                    <h3 className="font-medium text-primary">Pickup Details</h3>
                  </div>
                  <div className="p-3 space-y-2 text-sm">
                    <p><span className="font-medium text-primary">Name:</span> <span className="text-foreground">{form.getValues("customerName")}</span></p>
                    <p><span className="font-medium text-primary">Phone:</span> <span className="text-foreground">{form.getValues("customerPhone")}</span></p>
                    {form.getValues("customerEmail") && (
                      <p><span className="font-medium text-primary">Email:</span> <span className="text-foreground">{form.getValues("customerEmail")}</span></p>
                    )}
                    {form.getValues("preparationInstructions") && (
                      <p><span className="font-medium text-primary">Preparation Instructions:</span> <span className="text-foreground">{form.getValues("preparationInstructions")}</span></p>
                    )}
                  </div>
                </div>

                {/* Promo Code Section */}
                <div className="border rounded-lg overflow-hidden bg-card mb-6">
                  <div className="bg-primary/10 p-3 border-b">
                    <h3 className="font-medium text-primary">Promo Code</h3>
                  </div>
                  <div className="p-4">
                    {promoDiscount > 0 ? (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-700 font-medium">Promo code "{promoCode}" applied</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            clearPromoCode();
                            setPromoCodeInput("");
                          }}
                          className="text-green-700 hover:text-green-800"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Enter promo code"
                            value={promoCodeInput}
                            onChange={(e) => setPromoCodeInput(e.target.value)}
                            className="flex-1"
                            disabled={isApplyingPromo}
                          />
                          <Button 
                            onClick={async () => {
                              if (!promoCodeInput.trim()) return;
                              
                              setIsApplyingPromo(true);
                              try {
                                await applyPromoCode(promoCodeInput.trim());
                                toast({
                                  title: "Promo code applied!",
                                  description: `You saved $${promoDiscount.toFixed(2)}`,
                                });
                              } catch (error: any) {
                                toast({
                                  title: "Invalid promo code",
                                  description: error.message || "Please check your promo code and try again.",
                                  variant: "destructive",
                                });
                              }
                              setIsApplyingPromo(false);
                            }}
                            disabled={isApplyingPromo || !promoCodeInput.trim()}
                          >
                            {isApplyingPromo ? "Applying..." : "Apply"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Total */}
                <div className="border rounded-lg overflow-hidden bg-card">
                  <div className="bg-primary/10 p-3 border-b">
                    <h3 className="font-medium text-primary">Order Total</h3>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service Fee</span>
                      <span className="font-medium text-foreground">${serviceFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="font-medium text-foreground">${tax.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount ({promoCode})</span>
                        <span>-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span className="text-primary">Total</span>
                      <span className="text-foreground">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === CheckoutStep.Payment && (
              <div>
                <h2 className="font-heading text-lg font-bold mb-4 text-primary">Payment</h2>
                {(() => {
                  const pendingOrderData = sessionStorage.getItem('pendingOrder');
                  if (!pendingOrderData) {
                    return (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">No order data found. Please complete the customer information first.</p>
                        <Button 
                          onClick={() => setCurrentStep(CheckoutStep.CustomerInfo)}
                          variant="outline"
                        >
                          Go Back to Customer Info
                        </Button>
                      </div>
                    );
                  }
                  
                  const orderData = JSON.parse(pendingOrderData);
                  return (
                    <PaymentPage 
                      orderData={orderData}
                      onSuccess={() => {
                        clearCart();
                        setCurrentStep(CheckoutStep.Success);
                      }}
                    />
                  );
                })()}
                
                {"Notification" in window && (
                  <div className="mt-6 border p-4 rounded-lg bg-card">
                    <div className="flex items-center gap-2 mb-3">
                      <Bell className="h-5 w-5 text-primary" />
                      <h3 className="font-medium text-primary">Order Notifications</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {isNotificationsEnabled 
                        ? "You'll receive notifications when your order status changes" 
                        : "Enable notifications to get updated on your order status"}
                    </p>
                    {!isNotificationsEnabled && (
                      <Button 
                        onClick={handleRequestNotifications}
                        className="w-full"
                        variant="outline"
                      >
                        Enable Notifications
                      </Button>
                    )}
                    {isNotificationsEnabled && (
                      <div className="p-2 bg-primary/10 rounded-md text-sm text-center text-primary">
                        <span className="flex items-center justify-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Notifications Enabled
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentStep === CheckoutStep.Success && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="font-heading text-2xl font-bold text-primary mb-2">Order Confirmed!</h2>
                  <p className="text-muted-foreground">Thank you for your order. We'll prepare it for pickup.</p>
                </div>
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden bg-card">
                    <div className="bg-primary/10 p-3 border-b">
                      <h3 className="font-medium text-primary">Items in your order</h3>
                    </div>
                    <div className="p-3 divide-y divide-border">
                      {cart.map((item) => (
                        <div key={item.id} className="py-2 flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="font-medium text-primary">{item.quantity}x</span>
                            <span className="ml-2 text-foreground">{item.name}</span>
                          </div>
                          <span className="font-medium text-foreground">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden bg-card">
                    <div className="bg-primary/10 p-3 border-b">
                      <h3 className="font-medium text-primary">Pickup Details</h3>
                    </div>
                    <div className="p-3 space-y-2 text-sm">
                      <p><span className="font-medium text-primary">Name:</span> <span className="text-foreground">{form.getValues("customerName")}</span></p>
                      <p><span className="font-medium text-primary">Phone:</span> <span className="text-foreground">{form.getValues("customerPhone")}</span></p>
                      {form.getValues("customerEmail") && (
                        <p><span className="font-medium text-primary">Email:</span> <span className="text-foreground">{form.getValues("customerEmail")}</span></p>
                      )}
                      {form.getValues("preparationInstructions") && (
                        <p><span className="font-medium text-primary">Preparation Instructions:</span> <span className="text-foreground">{form.getValues("preparationInstructions")}</span></p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Summary (visible in all steps) */}
            <div className="mt-8 border-t pt-4">
              <h3 className="font-medium text-primary mb-3">Order Total</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service Fee</span>
                  <span className="font-medium text-foreground">${serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium text-foreground">${tax.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-500 flex items-center">
                      Promo ({promoCode}) <span className="ml-1 text-[10px] bg-green-500/10 px-1 py-0.5 rounded">APPLIED</span>
                    </span>
                    <span className="font-medium text-green-500">-${discount.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span className="text-primary">Total</span>
                  <span className="text-foreground">${total.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Promo Code Input */}
              {currentStep === CheckoutStep.Payment && (
                <div className="mt-4 pt-4">
                  <h4 className="text-sm font-medium mb-2">Have a Promo Code?</h4>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter promo code"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      className="flex-1"
                      disabled={isApplyingPromo || promoDiscount > 0}
                    />
                    {promoDiscount > 0 ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-red-500 text-red-500 hover:bg-red-500/10"
                        onClick={() => {
                          clearPromoCode();
                          setPromoCodeInput("");
                        }}
                        disabled={isApplyingPromo}
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-primary text-primary hover:bg-primary/10"
                        onClick={async () => {
                          if (!promoCodeInput.trim()) return;
                          
                          setIsApplyingPromo(true);
                          const success = await applyPromoCode(promoCodeInput);
                          
                          if (!success) {
                            toast({
                              title: "Invalid Promo Code",
                              description: "The promo code you entered is invalid or expired.",
                              variant: "destructive",
                            });
                          }
                          // No toast for success - discount is shown in the order summary
                          
                          setIsApplyingPromo(false);
                        }}
                        disabled={isApplyingPromo || !promoCodeInput.trim()}
                      >
                        {isApplyingPromo ? "Applying..." : "Apply"}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              {currentStep > CheckoutStep.CustomerInfo ? (
                <Button 
                  onClick={goToPreviousStep} 
                  variant="outline"
                  disabled={isSubmitting}
                >
                  Back
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate("/")} 
                  variant="outline"
                  disabled={isSubmitting}
                >
                  Return to Menu
                </Button>
              )}

              {currentStep === CheckoutStep.CustomerInfo ? (
                <Button 
                  onClick={() => {
                    form.trigger().then((isValid) => {
                      if (isValid) goToNextStep();
                    });
                  }}
                  className="bg-primary hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  Continue to Order Confirmation
                </Button>
              ) : currentStep === CheckoutStep.OrderConfirmation ? (
                <Button 
                  onClick={() => {
                    // Save order data to session storage and proceed to payment
                    const orderData = {
                      customerName: form.getValues("customerName"),
                      customerPhone: form.getValues("customerPhone"),
                      customerEmail: form.getValues("customerEmail"),
                      preparationInstructions: form.getValues("preparationInstructions"),
                      items: cart,
                      subtotal,
                      serviceFee,
                      tax,
                      discount,
                      total,
                      promoCode,
                      promoDiscount
                    };
                    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
                    goToNextStep();
                  }}
                  className="bg-primary hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  Proceed to Payment
                </Button>
              ) : currentStep === CheckoutStep.Payment ? (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Complete payment to finish your order</p>
                </div>
              ) : null}
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
