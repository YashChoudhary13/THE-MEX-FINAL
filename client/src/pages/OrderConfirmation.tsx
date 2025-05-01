import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { CheckCircle, ChevronLeft, Truck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Order } from "@shared/schema";

export default function OrderConfirmation() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  
  const orderId = parseInt(id || "0");
  
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
      <div className="container mx-auto px-4 py-12 flex-grow">
        <div className="max-w-3xl mx-auto">
          <Button 
            variant="outline" 
            className="mb-6 flex items-center gap-2"
            onClick={() => navigate("/")}
          >
            <ChevronLeft size={16} />
            Back to Menu
          </Button>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-primary text-white p-6 flex items-center justify-center">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                <h1 className="text-2xl font-bold">Order Confirmed!</h1>
                <p className="opacity-90 mt-1">Thank you for your order.</p>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-secondary">Order #{order.id}</h2>
                  <p className="text-gray-600 text-sm">Estimated delivery: 30-45 minutes</p>
                </div>
                <div className="bg-gray-100 p-2 rounded-full">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
              </div>
              
              <div className="border rounded-lg mb-6">
                <div className="bg-gray-50 p-3 border-b">
                  <h3 className="font-medium">Order Details</h3>
                </div>
                <div className="p-4 divide-y">
                  {orderItems.map((item: any, index: number) => (
                    <div key={index} className="py-3 flex justify-between">
                      <div>
                        <span className="font-medium text-secondary">{item.quantity}x</span>
                        <span className="ml-2">{item.name}</span>
                      </div>
                      <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 p-4 border-t">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Delivery Fee</span>
                    <span>${order.deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-3">
                    <span>Tax</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-secondary">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg">
                <div className="bg-gray-50 p-3 border-b">
                  <h3 className="font-medium">Delivery Information</h3>
                </div>
                <div className="p-4 space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {order.customerName}</p>
                  <p><span className="font-medium">Phone:</span> {order.customerPhone}</p>
                  {order.customerEmail && (
                    <p><span className="font-medium">Email:</span> {order.customerEmail}</p>
                  )}
                  <p><span className="font-medium">Address:</span> {order.deliveryAddress}</p>
                  <p><span className="font-medium">City:</span> {order.city}, {order.zipCode}</p>
                  {order.deliveryInstructions && (
                    <p><span className="font-medium">Instructions:</span> {order.deliveryInstructions}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-8 text-center space-y-4">
                <div>
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={() => navigate(`/tracking/${order.id}`)}
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
