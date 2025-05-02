import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart } from "@/context/CartContext";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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

// Form validation schema
const checkoutFormSchema = z.object({
  customerName: z.string().min(2, { message: "Name is required" }),
  customerEmail: z.string().email({ message: "Valid email is required" }).optional().or(z.literal("")),
  customerPhone: z.string().min(6, { message: "Phone number is required" }),
  deliveryAddress: z.string().min(5, { message: "Address is required" }),
  city: z.string().min(2, { message: "City is required" }),
  zipCode: z.string().min(4, { message: "Zip code is required" }),
  deliveryInstructions: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

enum CheckoutStep {
  Delivery = 1,
  Payment = 2,
  Confirmation = 3,
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
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(CheckoutStep.Delivery);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const { subtotal, serviceFee, tax, discount, total } = calculateTotals();
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Initialize form
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      deliveryAddress: "",
      city: "",
      zipCode: "",
      deliveryInstructions: "",
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

      // Create order payload
      const orderData = {
        ...data,
        subtotal,
        deliveryFee: serviceFee, // Map serviceFee to deliveryFee for the DB schema
        tax,
        discount,
        total,
        status: "pending",
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

      // Send order to the backend
      const response = await apiRequest("POST", "/api/orders", orderData);
      const order = await response.json();

      // Clear the cart
      clearCart();

      // Navigate to confirmation page
      navigate(`/order-confirmation/${order.id}`);

      toast({
        title: "Order Placed Successfully",
        description: "Your order has been placed and is being processed.",
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
    if (currentStep < CheckoutStep.Confirmation) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > CheckoutStep.Delivery) {
      setCurrentStep(currentStep - 1);
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
              <div className={`w-9 h-9 ${currentStep === CheckoutStep.Delivery ? 'bg-primary' : 'bg-secondary/20'} text-foreground rounded-full mx-auto flex items-center justify-center font-heading`}>1</div>
              <span className={`text-xs mt-2 block font-medium font-menu ${currentStep === CheckoutStep.Delivery ? 'text-primary' : 'text-muted-foreground'}`}>PICKUP</span>
            </div>
            <div className="flex-1 flex items-center">
              <div className={`h-1 ${currentStep >= CheckoutStep.Payment ? 'bg-primary' : 'bg-muted'} flex-1`}></div>
            </div>
            <div className="flex-1 text-center">
              <div className={`w-9 h-9 ${currentStep === CheckoutStep.Payment ? 'bg-primary' : 'bg-secondary/20'} text-foreground rounded-full mx-auto flex items-center justify-center font-heading`}>2</div>
              <span className={`text-xs mt-2 block font-medium font-menu ${currentStep === CheckoutStep.Payment ? 'text-primary' : 'text-muted-foreground'}`}>PAYMENT</span>
            </div>
            <div className="flex-1 flex items-center">
              <div className={`h-1 ${currentStep >= CheckoutStep.Confirmation ? 'bg-primary' : 'bg-muted'} flex-1`}></div>
            </div>
            <div className="flex-1 text-center">
              <div className={`w-9 h-9 ${currentStep === CheckoutStep.Confirmation ? 'bg-primary' : 'bg-secondary/20'} text-foreground rounded-full mx-auto flex items-center justify-center font-heading`}>3</div>
              <span className={`text-xs mt-2 block font-medium font-menu ${currentStep === CheckoutStep.Confirmation ? 'text-primary' : 'text-muted-foreground'}`}>CONFIRM</span>
            </div>
          </div>

          <div className="p-6">
            {currentStep === CheckoutStep.Delivery && (
              <div>
                <h2 className="font-heading text-lg font-bold mb-4 text-primary">Delivery Information</h2>
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
                      name="deliveryAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your city" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zip Code</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your zip code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="deliveryInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Instructions (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Add any specific delivery instructions here" 
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

            {currentStep === CheckoutStep.Payment && (
              <div>
                <h2 className="font-heading text-lg font-bold mb-4 text-primary">Payment Method</h2>
                <div className="bg-primary/10 p-4 rounded-lg mb-6 border border-border">
                  <p className="text-center text-foreground">This is a demo application. No payment will be processed.</p>
                  <p className="text-center text-muted-foreground mt-2">In a real application, you would see payment options here.</p>
                </div>
                <div className="border p-4 rounded-lg bg-card">
                  <h3 className="font-medium text-primary mb-2">Cash on Delivery</h3>
                  <p className="text-sm text-foreground">Pay with cash upon delivery</p>
                </div>
              </div>
            )}

            {currentStep === CheckoutStep.Confirmation && (
              <div>
                <h2 className="font-heading text-lg font-bold mb-4 text-primary">Order Summary</h2>
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
                      <h3 className="font-medium text-primary">Delivery Details</h3>
                    </div>
                    <div className="p-3 space-y-2 text-sm">
                      <p><span className="font-medium text-primary">Name:</span> <span className="text-foreground">{form.getValues("customerName")}</span></p>
                      <p><span className="font-medium text-primary">Phone:</span> <span className="text-foreground">{form.getValues("customerPhone")}</span></p>
                      <p><span className="font-medium text-primary">Address:</span> <span className="text-foreground">{form.getValues("deliveryAddress")}</span></p>
                      <p><span className="font-medium text-primary">City:</span> <span className="text-foreground">{form.getValues("city")}, {form.getValues("zipCode")}</span></p>
                      {form.getValues("deliveryInstructions") && (
                        <p><span className="font-medium text-primary">Instructions:</span> <span className="text-foreground">{form.getValues("deliveryInstructions")}</span></p>
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
                          
                          if (success) {
                            toast({
                              title: "Promo Code Applied",
                              description: `Discount of $${promoDiscount.toFixed(2)} has been applied to your order.`,
                            });
                          } else {
                            toast({
                              title: "Invalid Promo Code",
                              description: "The promo code you entered is invalid or expired.",
                              variant: "destructive",
                            });
                          }
                          
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
              {currentStep > CheckoutStep.Delivery ? (
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

              {currentStep < CheckoutStep.Confirmation ? (
                <Button 
                  onClick={() => {
                    // Validate form for step 1 before proceeding
                    if (currentStep === CheckoutStep.Delivery) {
                      form.trigger().then((isValid) => {
                        if (isValid) goToNextStep();
                      });
                    } else {
                      goToNextStep();
                    }
                  }}
                  className="bg-primary hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  Continue
                </Button>
              ) : (
                <Button 
                  onClick={() => form.handleSubmit(onSubmit)()}
                  className="bg-primary hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Place Order"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
