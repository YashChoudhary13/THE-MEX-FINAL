import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { ChevronLeft, Truck, Clock } from "lucide-react";
import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Order } from "@shared/schema";

import { useToast } from "@/hooks/use-toast";


export default function OrderConfirmation() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const orderId = parseInt(id || "0");
  

  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    
  }, []);
  
  const { data: order, isLoading, isError } = useQuery<Order>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId && !isNaN(orderId)
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto px-4 py-12 flex-grow">
          <div className="max-w-3xl mx-auto">
            <Skeleton className="h-12 w-2/3 mb-8" />
            <div className="bg-white rounded-lg shadow-md p-6">
              <Skeleton className="h-8 w-full mb-4" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-6" />
              
              <Skeleton className="h-24 w-full mb-6" />
              
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto px-4 py-12 flex-grow flex flex-col items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-secondary mb-4">Order Not Found</h1>
            <p className="text-gray-600 mb-6">We couldn't find the order you're looking for.</p>
            <Button onClick={() => navigate("/")} className="bg-primary hover:bg-primary/90">
              Back to Menu
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Parse items from JSON if needed
  const orderItems = typeof order.items === 'string' 
    ? JSON.parse(order.items) 
    : order.items;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="outline" 
            className="mb-4 flex items-center gap-2"
            onClick={() => navigate("/")}
          >
            <ChevronLeft size={16} />
            Back to Menu
          </Button>
          
          <div className="bg-background border border-border rounded-xl shadow-md overflow-hidden">
            <div className="bg-primary/95 text-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold">ORDER #{order.dailyOrderNumber || order.id}</h1>
                  <div className="flex items-center gap-1 text-white/80 mt-1">
                    <Clock className="h-4 w-4" />
                    <p className="text-sm">Estimated pickup: 30-45 minutes</p>
                  </div>
                </div>
                <div className="bg-white/10 p-2 rounded-lg">
                  <Truck className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="p-5">              
              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-medium text-lg text-primary mb-3">Order Items</h3>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="divide-y divide-border">
                    {orderItems.map((item: any, index: number) => (
                      <div key={index} className="py-3 px-4 flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="font-bold text-primary">{item.quantity}×</span>
                          <span className="ml-3 font-medium">{item.name}</span>
                        </div>
                        <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-muted/30 p-4 border-t border-border">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">${order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Service Fee</span>
                      <span className="font-medium">${order.serviceFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="font-medium">${order.tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-border pt-2 mt-2">
                      <div className="flex justify-between font-bold text-xl">
                        <span className="text-primary">Total</span>
                        <span>${order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Customer Information */}
              <div className="mb-6">
                <h3 className="font-medium text-lg text-primary mb-3">Customer Information</h3>
                <div className="border border-border rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{order.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{order.customerPhone}</p>
                    </div>
                    {order.customerEmail && (
                      <div className="col-span-1 md:col-span-2">
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{order.customerEmail}</p>
                      </div>
                    )}
                    {order.preparationInstructions && (
                      <div className="col-span-1 md:col-span-2">
                        <p className="text-sm text-muted-foreground">Preparation Instructions</p>
                        <p className="font-medium">{order.preparationInstructions}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-8 text-center space-y-4">
                <div>
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={() => {
                      console.log('Track Order clicked, navigating to:', `/tracking/${order.id}`);
                      navigate(`/tracking/${order.id}`);
                    }}
                  >
                    Track Your Order
                  </Button>
                </div>

                
                <div>
                  <p className="text-gray-600 mb-2">Questions about your order? Contact us at</p>
                  <p className="text-primary font-medium">(555) 123-4567 or info@themex.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
