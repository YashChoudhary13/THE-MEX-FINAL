import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Order } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { 
  CheckCircle, 
  Clock, 
  ChefHat, 
  ShoppingBag, 
  AlertCircle,
  Loader2,
  RefreshCcw,
  Clipboard 
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { format } from 'date-fns';

enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export default function OrderManager() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  // Fetch all orders
  const { data: orders, isLoading, error, refetch } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    refetchInterval: 5000, // auto refresh every 5 seconds
  });
  
  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number, status: string }) => {
      const response = await apiRequest('PATCH', `/api/orders/${orderId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: 'Order updated',
        description: 'The order status has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update order',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Filter orders based on status
  const filteredOrders = statusFilter
    ? orders?.filter(order => order.status === statusFilter)
    : orders;
  
  // Get counts for each status
  const statusCounts = {
    pending: orders?.filter(order => order.status === OrderStatus.PENDING).length || 0,
    confirmed: orders?.filter(order => order.status === OrderStatus.CONFIRMED).length || 0,
    preparing: orders?.filter(order => order.status === OrderStatus.PREPARING).length || 0,
    ready: orders?.filter(order => order.status === OrderStatus.READY).length || 0,
    delivered: orders?.filter(order => order.status === OrderStatus.DELIVERED).length || 0,
    cancelled: orders?.filter(order => order.status === OrderStatus.CANCELLED).length || 0,
  };
  
  // Update order status handler
  const handleStatusUpdate = (orderId: number, newStatus: string) => {
    updateOrderStatusMutation.mutate({ orderId, status: newStatus });
  };
  
  // Format date string
  const formatOrderDate = (order: Order) => {
    try {
      if (!order.createdAt) return 'Unknown date';
      return format(new Date(order.createdAt), 'MMM dd, yyyy h:mm a');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Get status badge color
  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'secondary';
      case OrderStatus.CONFIRMED:
        return 'default';
      case OrderStatus.PREPARING:
        return 'default';
      case OrderStatus.READY:
        return 'default';
      case OrderStatus.DELIVERED:
        return 'outline';
      case OrderStatus.CANCELLED:
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case OrderStatus.PENDING:
        return <Clock className="h-4 w-4" />;
      case OrderStatus.CONFIRMED:
        return <CheckCircle className="h-4 w-4" />;
      case OrderStatus.PREPARING:
        return <ChefHat className="h-4 w-4" />;
      case OrderStatus.READY:
        return <ShoppingBag className="h-4 w-4" />;
      case OrderStatus.DELIVERED:
        return <CheckCircle className="h-4 w-4" />;
      case OrderStatus.CANCELLED:
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h3 className="text-lg font-semibold">Failed to load orders</h3>
        <p className="text-muted-foreground text-center max-w-md">
          There was an error loading the order data. Please try again.
        </p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Order Management</h2>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-7 mb-6">
          <TabsTrigger value="all" onClick={() => setStatusFilter(null)}>
            All ({orders?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pending" onClick={() => setStatusFilter(OrderStatus.PENDING)}>
            Pending ({statusCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="confirmed" onClick={() => setStatusFilter(OrderStatus.CONFIRMED)}>
            Confirmed ({statusCounts.confirmed})
          </TabsTrigger>
          <TabsTrigger value="preparing" onClick={() => setStatusFilter(OrderStatus.PREPARING)}>
            Preparing ({statusCounts.preparing})
          </TabsTrigger>
          <TabsTrigger value="ready" onClick={() => setStatusFilter(OrderStatus.READY)}>
            Ready ({statusCounts.ready})
          </TabsTrigger>
          <TabsTrigger value="delivered" onClick={() => setStatusFilter(OrderStatus.DELIVERED)}>
            Delivered ({statusCounts.delivered})
          </TabsTrigger>
          <TabsTrigger value="cancelled" onClick={() => setStatusFilter(OrderStatus.CANCELLED)}>
            Cancelled ({statusCounts.cancelled})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {renderOrderCards(filteredOrders || [])}
        </TabsContent>
        <TabsContent value="pending" className="space-y-4">
          {renderOrderCards(filteredOrders || [])}
        </TabsContent>
        <TabsContent value="confirmed" className="space-y-4">
          {renderOrderCards(filteredOrders || [])}
        </TabsContent>
        <TabsContent value="preparing" className="space-y-4">
          {renderOrderCards(filteredOrders || [])}
        </TabsContent>
        <TabsContent value="ready" className="space-y-4">
          {renderOrderCards(filteredOrders || [])}
        </TabsContent>
        <TabsContent value="delivered" className="space-y-4">
          {renderOrderCards(filteredOrders || [])}
        </TabsContent>
        <TabsContent value="cancelled" className="space-y-4">
          {renderOrderCards(filteredOrders || [])}
        </TabsContent>
      </Tabs>
      
      {(!filteredOrders || filteredOrders.length === 0) && (
        <div className="flex flex-col items-center justify-center h-60 border rounded-lg bg-muted/10">
          <Clipboard className="h-8 w-8 text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium">No orders found</h3>
          <p className="text-sm text-muted-foreground">
            {statusFilter ? `There are no orders with status "${statusFilter}"` : 'There are no orders in the system yet'}
          </p>
        </div>
      )}
    </div>
  );
  
  function renderOrderCards(orders: Order[]) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map(order => (
          <Card key={order.id} className={order.status === OrderStatus.READY ? 'border-primary' : ''}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Order #{order.id}</CardTitle>
                  <CardDescription>
                    {formatOrderDate(order)}
                  </CardDescription>
                </div>
                <Badge variant={getStatusBadgeVariant(order.status)}>
                  <span className="flex items-center">
                    {getStatusIcon(order.status)}
                    <span className="ml-1">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                  </span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Customer</h4>
                  <p>{order.customerName}</p>
                  <p className="text-sm">{order.customerPhone}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Items</h4>
                  <ul className="text-sm border rounded-md divide-y">
                    {order.items && Array.isArray(order.items) && order.items.map((item: any, index: number) => (
                      <li key={index} className="flex justify-between p-2">
                        <span>{item.quantity}x {item.name}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                    {(!order.items || !Array.isArray(order.items)) && (
                      <li className="p-2 text-muted-foreground text-sm">No items available</li>
                    )}
                    <li className="flex justify-between p-2 font-medium">
                      <span>Total</span>
                      <span>${order.total.toFixed(2)}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <div className="w-full space-y-2">
                <p className="text-sm font-medium mb-1">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {order.status === OrderStatus.PENDING && (
                    <>
                      <Button size="sm" onClick={() => handleStatusUpdate(order.id, OrderStatus.CONFIRMED)}>
                        Confirm
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(order.id, OrderStatus.CANCELLED)}>
                        Cancel
                      </Button>
                    </>
                  )}
                  
                  {order.status === OrderStatus.CONFIRMED && (
                    <>
                      <Button size="sm" onClick={() => handleStatusUpdate(order.id, OrderStatus.PREPARING)}>
                        Start Preparing
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(order.id, OrderStatus.CANCELLED)}>
                        Cancel
                      </Button>
                    </>
                  )}
                  
                  {order.status === OrderStatus.PREPARING && (
                    <>
                      <Button size="sm" onClick={() => handleStatusUpdate(order.id, OrderStatus.READY)}>
                        Mark Ready
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(order.id, OrderStatus.CANCELLED)}>
                        Cancel
                      </Button>
                    </>
                  )}
                  
                  {order.status === OrderStatus.READY && (
                    <Button size="sm" className="col-span-2" onClick={() => handleStatusUpdate(order.id, OrderStatus.DELIVERED)}>
                      Mark as Delivered
                    </Button>
                  )}
                  
                  {(order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) && (
                    <Button size="sm" variant="outline" className="col-span-2" disabled>
                      Order Completed
                    </Button>
                  )}
                </div>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
}