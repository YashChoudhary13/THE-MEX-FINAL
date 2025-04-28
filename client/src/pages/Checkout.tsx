import { useState } from "react";
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
  const { cart, calculateTotals, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(CheckoutStep.Delivery);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { subtotal, deliveryFee, tax, total } = calculateTotals();

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
        deliveryFee,
        tax,
        total,
        status: "pending",
        items: cart.map(item => ({
          id: item.id,
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
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
          <div className="text-center">
            <h1 className="text-3xl font-bold text-secondary mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-6">Please add some items to your cart before proceeding to checkout.</p>
            <Button onClick={() => navigate("/")} className="bg-primary hover:bg-primary/90">
              Back to Menu
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
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b p-4 bg-secondary text-white rounded-t-lg">
            <h1 className="text-xl font-bold">Checkout</h1>
          </div>

          {/* Step Indicators */}
          <div className="flex p-6 border-b">
            <div className="flex-1 text-center">
              <div className={`w-8 h-8 ${currentStep === CheckoutStep.Delivery ? 'bg-primary' : 'bg-gray-300'} text-white rounded-full mx-auto flex items-center justify-center`}>1</div>
              <span className={`text-xs mt-1 block font-medium ${currentStep === CheckoutStep.Delivery ? 'text-primary' : 'text-gray-500'}`}>Delivery</span>
            </div>
            <div className="flex-1 flex items-center">
              <div className={`h-1 ${currentStep >= CheckoutStep.Payment ? 'bg-primary' : 'bg-gray-300'} flex-1`}></div>
            </div>
            <div className="flex-1 text-center">
              <div className={`w-8 h-8 ${currentStep === CheckoutStep.Payment ? 'bg-primary' : 'bg-gray-300'} text-white rounded-full mx-auto flex items-center justify-center`}>2</div>
              <span className={`text-xs mt-1 block font-medium ${currentStep === CheckoutStep.Payment ? 'text-primary' : 'text-gray-500'}`}>Payment</span>
            </div>
            <div className="flex-1 flex items-center">
              <div className={`h-1 ${currentStep >= CheckoutStep.Confirmation ? 'bg-primary' : 'bg-gray-300'} flex-1`}></div>
            </div>
            <div className="flex-1 text-center">
              <div className={`w-8 h-8 ${currentStep === CheckoutStep.Confirmation ? 'bg-primary' : 'bg-gray-300'} text-white rounded-full mx-auto flex items-center justify-center`}>3</div>
              <span className={`text-xs mt-1 block font-medium ${currentStep === CheckoutStep.Confirmation ? 'text-primary' : 'text-gray-500'}`}>Confirmation</span>
            </div>
          </div>

          <div className="p-6">
            {currentStep === CheckoutStep.Delivery && (
              <div>
                <h2 className="font-heading text-lg font-bold mb-4 text-secondary">Delivery Information</h2>
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
                <h2 className="font-heading text-lg font-bold mb-4 text-secondary">Payment Method</h2>
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <p className="text-center text-gray-600">This is a demo application. No payment will be processed.</p>
                  <p className="text-center text-gray-600 mt-2">In a real application, you would see payment options here.</p>
                </div>
                <div className="border p-4 rounded-lg">
                  <h3 className="font-medium text-secondary mb-2">Cash on Delivery</h3>
                  <p className="text-sm text-gray-600">Pay with cash upon delivery</p>
                </div>
              </div>
            )}

            {currentStep === CheckoutStep.Confirmation && (
              <div>
                <h2 className="font-heading text-lg font-bold mb-4 text-secondary">Order Summary</h2>
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b">
                      <h3 className="font-medium">Items in your order</h3>
                    </div>
                    <div className="p-3 divide-y">
                      {cart.map((item) => (
                        <div key={item.id} className="py-2 flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="font-medium text-secondary">{item.quantity}x</span>
                            <span className="ml-2">{item.name}</span>
                          </div>
                          <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b">
                      <h3 className="font-medium">Delivery Details</h3>
                    </div>
                    <div className="p-3 space-y-2 text-sm">
                      <p><span className="font-medium">Name:</span> {form.getValues("customerName")}</p>
                      <p><span className="font-medium">Phone:</span> {form.getValues("customerPhone")}</p>
                      <p><span className="font-medium">Address:</span> {form.getValues("deliveryAddress")}</p>
                      <p><span className="font-medium">City:</span> {form.getValues("city")}, {form.getValues("zipCode")}</p>
                      {form.getValues("deliveryInstructions") && (
                        <p><span className="font-medium">Instructions:</span> {form.getValues("deliveryInstructions")}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Summary (visible in all steps) */}
            <div className="mt-8 border-t pt-4">
              <h3 className="font-medium text-secondary mb-3">Order Total</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-secondary">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
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
