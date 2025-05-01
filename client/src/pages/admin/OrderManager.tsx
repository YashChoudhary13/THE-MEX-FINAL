import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, RefreshCw, Calendar, Clock, CheckCheck } from 'lucide-react';
import { Order } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { OrderStatus } from '@/hooks/use-order-tracker';
import { format } from 'date-fns';

export default function OrderManager() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch all orders
  const { 
    data: orders = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders'],
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      orderId, 
      status 
    }: { 
      orderId: number, 
      status: string 
    }) => {
      const res = await apiRequest('PATCH', `/api/orders/${orderId}/status`, { status });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Order updated',
        description: `Order #${data.id} status changed to ${data.status}`,
      });
      
      // Invalidate orders query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating order',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Filter orders based on search query
  const filteredOrders = orders.filter(order => 
    order.id.toString().includes(searchQuery) || 
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerPhone.includes(searchQuery)
  );
  
  // Get status badge color
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'secondary';
      case OrderStatus.CONFIRMED:
        return 'default';
      case OrderStatus.PREPARING:
        return 'warning';
      case OrderStatus.READY:
        return 'success';
      case OrderStatus.DELIVERED:
        return 'success';
      case OrderStatus.CANCELLED:
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  // Format date from order
  const formatOrderDate = (order: Order) => {
    if (!order.createdAt) return 'N/A';
    
    try {
      const date = new Date(order.createdAt);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Handle status change
  const handleStatusChange = (orderId: number, status: string) => {
    updateStatusMutation.mutate({ orderId, status });
  };

  if (error) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Orders</CardTitle>
          <CardDescription>Error loading orders</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Failed to load orders. Please try again.</p>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            className="mt-2"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Order Management</CardTitle>
            <CardDescription>View and update order statuses</CardDescription>
          </div>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            size="icon" 
            className="ml-auto" 
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search orders by ID, name or phone..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'No orders match your search' : 'No orders found'}
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableCaption>
                {searchQuery 
                  ? `Found ${filteredOrders.length} of ${orders.length} orders` 
                  : `Showing ${orders.length} orders`
                }
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-sm text-muted-foreground">{order.customerPhone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{formatOrderDate(order)}</span>
                      </div>
                    </TableCell>
                    <TableCell>${order.total?.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        defaultValue={order.status}
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Update status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={OrderStatus.PENDING}>Pending</SelectItem>
                          <SelectItem value={OrderStatus.CONFIRMED}>Confirmed</SelectItem>
                          <SelectItem value={OrderStatus.PREPARING}>Preparing</SelectItem>
                          <SelectItem value={OrderStatus.READY}>Ready</SelectItem>
                          <SelectItem value={OrderStatus.DELIVERED}>Delivered</SelectItem>
                          <SelectItem value={OrderStatus.CANCELLED}>Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {updateStatusMutation.isPending && (
          <div className="flex items-center justify-center mt-4 gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Updating order status...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}