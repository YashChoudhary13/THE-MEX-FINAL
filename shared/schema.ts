import { pgTable, text, serial, integer, boolean, jsonb, doublePrecision, timestamp, date, decimal, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Menu Category
export const menuCategories = pgTable("menu_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const insertMenuCategorySchema = createInsertSchema(menuCategories).pick({
  name: true,
  slug: true,
});

export type InsertMenuCategory = z.infer<typeof insertMenuCategorySchema>;
export type MenuCategory = typeof menuCategories.$inferSelect;

// Menu Item
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  categoryId: integer("category_id").notNull(),
  image: text("image").notNull(),
  featured: boolean("featured").default(false),
  label: text("label"), // For tags like "Healthy", "Best Seller", etc.
  rating: doublePrecision("rating").default(5.0),
  reviewCount: integer("review_count").default(0),
  ingredients: text("ingredients"),
  calories: text("calories"),
  allergens: text("allergens"),
  dietaryInfo: text("dietary_info").array(),
  prepTime: integer("prep_time").default(15), // Preparation time in minutes
});

export const insertMenuItemSchema = createInsertSchema(menuItems).pick({
  name: true,
  description: true,
  price: true,
  categoryId: true,
  image: true,
  featured: true,
  label: true,
  rating: true,
  reviewCount: true,
  ingredients: true,
  calories: true,
  allergens: true,
  dietaryInfo: true,
  prepTime: true,
});

export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;

// Order
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone").notNull(),
  preparationInstructions: text("preparation_instructions"),
  subtotal: doublePrecision("subtotal").notNull(),
  serviceFee: doublePrecision("service_fee").notNull(),
  tax: doublePrecision("tax").notNull(),
  total: doublePrecision("total").notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, preparing, ready, completed, cancelled
  items: jsonb("items").notNull(), // Serialized cart items
  userId: integer("user_id"), // Optional: links to users table for authenticated orders
  dailyOrderNumber: integer("daily_order_number"), // Daily reset order number (1, 2, 3...)
  paymentReference: text("payment_reference"), // Stripe payment intent ID
  completedAt: timestamp("completed_at"), // When order was marked completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  customerName: true,
  customerEmail: true,
  customerPhone: true,
  preparationInstructions: true,
  subtotal: true,
  serviceFee: true,
  tax: true,
  total: true,
  status: true,
  items: true,
  userId: true,
  dailyOrderNumber: true,
  paymentReference: true,
  completedAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  role: text("role").notNull().default("user"), // user, admin
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Special Offers
export const specialOffers = pgTable("special_offers", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id").notNull(),
  discountType: text("discount_type").notNull().default("percentage"), // percentage, amount
  discountValue: doublePrecision("discount_value").notNull(),
  originalPrice: doublePrecision("original_price").notNull(),
  specialPrice: doublePrecision("special_price").notNull(),
  active: boolean("active").notNull().default(true),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
});

export const insertSpecialOfferSchema = createInsertSchema(specialOffers).pick({
  menuItemId: true,
  discountType: true,
  discountValue: true,
  originalPrice: true,
  specialPrice: true,
  active: true,
  startDate: true,
  endDate: true,
});

export type InsertSpecialOffer = z.infer<typeof insertSpecialOfferSchema>;
export type SpecialOffer = typeof specialOffers.$inferSelect;

// Promo Codes
export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull().default("percentage"), // percentage, amount
  discountValue: doublePrecision("discount_value").notNull(),
  minOrderValue: doublePrecision("min_order_value").default(0),
  maxDiscountAmount: doublePrecision("max_discount_amount"), // Optional maximum discount (for percentage type)
  active: boolean("active").notNull().default(true),
  usageLimit: integer("usage_limit"), // Optional limit on total usage
  currentUsage: integer("current_usage").notNull().default(0),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"), // Optional end date
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPromoCodeSchema = createInsertSchema(promoCodes).pick({
  code: true,
  discountType: true,
  discountValue: true,
  minOrderValue: true,
  maxDiscountAmount: true,
  active: true,
  usageLimit: true,
  currentUsage: true,
  startDate: true,
  endDate: true,
});

export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;
export type PromoCode = typeof promoCodes.$inferSelect;

// System Settings
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).pick({
  key: true,
  value: true,
});

export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;

// Daily Reports Table - stores daily aggregated data for the last 30 days
export const dailyReports = pgTable("daily_reports", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(), // YYYY-MM-DD format
  totalOrders: integer("total_orders").notNull().default(0),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDailyReportSchema = createInsertSchema(dailyReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDailyReport = z.infer<typeof insertDailyReportSchema>;
export type DailyReport = typeof dailyReports.$inferSelect;

// Monthly Reports Table - stores monthly aggregated data for the last 12 months
export const monthlyReports = pgTable("monthly_reports", {
  id: serial("id").primaryKey(),
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  totalOrders: integer("total_orders").notNull().default(0),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueYearMonth: unique().on(table.year, table.month),
}));

export const insertMonthlyReportSchema = createInsertSchema(monthlyReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMonthlyReport = z.infer<typeof insertMonthlyReportSchema>;
export type MonthlyReport = typeof monthlyReports.$inferSelect;

// Cart Item (client-side type only)
export type CartItem = {
  id: number;
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  prepTime?: number; // Time in minutes to prepare this item
};
