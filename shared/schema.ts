import { pgTable, text, serial, integer, boolean, jsonb, doublePrecision } from "drizzle-orm/pg-core";
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
  popular: boolean("popular").default(false),
  label: text("label"), // For tags like "Healthy", "Best Seller", etc.
  rating: doublePrecision("rating").default(5.0),
  reviewCount: integer("review_count").default(0),
  ingredients: text("ingredients"),
  calories: text("calories"),
  allergens: text("allergens"),
  dietaryInfo: text("dietary_info").array(),
});

export const insertMenuItemSchema = createInsertSchema(menuItems).pick({
  name: true,
  description: true,
  price: true,
  categoryId: true,
  image: true,
  popular: true,
  label: true,
  rating: true,
  reviewCount: true,
  ingredients: true,
  calories: true,
  allergens: true,
  dietaryInfo: true,
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
  status: text("status").notNull().default("pending"), // pending, confirmed, delivered, cancelled
  items: jsonb("items").notNull(), // Serialized cart items
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
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Cart Item (client-side type only)
export type CartItem = {
  id: number;
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
};
