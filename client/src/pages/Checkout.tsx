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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";

const checkoutFormSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  customerEmail: z.string().email("Please enter a valid email").optional().or(z.literal("")),
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
  const { cart, clearCart, subtotal, promoCode, promoDiscount, applyPromoCode, clearPromoCode } = useCart();
  const { requestPermission } = useNotifications();
  const [currentStep, setCurrentStep] = useState(CheckoutStep.CustomerInfo);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      preparationInstructions: "",
    },
  });

  // Fetch service fee
  const { data: serviceFeeData } = useQuery({
    queryKey: ["/api/system-settings/service-fee"],
  });

  const serviceFee = serviceFeeData?.serviceFee || 2.99;
  const tax = subtotal * 0.1;
  const discount = promoDiscount;
  const total = Math.max(0, subtotal + serviceFee + tax - discount);

  useEffect(() => {
    if (cart.length === 0) {
      navigate("/");
    }
  }, [cart, navigate]);

  const goToPreviousStep = () => {
    if (currentStep > CheckoutStep.CustomerInfo) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToNextStep = () => {
    if (currentStep < CheckoutStep.Success) {
      setCurrentStep(currentStep + 1);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-heading mb-4">Your cart is empty</h1>
            <Button onClick={() => navigate("/")} className="bg-primary hover:bg-primary/90">
              Return to Menu
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg shadow-lg overflow-hidden">
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
                                <Input placeholder="Your full name" {...field} />
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
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="Your phone number" {...field} />
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
                              <Input placeholder="Your email address" {...field} />
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
                                placeholder="Any special instructions for preparing your order..."
                                className="min-h-[80px]"
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
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Bell className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Enable Order Notifications</span>
                      </div>
                      <p className="text-xs text-blue-700 mb-3">Get notified when your order status changes</p>
                      {Notification.permission === "granted" ? (
                        <span className="text-xs text-green-600 flex items-center">
                          <CheckCircle className="h-4 w-4" />
                          Notifications Enabled
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={requestPermission}
                          className="text-blue-600 border-blue-300 hover:bg-blue-100"
                        >
                          Enable Notifications
                        </Button>
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

                    <div className="border rounded-lg overflow-hidden bg-card">
                      <div className="bg-primary/10 p-3 border-b">
                        <h3 className="font-medium text-primary">Order Summary</h3>
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
                          <span className="text-primary">Total Paid</span>
                          <span className="text-foreground">${total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-center mt-6">
                      <Button 
                        onClick={() => navigate("/")}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Continue Shopping
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between p-6 bg-muted/20 border-t">
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
              ) : currentStep === CheckoutStep.Success ? (
                <div className="text-center">
                  <p className="text-sm text-green-600">Your order has been successfully placed!</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}