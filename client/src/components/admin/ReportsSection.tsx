import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

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
  const { data: allOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders'],
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
        dailyData[dateKey].revenue += order.total;
        
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

  const totalDailyRevenue = dailyChartData.reduce((sum, day) => sum + day.revenue, 0);
  const totalDailyOrders = dailyChartData.reduce((sum, day) => sum + day.orders, 0);
  const totalMonthlyRevenue = monthlyChartData.reduce((sum, month) => sum + month.revenue, 0);
  const totalMonthlyOrders = monthlyChartData.reduce((sum, month) => sum + month.orders, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Revenue (30d)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDailyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {totalDailyOrders} orders total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue (12m)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMonthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {totalMonthlyOrders} orders total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentOrdersFiltered.length}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentOrdersFiltered.length > 0 
                ? formatCurrency(recentOrdersFiltered.reduce((sum, order) => sum + order.total, 0) / recentOrdersFiltered.length)
                : '€0.00'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Past 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">Daily Reports</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Reports</TabsTrigger>
          <TabsTrigger value="orders">Recent Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue & Orders (Last 30 Days)</CardTitle>
              <CardDescription>
                Revenue and order trends for the past 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : dailyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(value as number) : value,
                        name === 'revenue' ? 'Revenue' : 'Orders'
                      ]}
                    />
                    <Bar yAxisId="right" dataKey="orders" fill="#8884d8" name="orders" />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#82ca9d" name="revenue" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No daily data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue & Orders (Last 12 Months)</CardTitle>
              <CardDescription>
                Revenue and order trends for the past 12 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : monthlyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(value as number) : value,
                        name === 'revenue' ? 'Revenue' : 'Orders'
                      ]}
                    />
                    <Bar yAxisId="left" dataKey="revenue" fill="#82ca9d" name="revenue" />
                    <Bar yAxisId="right" dataKey="orders" fill="#8884d8" name="orders" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No monthly data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders (Last 30 Days)</CardTitle>
              <CardDescription>
                Detailed list of all orders from the past 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : recentOrdersFiltered.length > 0 ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {recentOrdersFiltered.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="font-medium">#{order.id}</div>
                          <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {order.customerName} • {order.customerEmail}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(order.createdAt)} • {new Date(order.createdAt).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="text-lg font-bold">
                        {formatCurrency(order.total)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No recent orders found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}