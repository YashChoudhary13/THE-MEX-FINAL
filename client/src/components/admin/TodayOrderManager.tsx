import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RefreshCcw, Trash2, Clock, User, Phone } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: number;
  dailyOrderNumber: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  preparationInstructions: string | null;
  total: number;
  status: string;
  items: any[];
  createdAt: string;
}

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'default' },
  { value: 'confirmed', label: 'Confirmed', color: 'blue' },
  { value: 'preparing', label: 'Preparing', color: 'yellow' },
  { value: 'ready', label: 'Ready', color: 'green' },
  { value: 'completed', label: 'Completed', color: 'default' },
  { value: 'cancelled', label: 'Cancelled', color: 'destructive' },
];

export default function TodayOrderManager() {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);

  // Fetch today's orders only
  const { data: todaysOrders = [], isLoading, error, refetch } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders/today'],
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders/today'] });
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

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await apiRequest('DELETE', `/api/orders/${orderId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders/today'] });
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
      toast({
        title: 'Order deleted',
        description: 'The order has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete order',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-IE', {
      timeZone: 'Europe/Dublin',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    const statusConfig = statusOptions.find(opt => opt.value === status);
    return statusConfig?.color as any || 'default';
  };

  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateOrderStatusMutation.mutate({ orderId, status: newStatus });
  };

  const handleDeleteOrder = (orderId: number) => {
    setOrderToDelete(orderId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (orderToDelete) {
      deleteOrderMutation.mutate(orderToDelete);
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today's Orders</CardTitle>
          <CardDescription>Error loading orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            Failed to load orders. Please try refreshing.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Today's Orders</h2>
          <p className="text-muted-foreground">
            Manage orders placed today • {todaysOrders.length} total orders
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isLoading}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Order Queue
          </CardTitle>
          <CardDescription>
            Orders reset daily - numbers start from #1 each day
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : todaysOrders.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground border rounded-lg">
              No orders placed today
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {todaysOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="text-xl font-bold text-primary">
                            #{order.dailyOrderNumber || order.id}
                          </div>
                          <Badge variant={getStatusBadgeVariant(order.status)}>
                            {order.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatTime(order.createdAt)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{order.customerName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{order.customerPhone}</span>
                          </div>
                        </div>

                        {order.preparationInstructions && (
                          <div className="bg-muted p-2 rounded text-sm">
                            <strong>Special Instructions:</strong> {order.preparationInstructions}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {formatCurrency(order.total)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.items?.length || 0} items
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    {order.items && order.items.length > 0 && (
                      <div className="border-t pt-3">
                        <div className="text-sm font-medium mb-2">Items:</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded">
                              <span>{item.quantity}x {item.name}</span>
                              <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Status:</span>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteOrder(order.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Order</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this order? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete}>
                              Delete Order
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}