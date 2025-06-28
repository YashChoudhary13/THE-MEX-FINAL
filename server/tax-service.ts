import { db } from './db';
import { orders, taxReports } from '@shared/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { calculateTaxFromFinalPrice, generateTaxReportData } from '@shared/tax-utils';

export class TaxService {
  /**
   * Generate and store daily tax report
   */
  async generateDailyTaxReport(date: Date): Promise<void> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all orders for the specified day
    const dayOrders = await db.select()
      .from(orders)
      .where(and(
        gte(orders.createdAt, startOfDay),
        lte(orders.createdAt, endOfDay)
      ));

    // Generate tax report data
    const reportData = generateTaxReportData(dayOrders, 'daily', date);
    
    // Store or update the report
    await this.storeOrUpdateTaxReport(reportData);
  }

  /**
   * Generate and store monthly tax report
   */
  async generateMonthlyTaxReport(year: number, month: number): Promise<void> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Get all orders for the specified month
    const monthOrders = await db.select()
      .from(orders)
      .where(and(
        gte(orders.createdAt, startOfMonth),
        lte(orders.createdAt, endOfMonth)
      ));

    // Generate tax report data
    const reportData = generateTaxReportData(monthOrders, 'monthly', startOfMonth);
    
    // Store or update the report
    await this.storeOrUpdateTaxReport(reportData);
  }

  /**
   * Generate and store yearly tax report
   */
  async generateYearlyTaxReport(year: number): Promise<void> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    // Get all orders for the specified year
    const yearOrders = await db.select()
      .from(orders)
      .where(and(
        gte(orders.createdAt, startOfYear),
        lte(orders.createdAt, endOfYear)
      ));

    // Generate tax report data
    const reportData = generateTaxReportData(yearOrders, 'yearly', startOfYear);
    
    // Store or update the report
    await this.storeOrUpdateTaxReport(reportData);
  }

  /**
   * Store or update tax report in database
   */
  private async storeOrUpdateTaxReport(reportData: any): Promise<void> {
    try {
      // Check if report already exists
      const existingReport = await db.select()
        .from(taxReports)
        .where(and(
          eq(taxReports.reportType, reportData.reportType),
          eq(taxReports.reportDate, reportData.reportDate)
        ))
        .limit(1);

      if (existingReport.length > 0) {
        // Update existing report
        await db.update(taxReports)
          .set({
            totalTaxCollected: reportData.totalTaxCollected.toString(),
            totalPreTaxRevenue: reportData.totalPreTaxRevenue.toString(),
            totalIncTaxRevenue: reportData.totalIncTaxRevenue.toString(),
            totalOrders: reportData.totalOrders,
            taxBreakdown: reportData.taxBreakdown,
            updatedAt: new Date()
          })
          .where(eq(taxReports.id, existingReport[0].id));
      } else {
        // Create new report
        await db.insert(taxReports).values({
          reportType: reportData.reportType,
          reportDate: reportData.reportDate,
          year: reportData.year,
          month: reportData.month || null,
          day: reportData.day || null,
          totalTaxCollected: reportData.totalTaxCollected.toString(),
          totalPreTaxRevenue: reportData.totalPreTaxRevenue.toString(),
          totalIncTaxRevenue: reportData.totalIncTaxRevenue.toString(),
          totalOrders: reportData.totalOrders,
          taxBreakdown: reportData.taxBreakdown
        });
      }
    } catch (error) {
      console.error('Error storing tax report:', error);
      throw error;
    }
  }

  /**
   * Get tax reports for a date range
   */
  async getTaxReportsByDateRange(startDate: string, endDate: string): Promise<any[]> {
    return await db.select()
      .from(taxReports)
      .where(and(
        gte(taxReports.reportDate, startDate),
        lte(taxReports.reportDate, endDate)
      ))
      .orderBy(desc(taxReports.reportDate));
  }

  /**
   * Generate tax reports for current period (called by cron jobs)
   */
  async generateCurrentPeriodReports(): Promise<void> {
    const now = new Date();
    
    // Generate daily report for today
    await this.generateDailyTaxReport(now);
    
    // Generate monthly report if it's the last day of the month
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow.getMonth() !== now.getMonth()) {
      await this.generateMonthlyTaxReport(now.getFullYear(), now.getMonth() + 1);
    }
    
    // Generate yearly report if it's the last day of the year
    if (tomorrow.getFullYear() !== now.getFullYear()) {
      await this.generateYearlyTaxReport(now.getFullYear());
    }
  }
}

export const taxService = new TaxService();