import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDublinTime } from "@/lib/utils";
import { CalendarDays, Download, FileText, TrendingUp, DollarSign, Receipt, BarChart3, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface OrderTaxDetail {
  orderId: number;
  customerName: string;
  dailyOrderNumber: number;
  orderTotal: number;
  taxAmount: number;
  preTaxAmount: number;
  status: string;
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    itemTax: number;
  }>;
}

interface TaxReport {
  id: number;
  reportType: 'daily' | 'monthly' | 'yearly';
  reportDate: string;
  year: number;
  month?: number;
  day?: number;
  totalTaxCollected: string;
  totalPreTaxRevenue: string;
  totalIncTaxRevenue: string;
  totalOrders: number;
  averageTaxPerOrder?: number;
  averageOrderValue?: number;
  taxBreakdown: Record<string, { amount: number; orders: number }>;
  orderDetails?: OrderTaxDetail[];
  createdAt: string;
  updatedAt: string;
}

export default function TaxReportsManager() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());


  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch daily tax reports
  const { data: dailyReports, isLoading: loadingDaily } = useQuery<TaxReport[]>({
    queryKey: ['/api/admin/tax-reports/daily', selectedDate],
    queryFn: () => fetch(`/api/admin/tax-reports/daily?date=${selectedDate}`).then(res => res.json()),
    refetchInterval: 30000,
  });

  // Fetch monthly tax reports
  const { data: monthlyReports, isLoading: loadingMonthly } = useQuery<TaxReport[]>({
    queryKey: ['/api/admin/tax-reports/monthly', selectedYear, selectedMonth],
    queryFn: () => fetch(`/api/admin/tax-reports/monthly?year=${selectedYear}&month=${selectedMonth}`).then(res => res.json()),
    refetchInterval: 60000,
  });

  // Fetch yearly tax reports
  const { data: yearlyReports, isLoading: loadingYearly } = useQuery<TaxReport[]>({
    queryKey: ['/api/admin/tax-reports/yearly', selectedYear],
    queryFn: () => fetch(`/api/admin/tax-reports/yearly?year=${selectedYear}`).then(res => res.json()),
    refetchInterval: 60000,
  });







  const exportToCsv = (reports: TaxReport[], filename: string) => {
    if (!reports || reports.length === 0) return;
    
    const headers = ['Date', 'Type', 'Total Orders', 'Pre-Tax Revenue', 'Tax Collected', 'Inc-Tax Revenue', 'Avg Tax/Order', 'Avg Order Value'];
    const csvData = reports.map(report => [
      report.reportDate,
      report.reportType,
      report.totalOrders.toString(),
      report.totalPreTaxRevenue,
      report.totalTaxCollected,
      report.totalIncTaxRevenue,
      report.averageTaxPerOrder?.toString() || '0',
      report.averageOrderValue?.toString() || '0'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderReportCard = (report: TaxReport) => (
    <Card key={report.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1)} Report
            </CardTitle>
            <CardDescription>
              {report.reportDate} • Updated {formatDublinTime(report.updatedAt)}
            </CardDescription>
          </div>
          <Badge variant="outline">
            {report.totalOrders} orders
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Receipt className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm text-blue-600 font-medium">Pre-Tax Revenue</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(parseFloat(report.totalPreTaxRevenue))}
            </div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm text-green-600 font-medium">Tax Collected</span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(parseFloat(report.totalTaxCollected))}
            </div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
              <span className="text-sm text-purple-600 font-medium">Total Revenue</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {formatCurrency(parseFloat(report.totalIncTaxRevenue))}
            </div>
          </div>

          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Calculator className="h-5 w-5 text-orange-600 mr-2" />
              <span className="text-sm text-orange-600 font-medium">Avg Tax/Order</span>
            </div>
            <div className="text-2xl font-bold text-orange-900">
              {report.averageTaxPerOrder ? formatCurrency(parseFloat(report.averageTaxPerOrder.toString())) : formatCurrency(0)}
            </div>
          </div>

          <div className="text-center p-3 bg-indigo-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <BarChart3 className="h-5 w-5 text-indigo-600 mr-2" />
              <span className="text-sm text-indigo-600 font-medium">Avg Order Value</span>
            </div>
            <div className="text-2xl font-bold text-indigo-900">
              {report.averageOrderValue ? formatCurrency(parseFloat(report.averageOrderValue.toString())) : formatCurrency(0)}
            </div>
          </div>
        </div>



        {report.orderDetails && report.orderDetails.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 text-[#f5f7fa]">Order Details ({report.orderDetails.length} orders)</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {report.orderDetails.map((order) => (
                <div key={order.orderId} className="bg-gray-50 rounded-lg p-3 border">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">Order #{order.dailyOrderNumber}</span>
                        <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">{order.customerName}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleString('en-IE', {
                          timeZone: 'Europe/Dublin',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{formatCurrency(order.orderTotal)}</div>
                      <div className="text-sm text-green-600">Tax: {formatCurrency(order.taxAmount)}</div>
                      <div className="text-xs text-gray-500">Pre-tax: {formatCurrency(order.preTaxAmount)}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">
                          {item.quantity}x {item.name}
                        </span>
                        <div className="text-right">
                          <span className="text-gray-900">{formatCurrency(item.price)}</span>
                          <span className="text-green-600 ml-2">(+{formatCurrency(item.itemTax)} tax)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#d4cdcd]">Tax Reports</h2>
        <p className="text-gray-600">View and manage tax collection reports by period</p>
      </div>
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <Label htmlFor="daily-date">Select Date</Label>
                <Input
                  id="daily-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => dailyReports && exportToCsv(dailyReports, `daily-tax-report-${selectedDate}.csv`)}
              disabled={!dailyReports || dailyReports.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {loadingDaily ? (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
            </div>
          ) : dailyReports && dailyReports.length > 0 ? (
            dailyReports.map(renderReportCard)
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No daily tax reports found for {selectedDate}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <Label htmlFor="monthly-year">Year</Label>
                <Input
                  id="monthly-year"
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-24"
                  min="2020"
                  max="2030"
                />
              </div>
              <div>
                <Label htmlFor="monthly-month">Month</Label>
                <Input
                  id="monthly-month"
                  type="number"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-20"
                  min="1"
                  max="12"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => monthlyReports && exportToCsv(monthlyReports, `monthly-tax-report-${selectedYear}-${selectedMonth}.csv`)}
              disabled={!monthlyReports || monthlyReports.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {loadingMonthly ? (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
            </div>
          ) : monthlyReports && monthlyReports.length > 0 ? (
            monthlyReports.map(renderReportCard)
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No monthly tax reports found for {selectedMonth}/{selectedYear}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="yearly" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <Label htmlFor="yearly-year">Select Year</Label>
                <Input
                  id="yearly-year"
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-24"
                  min="2020"
                  max="2030"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => yearlyReports && exportToCsv(yearlyReports, `yearly-tax-report-${selectedYear}.csv`)}
              disabled={!yearlyReports || yearlyReports.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {loadingYearly ? (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
            </div>
          ) : yearlyReports && yearlyReports.length > 0 ? (
            yearlyReports.map(renderReportCard)
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No yearly tax reports found for {selectedYear}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>


      </Tabs>
    </div>
  );
}