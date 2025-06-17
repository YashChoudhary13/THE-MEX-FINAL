import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, DollarSign, BarChart3 } from "lucide-react";

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

export default function ReportsSection() {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'monthly'>('daily');

  // Fetch daily reports for last 30 days
  const { data: dailyReports, isLoading: dailyLoading } = useQuery<DailyReport[]>({
    queryKey: ['/api/admin/daily-reports'],
    enabled: selectedPeriod === 'daily'
  });

  // Fetch monthly reports for last 12 months
  const { data: monthlyReports, isLoading: monthlyLoading } = useQuery<MonthlyReport[]>({
    queryKey: ['/api/admin/monthly-reports'],
    enabled: selectedPeriod === 'monthly'
  });

  // Format currency
  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR'
    }).format(numAmount);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-IE', {
      timeZone: 'Europe/Dublin',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(dateString));
  };

  // Format month for display
  const formatMonth = (year: number, month: number) => {
    const date = new Date(year, month - 1, 1);
    return new Intl.DateTimeFormat('en-IE', {
      year: 'numeric',
      month: 'long'
    }).format(date);
  };

  // Calculate totals for daily reports
  const dailyTotals = dailyReports ? {
    totalOrders: dailyReports.reduce((sum, report) => sum + report.totalOrders, 0),
    totalRevenue: dailyReports.reduce((sum, report) => sum + parseFloat(report.totalRevenue), 0)
  } : { totalOrders: 0, totalRevenue: 0 };

  // Calculate totals for monthly reports
  const monthlyTotals = monthlyReports ? {
    totalOrders: monthlyReports.reduce((sum, report) => sum + report.totalOrders, 0),
    totalRevenue: monthlyReports.reduce((sum, report) => sum + parseFloat(report.totalRevenue), 0)
  } : { totalOrders: 0, totalRevenue: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">
            View detailed reports for your restaurant performance
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Calendar className="h-3 w-3" />
          Cork, Ireland Time
        </Badge>
      </div>

      <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as 'daily' | 'monthly')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="daily">Daily Reports (Last 30 Days)</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Reports (Last 12 Months)</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders (30 Days)</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dailyTotals.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days combined
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue (30 Days)</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(dailyTotals.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days combined
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily Performance</CardTitle>
              <CardDescription>
                Individual day performance for the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dailyLoading ? (
                <div className="text-center py-8">Loading daily reports...</div>
              ) : dailyReports && dailyReports.length > 0 ? (
                <div className="space-y-3">
                  {dailyReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{formatDate(report.date)}</p>
                          <p className="text-sm text-muted-foreground">
                            {report.totalOrders} orders
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(report.totalRevenue)}</p>
                        <p className="text-sm text-muted-foreground">
                          Avg: {report.totalOrders > 0 ? formatCurrency(parseFloat(report.totalRevenue) / report.totalOrders) : '€0.00'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No daily reports available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders (12 Months)</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthlyTotals.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Last 12 months combined
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue (12 Months)</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(monthlyTotals.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  Last 12 months combined
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
              <CardDescription>
                Monthly aggregated data for the last 12 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyLoading ? (
                <div className="text-center py-8">Loading monthly reports...</div>
              ) : monthlyReports && monthlyReports.length > 0 ? (
                <div className="space-y-3">
                  {monthlyReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{formatMonth(report.year, report.month)}</p>
                          <p className="text-sm text-muted-foreground">
                            {report.totalOrders} orders
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(report.totalRevenue)}</p>
                        <p className="text-sm text-muted-foreground">
                          Avg: {report.totalOrders > 0 ? formatCurrency(parseFloat(report.totalRevenue) / report.totalOrders) : '€0.00'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No monthly reports available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}