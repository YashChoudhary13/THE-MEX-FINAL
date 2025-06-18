import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Phone, User, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";

interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  status: string;
  items: any[];
  paymentReference: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface DayTab {
  date: string;
  displayDate: string;
  orders: Order[];
}

export default function RecentOrdersTabs() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const daysPerPage = 10;
  
  // Generate the last 30 days
  const last30Days = useMemo(() => {
    const days = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  }, []);

  // Fetch all orders
  const { data: allOrders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders'],
  });

  // Group orders by day
  const dayTabs: DayTab[] = useMemo(() => {
    return last30Days.map(date => {
      const dayOrders = allOrders.filter(order => 
        order.createdAt.split('T')[0] === date
      );
      
      const displayDate = new Date(date).toLocaleDateString('en-IE', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      
      return {
        date,
        displayDate: date === new Date().toISOString().split('T')[0] ? 'Today' : displayDate,
        orders: dayOrders
      };
    });
  }, [allOrders, last30Days]);

  // Paginated days for current view
  const currentDays = useMemo(() => {
    const start = currentPage * daysPerPage;
    const end = start + daysPerPage;
    return dayTabs.slice(start, end);
  }, [dayTabs, currentPage, daysPerPage]);

  const totalPages = Math.ceil(dayTabs.length / daysPerPage);
  const canGoNext = currentPage < totalPages - 1;
  const canGoPrev = currentPage > 0;

  const handlePageChange = (direction: 'next' | 'prev') => {
    if (direction === 'next' && canGoNext) {
      setCurrentPage(prev => prev + 1);
      setSelectedTab(0); // Reset to first tab of new page
    } else if (direction === 'prev' && canGoPrev) {
      setCurrentPage(prev => prev - 1);
      setSelectedTab(0); // Reset to first tab of new page
    }
  };

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IE', {
      timeZone: 'Europe/Dublin',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders (Last 30 Days)</CardTitle>
          <CardDescription>
            Loading order history...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Recent Orders (Last 30 Days)
        </CardTitle>
        <CardDescription>
          View orders by day with complete details including customer info and payment references • Page {currentPage + 1} of {totalPages}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Navigation Controls */}
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handlePageChange('prev')}
            disabled={!canGoPrev}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous 10 Days
          </Button>
          
          <div className="text-sm text-muted-foreground">
            Showing days {currentPage * daysPerPage + 1}-{Math.min((currentPage + 1) * daysPerPage, dayTabs.length)} of {dayTabs.length}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handlePageChange('next')}
            disabled={!canGoNext}
            className="flex items-center gap-2"
          >
            Next 10 Days
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Tabs value={selectedTab.toString()} onValueChange={(value) => setSelectedTab(parseInt(value))}>
          <ScrollArea className="w-full">
            <TabsList className="grid grid-cols-5 lg:grid-cols-10 gap-1 h-auto p-1 mb-4">
              {currentDays.map((day, index) => (
                <TabsTrigger 
                  key={day.date} 
                  value={index.toString()}
                  className="text-xs p-2 min-w-0 flex flex-col gap-1"
                >
                  <span className="font-medium">{day.displayDate}</span>
                  <Badge variant="secondary" className="text-xs px-1">
                    {day.orders.length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>

          {currentDays.map((day, index) => (
            <TabsContent key={day.date} value={index.toString()} className="mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {day.displayDate === 'Today' ? 'Today' : formatDate(day.date)}
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    {day.orders.length} orders • {formatCurrency(day.orders.reduce((sum, order) => sum + order.total, 0))} total
                  </div>
                </div>

                {day.orders.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-muted-foreground border rounded-lg">
                    No orders placed on this day
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {day.orders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <div className="font-medium">Order #{order.id}</div>
                                <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                                  {order.status}
                                </Badge>
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

                              <div className="text-sm text-muted-foreground">
                                <div className="flex items-center gap-2 mb-1">
                                  <Clock className="h-4 w-4" />
                                  <span>Placed: {formatTime(order.createdAt)}</span>
                                </div>
                                {order.completedAt && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>Completed: {formatTime(order.completedAt)}</span>
                                  </div>
                                )}
                              </div>

                              {order.paymentReference && (
                                <div className="flex items-center gap-2 text-sm">
                                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                    {order.paymentReference}
                                  </span>
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
                            <div className="pt-2 border-t">
                              <div className="text-sm font-medium mb-2">Ordered Items:</div>
                              <div className="space-y-1">
                                {order.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between text-sm">
                                    <span>{item.quantity}x {item.name}</span>
                                    <span className="text-muted-foreground">{formatCurrency(item.price * item.quantity)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}