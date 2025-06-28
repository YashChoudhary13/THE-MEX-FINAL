import { db } from './db';
import { orders, menuItems, menuCategories } from '@shared/schema';
import { and, gte, lte, eq } from 'drizzle-orm';

const DEFAULT_TAX_RATE = 0.135; // 13.5% for restaurant food

/**
 * Get the effective tax rate for a menu item
 * Priority: item tax rate > category tax rate > default tax rate
 */
async function getMenuItemTaxRate(menuItemId: number): Promise<number> {
  try {
    // Get menu item with its category
    const result = await db
      .select({
        itemTaxRate: menuItems.taxRate,
        categoryTaxRate: menuCategories.taxRate
      })
      .from(menuItems)
      .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
      .where(eq(menuItems.id, menuItemId))
      .limit(1);

    if (result.length === 0) {
      return DEFAULT_TAX_RATE;
    }

    const { itemTaxRate, categoryTaxRate } = result[0];

    // Priority: item tax rate > category tax rate > default
    if (itemTaxRate !== null && itemTaxRate !== undefined) {
      return parseFloat(itemTaxRate.toString());
    }
    
    if (categoryTaxRate !== null && categoryTaxRate !== undefined) {
      return parseFloat(categoryTaxRate.toString());
    }

    return DEFAULT_TAX_RATE;
  } catch (error) {
    console.error('Error getting menu item tax rate:', error);
    return DEFAULT_TAX_RATE;
  }
}

export interface OrderTaxDetail {
  orderId: number;
  customerName: string;
  dailyOrderNumber: number;
  orderTotal: number;
  taxAmount: number;
  preTaxAmount: number;
  status: string;
  createdAt: Date;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    itemTax: number;
  }>;
}

export interface TaxCalculationResult {
  totalOrders: number;
  totalTaxCollected: number;
  totalPreTaxRevenue: number;
  totalIncTaxRevenue: number;
  averageTaxPerOrder: number;
  averageOrderValue: number;
  taxBreakdown: Record<string, { amount: number; orders: number }>;
  orderDetails?: OrderTaxDetail[];
}

/**
 * Calculate tax data for a specific date range by querying orders directly
 */
export async function calculateTaxForDateRange(
  startDate: Date,
  endDate: Date,
  includeOrderDetails: boolean = false
): Promise<TaxCalculationResult> {
  // Query COMPLETED orders only for the specific date range
  const ordersInRange = await db.select()
    .from(orders)
    .where(and(
      gte(orders.createdAt, startDate),
      lte(orders.createdAt, endDate),
      eq(orders.status, 'completed') // Only include completed orders
    ));
    
  console.log(`📊 Tax calculator found ${ordersInRange.length} completed orders between ${startDate.toISOString()} and ${endDate.toISOString()}`);
  console.log(`📊 Total revenue from orders: €${ordersInRange.reduce((sum, order) => sum + (order.total || 0), 0).toFixed(2)}`);

  let totalTaxCollected = 0;
  let totalPreTaxRevenue = 0;
  let totalIncTaxRevenue = 0;
  const taxBreakdown: Record<string, { amount: number; orders: number }> = {};
  const orderDetails: OrderTaxDetail[] = [];

  // Process orders using actual tax rates from menu items
  for (const order of ordersInRange) {
    let orderTotal = 0;
    let orderTaxAmount = 0;
    let orderPreTaxAmount = 0;
    const orderItemDetails: Array<{name: string; quantity: number; price: number; itemTax: number}> = [];
    
    // Parse order items
    let items: any[] = [];
    try {
      items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
    } catch (error) {
      console.error('Error parsing order items:', error);
      continue;
    }
    
    if (Array.isArray(items)) {
      // Process items sequentially to handle async tax rate lookups
      for (const item of items) {
        const itemTotal = (item.price || 0) * (item.quantity || 1);
        
        // Get the actual tax rate for this menu item
        const taxRate = await getMenuItemTaxRate(item.menuItemId || 0);
        
        // For tax-inclusive pricing: taxAmount = finalPrice * taxRate
        const taxAmount = itemTotal * taxRate;
        const preTaxAmount = itemTotal - taxAmount;
        
        totalTaxCollected += taxAmount;
        totalPreTaxRevenue += preTaxAmount;
        totalIncTaxRevenue += itemTotal;
        orderTaxAmount += taxAmount;
        orderPreTaxAmount += preTaxAmount;
        orderTotal += itemTotal;

        if (includeOrderDetails) {
          orderItemDetails.push({
            name: item.name || 'Unknown Item',
            quantity: item.quantity || 1,
            price: itemTotal,
            itemTax: Math.round(taxAmount * 100) / 100
          });
        }
        
        // Add to tax breakdown by actual tax rate used
        const rateKey = `${(taxRate * 100).toFixed(1)}%`;
        if (!taxBreakdown[rateKey]) {
          taxBreakdown[rateKey] = { amount: 0, orders: 0 };
        }
        taxBreakdown[rateKey].amount += Math.round(taxAmount * 100) / 100;
      }
      
      // Count order once in tax breakdown
      const orderRateKeys = Object.keys(taxBreakdown);
      if (orderRateKeys.length > 0) {
        // For orders with multiple tax rates, increment order count for the rate with highest amount
        let maxRateKey = orderRateKeys[0];
        let maxAmount = 0;
        for (const rateKey of orderRateKeys) {
          if (taxBreakdown[rateKey].amount > maxAmount) {
            maxAmount = taxBreakdown[rateKey].amount;
            maxRateKey = rateKey;
          }
        }
        if (orderTaxAmount > 0) {
          taxBreakdown[maxRateKey].orders += 1;
        }
      }

      // Add order details if requested
      if (includeOrderDetails) {
        orderDetails.push({
          orderId: order.id,
          customerName: order.customerName || 'Anonymous',
          dailyOrderNumber: order.dailyOrderNumber || 0,
          orderTotal: Math.round(orderTotal * 100) / 100,
          taxAmount: Math.round(orderTaxAmount * 100) / 100,
          preTaxAmount: Math.round(orderPreTaxAmount * 100) / 100,
          status: order.status || 'unknown',
          createdAt: order.createdAt || new Date(),
          items: orderItemDetails
        });
      }
    }
  }

  // Calculate per-order averages
  const averageTaxPerOrder = ordersInRange.length > 0 ? totalTaxCollected / ordersInRange.length : 0;
  const averageOrderValue = ordersInRange.length > 0 ? totalIncTaxRevenue / ordersInRange.length : 0;

  const result: TaxCalculationResult = {
    totalOrders: ordersInRange.length,
    totalTaxCollected: Math.round(totalTaxCollected * 100) / 100,
    totalPreTaxRevenue: Math.round(totalPreTaxRevenue * 100) / 100,
    totalIncTaxRevenue: Math.round(totalIncTaxRevenue * 100) / 100,
    averageTaxPerOrder: Math.round(averageTaxPerOrder * 100) / 100,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    taxBreakdown
  };

  if (includeOrderDetails) {
    result.orderDetails = orderDetails;
  }

  return result;
}

/**
 * Calculate tax data for a specific day
 */
export async function calculateDailyTax(date: Date, includeOrderDetails: boolean = false): Promise<TaxCalculationResult> {
  const startOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
  
  return calculateTaxForDateRange(startOfDay, endOfDay, includeOrderDetails);
}

/**
 * Calculate tax data for a specific month
 */
export async function calculateMonthlyTax(year: number, month: number, includeOrderDetails: boolean = false): Promise<TaxCalculationResult> {
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  
  return calculateTaxForDateRange(startOfMonth, endOfMonth, includeOrderDetails);
}

/**
 * Calculate tax data for a specific year
 */
export async function calculateYearlyTax(year: number, includeOrderDetails: boolean = false): Promise<TaxCalculationResult> {
  const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
  
  return calculateTaxForDateRange(startOfYear, endOfYear, includeOrderDetails);
}