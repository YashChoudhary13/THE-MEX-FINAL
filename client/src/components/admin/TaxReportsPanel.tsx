import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, TrendingUp, FileText, Download } from "lucide-react";
import { formatCurrency, formatDublinTime } from "@/lib/utils";

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
  taxBreakdown: Record<string, { amount: number; orders: number }>;
  createdAt: string;
}

export default function TaxReportsPanel() {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const { data: taxReports = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/tax-reports', selectedPeriod, selectedYear],
    queryFn: async () => {
      const params = new URLSearchParams({
        reportType: selectedPeriod,
        year: selectedYear.toString()
      });
      const response = await fetch(`/api/admin/tax-reports?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tax reports');
      }
      return response.json() as Promise<TaxReport[]>;
    }
  });

  const generateReport = async (reportType: 'daily' | 'monthly' | 'yearly') => {
    try {
      const response = await fetch('/api/admin/tax-reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reportType, 
          date: new Date().toISOString().split('T')[0],
          year: selectedYear
        })
      });
      
      if (response.ok) {
        refetch();
      }
    } catch (error) {
      console.error('Error generating tax report:', error);
    }
  };

  const exportReport = (report: TaxReport) => {
    const csvContent = [
      'Tax Report Export',
      `Report Type: ${report.reportType}`,
      `Period: ${report.reportDate}`,
      `Generated: ${formatDublinTime(new Date(report.createdAt))}`,
      '',
      'Summary',
      `Total Orders: ${report.totalOrders}`,
      `Pre-Tax Revenue: ${formatCurrency(parseFloat(report.totalPreTaxRevenue))}`,
      `Tax Collected: ${formatCurrency(parseFloat(report.totalTaxCollected))}`,
      `Total Revenue (Inc. Tax): ${formatCurrency(parseFloat(report.totalIncTaxRevenue))}`,
      '',
      'Tax Breakdown by Rate',
      'Tax Rate,Amount Collected,Number of Orders'
    ];

    Object.entries(report.taxBreakdown || {}).forEach(([rate, data]) => {
      csvContent.push(`${rate},${formatCurrency(data.amount)},${data.orders}`);
    });

    const csv = csvContent.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-report-${report.reportType}-${report.reportDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const currentYearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tax Reports</h2>
          <p className="text-muted-foreground">
            View and generate comprehensive tax reports for VAT compliance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currentYearOptions.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => generateReport(selectedPeriod)} className="gap-2">
            <FileText className="h-4 w-4" />
            Generate {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Report
          </Button>
        </div>
      </div>

      <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as typeof selectedPeriod)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">Daily Reports</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Reports</TabsTrigger>
          <TabsTrigger value="yearly">Yearly Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <TaxReportsList 
            reports={taxReports} 
            isLoading={isLoading}
            onExport={exportReport}
            type="daily"
          />
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <TaxReportsList 
            reports={taxReports} 
            isLoading={isLoading}
            onExport={exportReport}
            type="monthly"
          />
        </TabsContent>

        <TabsContent value="yearly" className="space-y-4">
          <TaxReportsList 
            reports={taxReports} 
            isLoading={isLoading}
            onExport={exportReport}
            type="yearly"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface TaxReportsListProps {
  reports: TaxReport[];
  isLoading: boolean;
  onExport: (report: TaxReport) => void;
  type: 'daily' | 'monthly' | 'yearly';
}

function TaxReportsList({ reports, isLoading, onExport, type }: TaxReportsListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No {type} tax reports available</p>
            <p className="text-sm">Generate a report to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Tax Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(
                reports.reduce((sum, report) => sum + parseFloat(report.totalTaxCollected), 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pre-Tax Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                reports.reduce((sum, report) => sum + parseFloat(report.totalPreTaxRevenue), 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                reports.reduce((sum, report) => sum + parseFloat(report.totalIncTaxRevenue), 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.reduce((sum, report) => sum + report.totalOrders, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Reports</CardTitle>
          <CardDescription>
            Detailed breakdown of tax collection for {type} periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Pre-Tax Revenue</TableHead>
                <TableHead>Tax Collected</TableHead>
                <TableHead>Total Revenue</TableHead>
                <TableHead>Tax Breakdown</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">
                    {type === 'daily' && new Date(report.reportDate).toLocaleDateString()}
                    {type === 'monthly' && `${report.year}-${String(report.month).padStart(2, '0')}`}
                    {type === 'yearly' && report.year}
                  </TableCell>
                  <TableCell>{report.totalOrders}</TableCell>
                  <TableCell>{formatCurrency(parseFloat(report.totalPreTaxRevenue))}</TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {formatCurrency(parseFloat(report.totalTaxCollected))}
                  </TableCell>
                  <TableCell>{formatCurrency(parseFloat(report.totalIncTaxRevenue))}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(report.taxBreakdown || {}).map(([rate, data]) => (
                        <Badge key={rate} variant="outline" className="text-xs">
                          {rate}: {formatCurrency(data.amount)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onExport(report)}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}