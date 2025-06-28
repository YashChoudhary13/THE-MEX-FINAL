import { MenuCategory, MenuItem, OrderItem } from './schema';

// Default tax rate (13.5% for restaurant food in Ireland)
export const DEFAULT_TAX_RATE = 0.135;

/**
 * Get the effective tax rate for a menu item
 * Priority: Item tax rate > Category tax rate > Default tax rate
 */
export function getEffectiveTaxRate(
  menuItem: MenuItem,
  category?: MenuCategory
): number {
  // Item-specific tax rate has highest priority
  if (menuItem.taxRate !== null && menuItem.taxRate !== undefined) {
    return parseFloat(menuItem.taxRate.toString());
  }
  
  // Category tax rate is second priority
  if (category?.taxRate !== null && category?.taxRate !== undefined) {
    return parseFloat(category.taxRate.toString());
  }
  
  // Default tax rate as fallback
  return DEFAULT_TAX_RATE;
}

/**
 * Calculate tax-inclusive price from base price
 */
export function calculateTaxInclusivePrice(basePrice: number, taxRate: number): number {
  return basePrice * (1 + taxRate);
}

/**
 * Calculate base price from tax-inclusive price
 */
export function calculateBasePrice(taxInclusivePrice: number, taxRate: number): number {
  return taxInclusivePrice / (1 + taxRate);
}

/**
 * Calculate tax amount from base price
 */
export function calculateTaxAmount(basePrice: number, taxRate: number): number {
  return basePrice * taxRate;
}

/**
 * Calculate tax amount from final price (tax-inclusive)
 * Formula: taxAmount = finalPrice * (taxRate / (1 + taxRate))
 */
export function calculateTaxFromFinalPrice(finalPrice: number, taxRate: number): number {
  return finalPrice * (taxRate / (1 + taxRate));
}

/**
 * Create an order item with proper tax calculations
 */
export function createOrderItem(
  menuItem: MenuItem,
  category: MenuCategory | undefined,
  quantity: number,
  customizations?: string
): OrderItem {
  const effectiveTaxRate = getEffectiveTaxRate(menuItem, category);
  const basePrice = calculateBasePrice(menuItem.price, effectiveTaxRate);
  const taxAmount = calculateTaxFromFinalPrice(menuItem.price, effectiveTaxRate);

  return {
    quantity,
    name: menuItem.name,
    price: menuItem.price, // Tax-inclusive price
    basePrice,
    taxRate: effectiveTaxRate,
    taxAmount,
    menuItemId: menuItem.id,
    customizations
  };
}

/**
 * Calculate tax breakdown for multiple order items
 */
export function calculateOrderTaxBreakdown(items: OrderItem[]): {
  totalPreTax: number;
  totalTax: number;
  totalIncTax: number;
  taxRateBreakdown: Record<string, { amount: number; count: number }>;
} {
  let totalPreTax = 0;
  let totalTax = 0;
  const taxRateBreakdown: Record<string, { amount: number; count: number }> = {};

  items.forEach(item => {
    const itemPreTax = item.basePrice * item.quantity;
    const itemTax = item.taxAmount * item.quantity;
    
    totalPreTax += itemPreTax;
    totalTax += itemTax;
    
    const rateKey = `${(item.taxRate * 100).toFixed(1)}%`;
    if (!taxRateBreakdown[rateKey]) {
      taxRateBreakdown[rateKey] = { amount: 0, count: 0 };
    }
    taxRateBreakdown[rateKey].amount += itemTax;
    taxRateBreakdown[rateKey].count += item.quantity;
  });

  return {
    totalPreTax,
    totalTax,
    totalIncTax: totalPreTax + totalTax,
    taxRateBreakdown
  };
}

/**
 * Update menu item price when base price or tax rate changes
 */
export function updateMenuItemPricing(
  basePrice: number,
  taxRate: number
): { price: number; basePrice: number } {
  const taxInclusivePrice = calculateTaxInclusivePrice(basePrice, taxRate);
  
  return {
    price: Math.round(taxInclusivePrice * 100) / 100, // Round to 2 decimal places
    basePrice: Math.round(basePrice * 100) / 100
  };
}

/**
 * Format currency with tax information
 */
export function formatPriceWithTax(
  price: number,
  taxRate: number,
  showTaxInfo = false
): string {
  const formatted = `€${price.toFixed(2)}`;
  
  if (showTaxInfo) {
    const basePrice = calculateBasePrice(price, taxRate);
    const taxAmount = calculateTaxAmount(basePrice, taxRate);
    return `${formatted} (inc. €${taxAmount.toFixed(2)} VAT @ ${(taxRate * 100).toFixed(1)}%)`;
  }
  
  return formatted;
}

/**
 * Generate tax report data for a given period
 */
export interface TaxReportData {
  reportType: 'daily' | 'monthly' | 'yearly';
  reportDate: string;
  year: number;
  month?: number;
  day?: number;
  totalTaxCollected: number;
  totalPreTaxRevenue: number;
  totalIncTaxRevenue: number;
  totalOrders: number;
  taxBreakdown: Record<string, { amount: number; orders: number }>;
}

export function generateTaxReportData(
  orders: any[],
  reportType: 'daily' | 'monthly' | 'yearly',
  date: Date
): TaxReportData {
  let totalTaxCollected = 0;
  let totalPreTaxRevenue = 0;
  let totalIncTaxRevenue = 0;
  const taxBreakdown: Record<string, { amount: number; orders: number }> = {};

  orders.forEach(order => {
    // Parse order items if they're stored as JSON
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    
    if (Array.isArray(items)) {
      // Calculate tax from each item's final price using default tax rate
      items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        const taxRate = DEFAULT_TAX_RATE; // Use default 23% VAT
        
        // Extract tax from final price: taxAmount = finalPrice * (taxRate / (1 + taxRate))
        const taxAmount = itemTotal * (taxRate / (1 + taxRate));
        const preTaxAmount = itemTotal - taxAmount;
        
        totalTaxCollected += taxAmount;
        totalPreTaxRevenue += preTaxAmount;
        totalIncTaxRevenue += itemTotal;
        
        // Add to tax breakdown
        const rateKey = `${(taxRate * 100).toFixed(1)}%`;
        if (!taxBreakdown[rateKey]) {
          taxBreakdown[rateKey] = { amount: 0, orders: 0 };
        }
        taxBreakdown[rateKey].amount += taxAmount;
      });
      
      // Count this order for tax breakdown
      const rateKey = `${(DEFAULT_TAX_RATE * 100).toFixed(1)}%`;
      if (taxBreakdown[rateKey]) {
        taxBreakdown[rateKey].orders += 1;
      }
    }
  });

  return {
    reportType,
    reportDate: date.toISOString().split('T')[0],
    year: date.getFullYear(),
    month: reportType !== 'yearly' ? date.getMonth() + 1 : undefined,
    day: reportType === 'daily' ? date.getDate() : undefined,
    totalTaxCollected: Math.round(totalTaxCollected * 100) / 100,
    totalPreTaxRevenue: Math.round(totalPreTaxRevenue * 100) / 100,
    totalIncTaxRevenue: Math.round(totalIncTaxRevenue * 100) / 100,
    totalOrders: orders.length,
    taxBreakdown
  };
}