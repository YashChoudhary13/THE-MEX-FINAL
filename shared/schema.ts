import { pgTable, text, serial, integer, boolean, jsonb, doublePrecision, timestamp } from "drizzle-orm/pg-core";
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
  deliveryAddress: text("delivery_address").notNull(),
  city: text("city").notNull(),
  zipCode: text("zip_code").notNull(),
  deliveryInstructions: text("delivery_instructions"),
  subtotal: doublePrecision("subtotal").notNull(),
  deliveryFee: doublePrecision("delivery_fee").notNull(),
  tax: doublePrecision("tax").notNull(),
  total: doublePrecision("total").notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, preparing, ready, delivered, cancelled
  items: jsonb("items").notNull(), // Serialized cart items
  userId: integer("user_id"), // Optional: links to users table for authenticated orders
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  customerName: true,
  customerEmail: true,
  customerPhone: true,
  deliveryAddress: true,
  city: true,
  zipCode: true,
  deliveryInstructions: true,
  subtotal: true,
  deliveryFee: true,
  tax: true,
  total: true,
  status: true,
  items: true,
  userId: true,
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
