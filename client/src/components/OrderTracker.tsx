import React from 'react';
import { useOrderTracker, OrderStatus } from '@/hooks/use-order-tracker';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCcw, ShoppingBag, Check, ChefHat, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { format, formatDistance } from 'date-fns';

interface OrderTrackerProps {
  orderId: number;
  onRefresh?: () => void;
}

export default function OrderTracker({ orderId, onRefresh }: OrderTrackerProps) {
  const { order, isLoading, error, isConnected, refreshOrder } = useOrderTracker(orderId);
  
  const getProgressValue = (): number => {
    if (!order || !order.status) return 0;
    
    switch (order.status) {
      case OrderStatus.PENDING:
        return 10;
      case OrderStatus.CONFIRMED:
        return 30;
      case OrderStatus.PREPARING:
        return 60;
      case OrderStatus.READY:
        return 90;
      case OrderStatus.DELIVERED:
      case OrderStatus.COMPLETED:
        return 100;
      case OrderStatus.CANCELLED:
        return 0;
      default:
        return 0;
    }
  };
  
  const getStatusText = (): string => {
    if (!order || !order.status) return 'Loading order information...';
    
    switch (order.status) {
      case OrderStatus.PENDING:
        return 'Your order has been received and is awaiting confirmation.';
      case OrderStatus.CONFIRMED:
        return 'Your order has been confirmed and will be prepared soon.';
      case OrderStatus.PREPARING:
        return 'Your order is being prepared by our chefs.';
      case OrderStatus.READY:
        return 'Your order is ready for pickup!';
      case OrderStatus.COMPLETED:
        return 'Your order has been completed and delivered!';
      case OrderStatus.CANCELLED:
        return 'Your order has been cancelled.';
      default:
        return 'Order status unknown';
    }
  };
  
  const getStatusEmoji = () => {
    if (!order || !order.status) return <Loader2 className="h-6 w-6 animate-spin" />;
    
    switch (order.status) {
      case OrderStatus.PENDING:
        return <Clock className="h-6 w-6 text-secondary" />;
      case OrderStatus.CONFIRMED:
        return <Check className="h-6 w-6 text-primary" />;
      case OrderStatus.PREPARING:
        return <ChefHat className="h-6 w-6 text-primary" />;
      case OrderStatus.READY:
        return <ShoppingBag className="h-6 w-6 text-primary" />;
      case OrderStatus.DELIVERED:
      case OrderStatus.COMPLETED:
        return <Check className="h-6 w-6 text-primary" />;
      case OrderStatus.CANCELLED:
        return <XCircle className="h-6 w-6 text-destructive" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-secondary" />;
    }
  };
  
  const formatTimeDisplay = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return format(date, 'h:mm a');
    } catch (e) {
      return 'Invalid time';
    }
  };
  
  const formatTimeSince = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return formatDistance(date, new Date(), { addSuffix: true });
    } catch (e) {
      return '';
    }
  };
  
  const handleRefresh = () => {
    refreshOrder();
    if (onRefresh) onRefresh();
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">Tracking Order #{orderId}</CardTitle>
          <CardDescription>Loading order information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">Tracking Order #{orderId}</CardTitle>
          <CardDescription>Error loading order</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-destructive flex flex-col items-center py-6 space-y-4">
            <AlertTriangle className="h-12 w-12" />
            <p>There was an error loading your order. Please try again.</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">Tracking Order #{orderId}</CardTitle>
          <CardDescription>Order not found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex flex-col items-center py-6 space-y-4">
            <ShoppingBag className="h-12 w-12" />
            <p>We couldn't find this order. Please check your order number and try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">Order #{(order as any)?.dailyOrderNumber || order.id}</CardTitle>
            <CardDescription>
              Placed {formatTimeSince(order.createdAt)}
            </CardDescription>
          </div>
          <Badge variant={order.status === OrderStatus.CANCELLED ? 'destructive' : 'default'}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Order status indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              {getStatusEmoji()}
              <span className="font-medium">{getStatusText()}</span>
            </div>
            {order.estimatedReadyTime && order.status !== OrderStatus.CANCELLED && (
              <div className="text-xs font-medium text-muted-foreground">
                Est. ready by {formatTimeDisplay(order.estimatedReadyTime)}
              </div>
            )}
          </div>
          
          {order.status !== OrderStatus.CANCELLED && (
            <Progress value={getProgressValue()} className="h-2" />
          )}
        </div>
        
        {/* Order details */}
        <div className="border rounded-lg divide-y">
          <div className="p-3 bg-muted/50">
            <h3 className="font-semibold text-sm">Order Summary</h3>
          </div>
          
          {/* Order items */}
          <div className="p-3 divide-y">
            {order.items.map((item) => (
              <div key={item.id} className="py-2 flex justify-between">
                <div className="flex gap-2">
                  <span>{item.quantity}x</span>
                  <span>{item.name}</span>
                </div>
                <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          {/* Order total */}
          <div className="p-3 bg-muted/30 flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-bold">${order.total.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Pickup information */}
        <div className="border rounded-lg p-3 space-y-2">
          <h3 className="font-semibold text-sm">Pickup Information</h3>
          <div className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Name:</span> {order.customerName}</p>
            <p><span className="text-muted-foreground">Phone:</span> {order.customerPhone}</p>
            <p className="text-muted-foreground text-xs mt-2">
              Please bring your order number with you for pickup. Payment will be collected at the restaurant.
            </p>
          </div>
        </div>
        
        {/* Connection status */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-amber-500'}`}></div>
          <span>{isConnected ? 'Live updates active' : 'Waiting for connection...'}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCcw className="h-3.5 w-3.5 mr-2" />
          Refresh
        </Button>
        <Button variant="default" size="sm" onClick={() => window.location.href = '/'}>
          Return to Menu
        </Button>
      </CardFooter>
    </Card>
  );
}