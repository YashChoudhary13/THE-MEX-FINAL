import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, ComposedChart } from 'recharts';
import RecentOrdersTabs from './RecentOrdersTabs';

interface DailyReport {
  id: number;
  date: string;
  totalOrders: number;
  totalRevenue: string;
  createdAt: string;
  updatedAt: string;
}

interface MonthlyReport {
  id: number;
  year: number;
  month: number;
  totalOrders: number;
  totalRevenue: string;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function ReportsSection() {
  const queryClient = useQueryClient();
  
  // WebSocket connection for real-time updates
  useWebSocket({
    onMessage: (data) => {
      if (data.type === 'NEW_ORDER' || data.type === 'ORDER_UPDATE' || data.type === 'REFRESH_STATS') {
        // Invalidate orders cache when new orders arrive or status changes
        queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      }
    },
    onConnect: () => {
      console.log('Reports WebSocket connected');
    },
    onDisconnect: () => {
      console.log('Reports WebSocket disconnected');
    }
  });

  const { data: allOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders'],
    refetchInterval: 10000, // Refresh every 10 seconds for live data
  });

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR'
    }).format(numAmount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Calculate daily data from actual orders
  const getDailyData = () => {
    if (!allOrders) return [];
    
    const dailyData: { [key: string]: { orders: number; revenue: number; completedRevenue: number } } = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    allOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      if (orderDate >= thirtyDaysAgo) {
        const dateKey = orderDate.toISOString().split('T')[0];
        
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { orders: 0, revenue: 0, completedRevenue: 0 };
        }
        
        dailyData[dateKey].orders += 1;
        if (order.status === "completed") {
          dailyData[dateKey].revenue += order.total || 0;
        }

        
        if (order.status === 'completed') {
          dailyData[dateKey].completedRevenue += order.total;
        }
      }
    });
    
    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date: formatDate(date),
        orders: data.orders,
        revenue: data.completedRevenue // Show only completed revenue
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Calculate monthly data from actual orders
  const getMonthlyData = () => {
    if (!allOrders) return [];
    
    const monthlyData: { [key: string]: { orders: number; revenue: number; completedRevenue: number } } = {};
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    allOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      if (orderDate >= twelveMonthsAgo) {
        const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { orders: 0, revenue: 0, completedRevenue: 0 };
        }
        
        monthlyData[monthKey].orders += 1;
        monthlyData[monthKey].revenue += order.total;
        
        if (order.status === 'completed') {
          monthlyData[monthKey].completedRevenue += order.total;
        }
      }
    });
    
    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        orders: data.orders,
        revenue: data.completedRevenue // Show only completed revenue
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const dailyChartData = getDailyData();
  const monthlyChartData = getMonthlyData();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentOrdersFiltered = allOrders?.filter(order => 
    new Date(order.createdAt) >= thirtyDaysAgo
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

  // Calculate completed orders only for consistency
  const recentCompletedOrders = recentOrdersFiltered.filter(order => order.status === 'completed');
  
  const totalDailyRevenue = dailyChartData.reduce((sum, day) => sum + day.revenue, 0);
  const totalDailyOrders = dailyChartData.reduce((sum, day) => sum + day.orders, 0);
  const totalMonthlyRevenue = monthlyChartData.reduce((sum, month) => sum + month.revenue, 0);
  const totalMonthlyOrders = monthlyChartData.reduce((sum, month) => sum + month.orders, 0);

  // Calculate today's statistics for live data
  const today = new Date().toISOString().split('T')[0];
  const todaysOrders = allOrders?.filter(order => 
    order.createdAt.startsWith(today)
  ) || [];
  const todaysRevenue = todaysOrders.reduce((sum, order) => sum + order.total, 0);
  const todaysCompletedOrders = todaysOrders.filter(order => order.status === 'completed');
  const todaysCompletedRevenue = todaysCompletedOrders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="space-y-6">
      {/* Today's Live Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Today's Performance
            <Badge variant="outline" className="text-xs">LIVE</Badge>
          </CardTitle>
          <CardDescription>
            Real-time statistics for {new Date().toLocaleDateString('en-IE')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{todaysOrders.length}</div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(todaysRevenue)}</div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{todaysCompletedOrders.length}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(todaysCompletedRevenue)}</div>
              <div className="text-sm text-muted-foreground">Completed Revenue</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Revenue (30d)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDailyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {recentCompletedOrders.length} completed orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Revenue (12m)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMonthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {totalMonthlyOrders} completed orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All Orders (30d)</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentOrdersFiltered.length}</div>
            <p className="text-xs text-muted-foreground">
              {recentCompletedOrders.length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completed Order</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentCompletedOrders.length > 0 
                ? formatCurrency(recentCompletedOrders.reduce((sum, order) => sum + order.total, 0) / recentCompletedOrders.length)
                : '€0.00'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Completed orders only
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">Daily Reports</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Reports</TabsTrigger>
          <TabsTrigger value="orders">Order History</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Daily Completed Revenue & Orders (Last 30 Days)
                <Badge variant="outline" className="text-xs">LIVE</Badge>
              </CardTitle>
              <CardDescription>
                Real-time completed revenue and order trends - updates automatically every 15 seconds
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="h-[450px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : dailyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={450}>
                  <ComposedChart data={dailyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis 
                      yAxisId="left" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `€${value}`}
                      label={{ value: 'Revenue (€)', angle: -90, position: 'insideLeft' }}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Orders', angle: 90, position: 'insideRight' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #ccc',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(value as number) : `${value} orders`,
                        name === 'revenue' ? 'Daily Completed Revenue' : 'Daily Orders'
                      ]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="rect"
                    />
                    <Bar 
                      yAxisId="right" 
                      dataKey="orders" 
                      fill="#8884d8" 
                      name="Daily Orders"
                      opacity={0.8}
                    />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#82ca9d" 
                      name="Daily Completed Revenue"
                      strokeWidth={3}
                      dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#82ca9d', strokeWidth: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[450px] flex items-center justify-center text-muted-foreground">
                  No daily data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Monthly Completed Revenue & Orders (Last 12 Months)
                <Badge variant="outline" className="text-xs">LIVE</Badge>
              </CardTitle>
              <CardDescription>
                Real-time completed revenue and order trends - updates automatically with new orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="h-[450px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : monthlyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={450}>
                  <ComposedChart data={monthlyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis 
                      yAxisId="left" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `€${value}`}
                      label={{ value: 'Revenue (€)', angle: -90, position: 'insideLeft' }}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Orders', angle: 90, position: 'insideRight' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #ccc',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(value as number) : `${value} orders`,
                        name === 'revenue' ? 'Monthly Completed Revenue' : 'Monthly Orders'
                      ]}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="rect"
                    />
                    <Bar 
                      yAxisId="left" 
                      dataKey="revenue" 
                      fill="#82ca9d" 
                      name="Monthly Completed Revenue"
                      opacity={0.8}
                    />
                    <Bar 
                      yAxisId="right" 
                      dataKey="orders" 
                      fill="#8884d8" 
                      name="Monthly Orders"
                      opacity={0.8}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[450px] flex items-center justify-center text-muted-foreground">
                  No monthly data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <RecentOrdersTabs />
        </TabsContent>
      </Tabs>
    </div>
  );
}
