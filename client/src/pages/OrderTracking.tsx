import { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OrderTracker from '@/components/OrderTracker';
import { Loader2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Order } from '@shared/schema';
import { queryClient, getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useOrderTracker } from '@/hooks/use-order-tracker';

export default function OrderTracking() {
  const [, navigate] = useLocation();
  const { orderId } = useParams<{ orderId: string }>();
  const { toast } = useToast();
  const parsedOrderId = orderId ? parseInt(orderId) : null;
  
  // Get order details
  const { data: order, isLoading, error, refetch } = useQuery<Order>({
    queryKey: ['/api/orders', parsedOrderId],
    queryFn: parsedOrderId ? getQueryFn() : () => Promise.resolve(null),
    enabled: !!parsedOrderId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Order tracker hook (will connect via WebSocket)
  const { status } = useOrderTracker(parsedOrderId);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Could not load your order. Please try again.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleRefresh = () => {
    refetch();
  };

  if (!parsedOrderId) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header hideSearch />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-4">
            <ShoppingBag className="h-12 w-12 text-primary mx-auto" />
            <h1 className="text-2xl font-bold">No Order Selected</h1>
            <p className="text-muted-foreground">
              Please select an order to track or return to the home page.
            </p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Return to Home
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header hideSearch />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 pl-0 flex items-center gap-2 hover:bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Track Your Order</h1>
          <p className="text-muted-foreground">
            Real-time updates on your order status
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <OrderTracker orderId={parsedOrderId} onRefresh={handleRefresh} />
            </div>
            <div>
              <div className="border rounded-lg shadow-sm overflow-hidden bg-card">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-semibold text-primary">Actions</h3>
                </div>
                <div className="p-4 space-y-4">
                  <Button
                    onClick={() => navigate('/')}
                    className="w-full"
                    variant="outline"
                  >
                    Order More Food
                  </Button>
                  
                  <Button
                    onClick={() => window.location.reload()}
                    className="w-full"
                    variant="secondary"
                  >
                    Refresh Page
                  </Button>
                  
                  {/* Add contact support button */}
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Need Help?</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      If you have any questions about your order, please contact us.
                    </p>
                    <Link href="/contact">
                      <Button
                        className="w-full"
                        variant="default"
                      >
                        Contact Support
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}