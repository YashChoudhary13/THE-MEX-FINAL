import { useEffect, useState } from 'react';
import { useOrderTracker, OrderStatus } from '@/hooks/use-order-tracker';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, ChefHat, Truck, Package, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface OrderTrackerProps {
  orderId: number;
  onRefresh?: () => void;
}

export default function OrderTracker({ orderId, onRefresh }: OrderTrackerProps) {
  const { order, status, isConnected, error } = useOrderTracker(orderId);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Update the last updated time whenever order updates
  useEffect(() => {
    if (order) {
      setLastUpdated(new Date());
    }
  }, [order]);

  // Calculate progress based on status
  const getProgress = (): number => {
    switch (status) {
      case OrderStatus.PENDING:
        return 0;
      case OrderStatus.CONFIRMED:
        return 25;
      case OrderStatus.PREPARING:
        return 50;
      case OrderStatus.READY:
        return 75;
      case OrderStatus.DELIVERED:
        return 100;
      case OrderStatus.CANCELLED:
        return 100;
      default:
        return 0;
    }
  };

  // Get status-specific properties (icon, color, label)
  const getStatusProps = () => {
    switch (status) {
      case OrderStatus.PENDING:
        return {
          icon: <Clock className="h-8 w-8 text-amber-500" />,
          color: 'text-amber-500',
          bgColor: 'bg-amber-500',
          label: 'Order Received',
          description: 'We\'ve received your order and will confirm it shortly.'
        };
      case OrderStatus.CONFIRMED:
        return {
          icon: <CheckCircle2 className="h-8 w-8 text-blue-500" />,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500',
          label: 'Order Confirmed',
          description: 'Your order has been confirmed and will be prepared soon.'
        };
      case OrderStatus.PREPARING:
        return {
          icon: <ChefHat className="h-8 w-8 text-orange-500" />,
          color: 'text-orange-500',
          bgColor: 'bg-orange-500',
          label: 'Preparing Your Order',
          description: 'Our chefs are preparing your delicious meal.'
        };
      case OrderStatus.READY:
        return {
          icon: <Package className="h-8 w-8 text-green-500" />,
          color: 'text-green-500',
          bgColor: 'bg-green-500',
          label: 'Ready for Pickup',
          description: 'Your order is ready and waiting for you to pick up.'
        };
      case OrderStatus.DELIVERED:
        return {
          icon: <Truck className="h-8 w-8 text-green-700" />,
          color: 'text-green-700',
          bgColor: 'bg-green-700',
          label: 'Delivered',
          description: 'Your order has been delivered. Enjoy your meal!'
        };
      case OrderStatus.CANCELLED:
        return {
          icon: <XCircle className="h-8 w-8 text-red-500" />,
          color: 'text-red-500',
          bgColor: 'bg-red-500',
          label: 'Cancelled',
          description: 'Your order has been cancelled.'
        };
      default:
        return {
          icon: <Clock className="h-8 w-8 text-muted-foreground" />,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted-foreground',
          label: 'Status Unknown',
          description: 'We\'re having trouble tracking your order.'
        };
    }
  };

  const statusProps = getStatusProps();

  // Format expected delivery time
  const getExpectedDeliveryTime = () => {
    if (!order || status === OrderStatus.CANCELLED) return 'Not available';
    
    // For this demo, add 30 minutes to the order time for delivery estimate
    // If createdAt is not available (for older orders), use current time
    const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
    const estimatedTime = new Date(orderDate);
    estimatedTime.setMinutes(estimatedTime.getMinutes() + 30);
    
    return formatDistanceToNow(estimatedTime, { addSuffix: true });
  };

  if (!orderId) {
    return null;
  }

  return (
    <div className="border rounded-lg shadow-sm overflow-hidden bg-card">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-primary">Order Status</h3>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500"></span> Live
              </span>
            ) : (
              <span className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded-full flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500"></span> Disconnected
              </span>
            )}
            <Button size="sm" variant="ghost" onClick={onRefresh} disabled={!onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Last updated: {formatDistanceToNow(lastUpdated, { addSuffix: true })}
        </p>
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Status display */}
          <div className="flex items-center gap-4">
            {statusProps.icon}
            <div>
              <h4 className={`font-semibold ${statusProps.color}`}>
                {statusProps.label}
              </h4>
              <p className="text-sm text-muted-foreground">
                {statusProps.description}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {status !== OrderStatus.CANCELLED && (
            <div className="space-y-2">
              <Progress value={getProgress()} className="h-2" />
            </div>
          )}

          <Separator />

          {/* Order details */}
          {order && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order Number</p>
                  <p className="font-medium">{order.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expected Delivery</p>
                  <p className="font-medium">{getExpectedDeliveryTime()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Order Items</p>
                <div className="space-y-2">
                  {(() => {
                    // Parse items from JSON string if needed
                    const parsedItems = typeof order.items === 'string'
                      ? JSON.parse(order.items)
                      : (Array.isArray(order.items) ? order.items : []);
                    
                    return parsedItems.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>${order.total?.toFixed(2) || 0}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}