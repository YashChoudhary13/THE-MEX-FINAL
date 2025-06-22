import { pgTable, text, serial, integer, boolean, jsonb, doublePrecision, timestamp, date, decimal, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { eq } from "drizzle-orm";

// Menu Category
export const menuCategories = pgTable("menu_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  order: integer("order").notNull().default(0),
});

export const insertMenuCategorySchema = createInsertSchema(menuCategories).pick({
  name: true,
  slug: true,
  description: true,
  order: true,
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
  image: text("image"),
  featured: boolean("featured").default(false),
  soldOut: boolean("sold_out").default(false),
  isHot: boolean("is_hot").default(false),
  isBestSeller: boolean("is_best_seller").default(false),
  label: text("label"), // For tags like "Healthy", "Best Seller", etc.
  ingredients: text("ingredients"),
  calories: text("calories"),
  allergens: text("allergens"),
  dietaryInfo: text("dietary_info").array(),
  prepTime: integer("prep_time").default(15), // Preparation time in minutes
  hasOptions: boolean("has_options").default(false).notNull(),
});

// Menu Item Option Groups (e.g., "Meat or Veg", "Rice", "Burrito Fillings")
export const menuItemOptionGroups = pgTable("menu_item_option_groups", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id").references(() => menuItems.id).notNull(),
  name: text("name").notNull(), // e.g., "Meat or Veg", "Rice", "Burrito Fillings"
  required: boolean("required").default(false).notNull(),
  maxSelections: integer("max_selections").default(1).notNull(), // 1 for single selection, >1 for multiple
  order: integer("order").default(0).notNull(),
});

// Individual options within a group (e.g., "Chicken", "Slow Cooked Beef")
export const menuItemOptions = pgTable("menu_item_options", {
  id: serial("id").primaryKey(),
  optionGroupId: integer("option_group_id").references(() => menuItemOptionGroups.id).notNull(),
  name: text("name").notNull(), // e.g., "Chicken", "Slow Cooked Beef"
  priceModifier: doublePrecision("price_modifier").default(0).notNull(), // additional cost
  order: integer("order").default(0).notNull(),
  available: boolean("available").default(true).notNull(),
});

export const insertMenuItemSchema = createInsertSchema(menuItems).pick({
  name: true,
  description: true,
  price: true,
  categoryId: true,
  image: true,
  featured: true,
  soldOut: true,
  isHot: true,
  isBestSeller: true,
  label: true,
  ingredients: true,
  calories: true,
  allergens: true,
  dietaryInfo: true,
  prepTime: true,
  hasOptions: true,
}).extend({
  image: z.string().optional().refine((val) => {
    if (!val || val === "") return true; // Allow empty
    if (val.startsWith("data:")) return true; // Allow data URLs from file uploads
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, "Please enter a valid URL or upload an image file"),
});

export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;

// Menu Item Option Group schemas
export const insertMenuItemOptionGroupSchema = createInsertSchema(menuItemOptionGroups).omit({
  id: true,
});

export type InsertMenuItemOptionGroup = z.infer<typeof insertMenuItemOptionGroupSchema>;
export type MenuItemOptionGroup = typeof menuItemOptionGroups.$inferSelect;

// Menu Item Option schemas
export const insertMenuItemOptionSchema = createInsertSchema(menuItemOptions).omit({
  id: true,
});

export type InsertMenuItemOption = z.infer<typeof insertMenuItemOptionSchema>;
export type MenuItemOption = typeof menuItemOptions.$inferSelect;


// Order
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone").notNull(),
  deliveryAddress: text("delivery_address"),
  preparationInstructions: text("preparation_instructions"),
  subtotal: doublePrecision("subtotal").notNull(),
  serviceFee: doublePrecision("service_fee").notNull(),
  tax: doublePrecision("tax").notNull(),
  total: doublePrecision("total").notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, preparing, ready, completed, cancelled
  items: jsonb("items").notNull(), // Serialized cart items
  userId: integer("user_id"), // Optional: links to users table for authenticated orders
  dailyOrderNumber: integer("daily_order_number").notNull(), // Daily reset order number (1, 2, 3...)
  paymentReference: text("payment_reference"), // Stripe payment intent ID
  completedAt: timestamp("completed_at"), // When order was marked completed
  promoCode: text("promo_code"), // Applied promo code
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  customerName: true,
  customerEmail: true,
  customerPhone: true,
  deliveryAddress: true,
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
  promoCode: true,
});

// Schema for creating orders (excludes auto-generated fields)
export const createOrderSchema = insertOrderSchema.omit({
  dailyOrderNumber: true,
  paymentReference: true,
  completedAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type CreateOrder = z.infer<typeof createOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Order item interface - moved after table definition
export interface OrderItem {
  quantity: number;
  name: string;
  price: number;
  menuItemId?: number;
}

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
}).extend({
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
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
}).extend({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  minOrderValue: z.coerce.number().min(0).default(0),
  usageLimit: z.coerce.number().positive().optional(),
  maxDiscountAmount: z.coerce.number().positive().optional(),
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
  customizations?: string; // JSON string for customization details
};
