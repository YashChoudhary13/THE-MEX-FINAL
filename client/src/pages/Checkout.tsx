import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CheckCircle } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";

import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PaymentPage from "./Payment";

enum CheckoutStep {
  CustomerInfo = 0,
  OrderConfirmation = 1,
  Payment = 2,
  Success = 3,
}

const checkoutFormSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  customerEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  preparationInstructions: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { cart, clearCart, promoCode, promoDiscount, applyPromoCode, clearPromoCode, calculateTotals } = useCart();

  const [currentStep, setCurrentStep] = useState(CheckoutStep.CustomerInfo);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [orderCompleted, setOrderCompleted] = useState(false);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      preparationInstructions: "",
    },
  });

  // Calculate totals from cart context
  const { subtotal, serviceFee, tax, discount, total } = calculateTotals();

  useEffect(() => {
    if (cart.length === 0 && currentStep !== CheckoutStep.Success && !orderCompleted) {
      setLocation("/");
    }
  }, [cart, setLocation, currentStep, orderCompleted]);

  const goToPreviousStep = () => {
    if (currentStep > CheckoutStep.CustomerInfo) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToNextStep = () => {
    if (currentStep < CheckoutStep.Success) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (cart.length === 0 && currentStep !== CheckoutStep.Success && !orderCompleted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-heading mb-4">Your cart is empty</h1>
            <Button onClick={() => setLocation("/")} className="bg-primary hover:bg-primary/90">
              Return to Menu
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) {
      setPromoError("Please enter a promo code");
      return;
    }

    setIsApplyingPromo(true);
    setPromoError("");
    
    try {
      const response = await apiRequest("POST", "/api/validate-promo", {
        code: promoCodeInput,
        orderTotal: subtotal,
      });
      
      const data = await response.json();
      
      if (data.valid) {
        applyPromoCode(promoCodeInput, data.discount || 0);
        setPromoCodeInput("");
        setPromoError("");
      } else {
        setPromoError(data.message || "Invalid promo code");
        clearPromoCode();
      }
    } catch (error) {
      setPromoError("Failed to validate promo code");
      clearPromoCode();
    } finally {
      setIsApplyingPromo(false);
    }
  };

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
              <div className="flex-1 text-center">
                <div className={`w-9 h-9 ${currentStep === CheckoutStep.OrderConfirmation ? 'bg-primary' : 'bg-secondary/20'} text-foreground rounded-full mx-auto flex items-center justify-center font-heading`}>2</div>
                <span className={`text-xs mt-2 block font-medium font-menu ${currentStep === CheckoutStep.OrderConfirmation ? 'text-primary' : 'text-muted-foreground'}`}>CONFIRM</span>
              </div>
              <div className="flex-1 text-center">
                <div className={`w-9 h-9 ${currentStep === CheckoutStep.Payment ? 'bg-primary' : 'bg-secondary/20'} text-foreground rounded-full mx-auto flex items-center justify-center font-heading`}>3</div>
                <span className={`text-xs mt-2 block font-medium font-menu ${currentStep === CheckoutStep.Payment ? 'text-primary' : 'text-muted-foreground'}`}>PAYMENT</span>
              </div>
              <div className="flex-1 text-center">
                <div className={`w-9 h-9 ${currentStep === CheckoutStep.Success ? 'bg-primary' : 'bg-secondary/20'} text-foreground rounded-full mx-auto flex items-center justify-center font-heading`}>4</div>
                <span className={`text-xs mt-2 block font-medium font-menu ${currentStep === CheckoutStep.Success ? 'text-primary' : 'text-muted-foreground'}`}>SUCCESS</span>
              </div>
            </div>

            {/* Step Content */}
            <div className="p-6">
              {currentStep === CheckoutStep.CustomerInfo && (
                <div>
                  <h2 className="font-heading text-lg font-bold mb-4 text-primary">Customer Information</h2>
                  <Form {...form}>
                    <form className="space-y-4">
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary font-medium">Full Name *</FormLabel>
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
                            <FormLabel className="text-primary font-medium">Phone Number *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your phone number" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="customerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary font-medium">Email Address (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="Enter your email address" 
                                {...field} 
                              />
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
                            <FormLabel className="text-primary font-medium">Preparation Instructions (Optional)</FormLabel>
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
                      {cart.map((item: any, index: number) => (
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
                    <div className="p-3">
                      {!promoCode ? (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter promo code"
                            value={promoCodeInput}
                            onChange={(e) => setPromoCodeInput(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            onClick={handleApplyPromoCode}
                            disabled={isApplyingPromo}
                            variant="outline"
                          >
                            {isApplyingPromo ? "Applying..." : "Apply"}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-green-600 font-medium">
                            {promoCode} applied (-${promoDiscount.toFixed(2)})
                          </span>
                          <Button
                            onClick={() => {
                              clearPromoCode();
                              setPromoCodeInput("");
                              setPromoError("");
                            }}
                            variant="outline"
                            size="sm"
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                      {promoError && (
                        <p className="text-red-500 text-sm mt-2">{promoError}</p>
                      )}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="border rounded-lg overflow-hidden bg-card">
                    <div className="bg-primary/10 p-3 border-b">
                      <h3 className="font-medium text-primary">Order Summary</h3>
                    </div>
                    <div className="p-3 space-y-2">
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
                          setOrderCompleted(true);
                          setCurrentStep(CheckoutStep.Success);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          // Clear cart after a short delay to allow success screen to render
                          setTimeout(() => clearCart(), 100);
                        }}
                      />
                    );
                  })()}
                  
                </div>
              )}

              {currentStep === CheckoutStep.Success && (
                <div>
                  {(() => {
                    const completedOrderData = sessionStorage.getItem('completedOrder');
                    const orderData = completedOrderData ? JSON.parse(completedOrderData) : null;
                    
                    return (
                      <>
                        <div className="text-center mb-6">
                          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                          <h2 className="font-heading text-2xl font-bold text-green-600 mb-2">Order Placed Successfully!</h2>
                          <p className="text-muted-foreground mb-2">Thank you for your order. We'll prepare it for pickup.</p>
                          {orderData && (
                            <div className="bg-primary/10 rounded-lg p-3 mt-4">
                              <p className="text-sm font-medium text-primary">Order Number: #{orderData.dailyOrderNumber || orderData.id}</p>
                              <p className="text-xs text-muted-foreground">Keep this number for reference</p>
                            </div>
                          )}
                        </div>



                        <div className="space-y-4">
                          {/* Track Order Button - Navigate to tracking page */}
                          {orderData && (
                            <Button 
                              onClick={() => setLocation(`/tracking/${orderData.id}`)}
                              className="w-full bg-primary hover:bg-primary/90"
                            >
                              Track Your Order
                            </Button>
                          )}
                          
                          <div className="border rounded-lg overflow-hidden bg-card">
                            <div className="bg-primary/10 p-3 border-b">
                              <h3 className="font-medium text-primary">Items Ordered</h3>
                            </div>
                            <div className="p-3 divide-y divide-border">
                              {(orderData?.items || cart).map((item: any, index: number) => (
                                <div key={index} className="py-2 flex justify-between items-center">
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
                              <h3 className="font-medium text-primary">Order Summary</h3>
                            </div>
                            <div className="p-3 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-medium text-foreground">${(orderData?.subtotal || subtotal).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Service Fee</span>
                                <span className="font-medium text-foreground">${(orderData?.serviceFee || serviceFee).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tax</span>
                                <span className="font-medium text-foreground">${(orderData?.tax || tax).toFixed(2)}</span>
                              </div>
                              {(orderData?.discount || discount) > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                  <span>Discount ({orderData?.promoCode || promoCode})</span>
                                  <span>-${(orderData?.discount || discount).toFixed(2)}</span>
                                </div>
                              )}
                              <Separator />
                              <div className="flex justify-between font-bold text-lg">
                                <span className="text-primary">Total Paid</span>
                                <span className="text-foreground">${(orderData?.total || total).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-center mt-6 space-y-3">
                            <p className="text-sm text-muted-foreground">
                              Your order is being prepared. You'll receive notifications about status updates.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                              <Button 
                                onClick={() => setLocation("/")}
                                variant="outline"
                                className="w-full sm:w-auto"
                              >
                                Continue Shopping
                              </Button>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 p-6 bg-muted/20 border-t">
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
                {currentStep > CheckoutStep.CustomerInfo ? (
                  <Button 
                    onClick={goToPreviousStep} 
                    variant="outline"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    Back
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setLocation("/")} 
                    variant="outline"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
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
                    className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
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
                    className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                    disabled={isSubmitting}
                  >
                    Proceed to Payment
                  </Button>
                ) : currentStep === CheckoutStep.Payment ? (
                  <div className="text-center w-full">
                    <p className="text-sm text-muted-foreground">Complete payment to finish your order</p>
                  </div>
                ) : currentStep === CheckoutStep.Success ? (
                  <div className="text-center w-full">
                    <p className="text-sm text-green-600">Your order has been successfully placed!</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}