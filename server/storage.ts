import { 
  MenuCategory, InsertMenuCategory,
  MenuItem, InsertMenuItem,
  Order, InsertOrder,
  User, InsertUser,
  SpecialOffer, InsertSpecialOffer,
  PromoCode, InsertPromoCode,
  SystemSetting, InsertSystemSetting,
  DailyReport, InsertDailyReport,
  MonthlyReport, InsertMonthlyReport,
  users, menuCategories, menuItems, orders, specialOffers, promoCodes, systemSettings, dailyReports, monthlyReports
} from "@shared/schema";

import session from "express-session";
import { eq, and, isNull, lte, gt, desc, or, lt, sql } from "drizzle-orm";
import { db } from "./db";
import bcrypt from "bcryptjs";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import createMemoryStore from "memorystore";

export interface IStorage {
  // Menu Categories
  getMenuCategories(): Promise<MenuCategory[]>;
  getMenuCategoryBySlug(slug: string): Promise<MenuCategory | undefined>;
  createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory>;
  updateMenuCategory(id: number, category: Partial<InsertMenuCategory>): Promise<MenuCategory | undefined>;
  deleteMenuCategory(id: number): Promise<boolean>;

  // Menu Items
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<boolean>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;

  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyUser(username: string, password: string): Promise<User | undefined>;
  updateUserPassword(id: number, password: string): Promise<boolean>;
  updateUserProfile(id: number, data: {username?: string, email?: string}): Promise<boolean>;
  
  // Special Offers
  getSpecialOffers(): Promise<SpecialOffer[]>;
  getActiveSpecialOffer(): Promise<(SpecialOffer & { menuItem: MenuItem }) | undefined>;
  createSpecialOffer(offer: InsertSpecialOffer): Promise<SpecialOffer>;
  updateSpecialOffer(id: number, offer: Partial<InsertSpecialOffer>): Promise<SpecialOffer | undefined>;
  deactivateAllSpecialOffers(): Promise<boolean>;
  
  // Promo Codes
  getPromoCodes(): Promise<PromoCode[]>;
  getPromoCodeByCode(code: string): Promise<PromoCode | undefined>;
  createPromoCode(promoCode: InsertPromoCode): Promise<PromoCode>;
  updatePromoCode(id: number, promoCode: Partial<InsertPromoCode>): Promise<PromoCode | undefined>;
  incrementPromoCodeUsage(id: number): Promise<boolean>;
  deletePromoCode(id: number): Promise<boolean>;
  validatePromoCode(code: string, orderTotal: number): Promise<{ valid: boolean; message?: string; discount?: number; }>;
  
  // System Settings
  getSystemSetting(key: string): Promise<string | undefined>;
  updateSystemSetting(key: string, value: string): Promise<boolean>;
  getServiceFee(): Promise<number>;
  
  // Daily Reports
  getDailyReports(days?: number): Promise<DailyReport[]>;
  createOrUpdateDailyReport(date: string, orders: number, revenue: number): Promise<DailyReport>;
  getCurrentDayStats(): Promise<{ totalOrders: number; totalRevenue: number }>;
  resetDailyStats(): Promise<boolean>;
  
  // Monthly Reports
  getMonthlyReports(months?: number): Promise<MonthlyReport[]>;
  createOrUpdateMonthlyReport(year: number, month: number, orders: number, revenue: number): Promise<MonthlyReport>;
  
  // Data Cleanup
  cleanupOldData(): Promise<boolean>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private menuCategories: Map<number, MenuCategory>;
  private menuItems: Map<number, MenuItem>;
  private orders: Map<number, Order>;
  private users: Map<number, User>;
  private categoryIdCounter: number;
  private menuItemIdCounter: number;
  private orderIdCounter: number;
  private userIdCounter: number;
  sessionStore: session.Store;

  constructor() {
    this.menuCategories = new Map();
    this.menuItems = new Map();
    this.orders = new Map();
    this.users = new Map();
    this.categoryIdCounter = 1;
    this.menuItemIdCounter = 1;
    this.orderIdCounter = 1;
    this.userIdCounter = 1;
    
    // Create a memory session store
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });

    // Initialize with default data
    this.initializeDefaultData();
  }

  // Menu Categories
  async getMenuCategories(): Promise<MenuCategory[]> {
    return Array.from(this.menuCategories.values());
  }

  async getMenuCategoryBySlug(slug: string): Promise<MenuCategory | undefined> {
    return Array.from(this.menuCategories.values()).find(
      (category) => category.slug === slug
    );
  }

  async createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory> {
    const id = this.categoryIdCounter++;
    const newCategory: MenuCategory = { ...category, id };
    this.menuCategories.set(id, newCategory);
    return newCategory;
  }
  
  async updateMenuCategory(id: number, category: Partial<InsertMenuCategory>): Promise<MenuCategory | undefined> {
    const existingCategory = this.menuCategories.get(id);
    if (!existingCategory) return undefined;
    
    const updatedCategory = { ...existingCategory, ...category };
    this.menuCategories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async deleteMenuCategory(id: number): Promise<boolean> {
    return this.menuCategories.delete(id);
  }

  // Menu Items
  async getMenuItems(): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values());
  }

  async getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values()).filter(
      (item) => item.categoryId === categoryId
    );
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const id = this.menuItemIdCounter++;
    const newItem: MenuItem = { 
      ...item, 
      id,
      featured: item.featured || null,
      label: item.label || null,
      rating: item.rating || null,
      reviewCount: item.reviewCount || null,
      ingredients: item.ingredients || null,
      calories: item.calories || null,
      allergens: item.allergens || null,
      dietaryInfo: item.dietaryInfo || null,
      prepTime: item.prepTime ?? 15
    };
    this.menuItems.set(id, newItem);
    return newItem;
  }
  
  async updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const existingItem = this.menuItems.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem = { ...existingItem, ...item };
    this.menuItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteMenuItem(id: number): Promise<boolean> {
    return this.menuItems.delete(id);
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const newOrder: Order = { 
      ...order, 
      id,
      status: order.status || 'pending',
      customerEmail: order.customerEmail || null,
      preparationInstructions: order.preparationInstructions || null,
      userId: order.userId ?? null,
      createdAt: new Date()
    };
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder: Order = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  async deleteOrder(id: number): Promise<boolean> {
    return this.orders.delete(id);
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { 
      ...user, 
      id, 
      role: user.role || 'user',
      email: user.email || null,
      createdAt: new Date()
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async verifyUser(username: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByUsername(username);
    if (!user) return undefined;
    
    // In a real app, we'd compare hashed passwords here
    return user.password === password ? user : undefined;
  }

  async updateUserPassword(id: number, password: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    
    const updatedUser = { ...user, password };
    this.users.set(id, updatedUser);
    return true;
  }
  
  async updateUserProfile(id: number, data: {username?: string, email?: string}): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return true;
  }
  
  // Special Offers
  async getSpecialOffers(): Promise<SpecialOffer[]> {
    return [];
  }
  
  async getActiveSpecialOffer(): Promise<(SpecialOffer & { menuItem: MenuItem }) | undefined> {
    return undefined;
  }
  
  async createSpecialOffer(offer: InsertSpecialOffer): Promise<SpecialOffer> {
    throw new Error("Not implemented in memory storage");
  }
  
  async updateSpecialOffer(id: number, offer: Partial<InsertSpecialOffer>): Promise<SpecialOffer | undefined> {
    throw new Error("Not implemented in memory storage");
  }
  
  async deactivateAllSpecialOffers(): Promise<boolean> {
    return true;
  }
  
  // Promo Codes
  async getPromoCodes(): Promise<PromoCode[]> {
    return [];
  }
  
  async getPromoCodeByCode(code: string): Promise<PromoCode | undefined> {
    return undefined;
  }
  
  async createPromoCode(promoCode: InsertPromoCode): Promise<PromoCode> {
    throw new Error("Not implemented in memory storage");
  }
  
  async updatePromoCode(id: number, promoCode: Partial<InsertPromoCode>): Promise<PromoCode | undefined> {
    throw new Error("Not implemented in memory storage");
  }
  
  async incrementPromoCodeUsage(id: number): Promise<boolean> {
    return false;
  }
  
  async deletePromoCode(id: number): Promise<boolean> {
    return false;
  }
  
  async validatePromoCode(code: string, orderTotal: number): Promise<{ valid: boolean; message?: string; discount?: number; }> {
    return { valid: false, message: "Promo codes not available in memory storage" };
  }
  
  // System Settings
  async getSystemSetting(key: string): Promise<string | undefined> {
    if (key === "service_fee") return "2.99";
    return undefined;
  }
  
  async updateSystemSetting(key: string, value: string): Promise<boolean> {
    return true;
  }
  
  async getServiceFee(): Promise<number> {
    return 2.99; // Default service fee for memory storage
  }

  // Daily Reports - Memory implementation
  async getDailyReports(days: number = 30): Promise<DailyReport[]> {
    // For memory storage, return empty array
    return [];
  }

  async createOrUpdateDailyReport(date: string, orders: number, revenue: number): Promise<DailyReport> {
    const report: DailyReport = {
      id: 1,
      date,
      totalOrders: orders,
      totalRevenue: revenue.toFixed(2),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return report;
  }

  async getCurrentDayStats(): Promise<{ totalOrders: number; totalRevenue: number }> {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = Array.from(this.orders.values()).filter(order => 
      order.createdAt.toISOString().split('T')[0] === today
    );
    const totalOrders = todayOrders.length;
    const totalRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
    return { totalOrders, totalRevenue };
  }

  async resetDailyStats(): Promise<boolean> {
    // For memory storage, just return true
    return true;
  }

  // Monthly Reports - Memory implementation
  async getMonthlyReports(months: number = 12): Promise<MonthlyReport[]> {
    // For memory storage, return empty array
    return [];
  }

  async createOrUpdateMonthlyReport(year: number, month: number, orders: number, revenue: number): Promise<MonthlyReport> {
    const report: MonthlyReport = {
      id: 1,
      year,
      month,
      totalOrders: orders,
      totalRevenue: revenue.toFixed(2),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return report;
  }

  // Data Cleanup - Memory implementation
  async cleanupOldData(): Promise<boolean> {
    // For memory storage, just return true
    return true;
  }

  // Initialize with default data
  private async initializeDefaultData() {
    // Create categories
    const starters = await this.createMenuCategory({ name: "Starters", slug: "starters" });
    const mainCourses = await this.createMenuCategory({ name: "Main Courses", slug: "main-courses" });
    const sides = await this.createMenuCategory({ name: "Sides", slug: "sides" });
    const desserts = await this.createMenuCategory({ name: "Desserts", slug: "desserts" });
    const drinks = await this.createMenuCategory({ name: "Drinks", slug: "drinks" });

    // Create menu items
    // Starters
    await this.createMenuItem({
      name: "Loaded Nachos",
      description: "Crispy tortilla chips topped with melted cheese, jalapeños, guacamole, and sour cream.",
      price: 8.99,
      categoryId: starters.id,
      image: "https://images.unsplash.com/photo-1559847844-5315695dadae",
      featured: true,
      label: "Popular",
      rating: 5.0,
      reviewCount: 126
    });

    await this.createMenuItem({
      name: "Crispy Calamari",
      description: "Lightly battered calamari rings served with lemon aioli and marinara sauce.",
      price: 10.99,
      categoryId: starters.id,
      image: "https://images.unsplash.com/photo-1625944525533-473f1b3d9684",
      featured: false,
      rating: 4.5,
      reviewCount: 84
    });

    await this.createMenuItem({
      name: "Spinach Artichoke Dip",
      description: "Creamy spinach and artichoke dip served with toasted bread and vegetable crudités.",
      price: 9.99,
      categoryId: starters.id,
      image: "https://images.unsplash.com/photo-1576506295286-5cda18df43e7",
      featured: false,
      rating: 4.8,
      reviewCount: 92
    });

    // Main Courses
    await this.createMenuItem({
      name: "Grilled Salmon",
      description: "Fresh Atlantic salmon fillet, grilled to perfection, served with asparagus and lemon butter sauce.",
      price: 18.99,
      categoryId: mainCourses.id,
      image: "https://images.unsplash.com/photo-1565299507177-b0ac66763828",
      featured: false,
      label: "Healthy",
      rating: 5.0,
      reviewCount: 156
    });

    await this.createMenuItem({
      name: "Classic Burger",
      description: "Juicy beef patty with lettuce, tomato, pickles, and our special sauce on a brioche bun. Served with fries.",
      price: 14.99,
      categoryId: mainCourses.id,
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591",
      featured: true,
      label: "Best Seller",
      rating: 4.8,
      reviewCount: 209
    });

    await this.createMenuItem({
      name: "Margherita Pizza",
      description: "Hand-tossed pizza with tomato sauce, fresh mozzarella, basil, and extra virgin olive oil.",
      price: 15.99,
      categoryId: mainCourses.id,
      image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002",
      featured: true,
      rating: 4.7,
      reviewCount: 178
    });

    // Sides
    await this.createMenuItem({
      name: "Truffle Fries",
      description: "Crispy French fries tossed with truffle oil, parmesan cheese, and fresh herbs.",
      price: 6.99,
      categoryId: sides.id,
      image: "https://images.unsplash.com/photo-1639744093327-1aecff9c17b8",
      featured: false,
      rating: 4.9,
      reviewCount: 112
    });

    await this.createMenuItem({
      name: "Garlic Bread",
      description: "Toasted bread with garlic butter and melted mozzarella cheese.",
      price: 5.99,
      categoryId: sides.id,
      image: "https://images.unsplash.com/photo-1619535860434-cf54aab1a60c",
      featured: false,
      rating: 4.6,
      reviewCount: 87
    });

    // Desserts
    await this.createMenuItem({
      name: "Chocolate Lava Cake",
      description: "Warm chocolate cake with a molten center, served with vanilla ice cream.",
      price: 7.99,
      categoryId: desserts.id,
      image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51",
      featured: true,
      label: "Popular",
      rating: 4.9,
      reviewCount: 143
    });

    await this.createMenuItem({
      name: "New York Cheesecake",
      description: "Creamy classic cheesecake with graham cracker crust and berry compote.",
      price: 8.99,
      categoryId: desserts.id,
      image: "https://images.unsplash.com/photo-1567171466295-4afa63d45416",
      featured: false,
      rating: 4.8,
      reviewCount: 124
    });

    // Drinks
    await this.createMenuItem({
      name: "Signature Cocktail",
      description: "House special cocktail with premium spirits, fresh juice, and aromatic bitters.",
      price: 12.99,
      categoryId: drinks.id,
      image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b",
      featured: true,
      label: "Signature",
      rating: 4.9,
      reviewCount: 98
    });

    await this.createMenuItem({
      name: "Fresh Berry Smoothie",
      description: "Blend of seasonal berries, yogurt, and honey.",
      price: 6.99,
      categoryId: drinks.id,
      image: "https://images.unsplash.com/photo-1553530666-ba11a90a0868",
      featured: false,
      label: "Healthy",
      rating: 4.7,
      reviewCount: 76
    });
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      pool,
      tableName: 'session',
      createTableIfMissing: true
    });
  }
  
  // Menu Categories
  async getMenuCategories(): Promise<MenuCategory[]> {
    return await db.select().from(menuCategories);
  }

  async getMenuCategoryBySlug(slug: string): Promise<MenuCategory | undefined> {
    const [category] = await db.select().from(menuCategories).where(eq(menuCategories.slug, slug));
    return category;
  }

  async createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory> {
    const [newCategory] = await db.insert(menuCategories).values(category).returning();
    return newCategory;
  }

  async updateMenuCategory(id: number, category: Partial<InsertMenuCategory>): Promise<MenuCategory | undefined> {
    const [updatedCategory] = await db
      .update(menuCategories)
      .set(category)
      .where(eq(menuCategories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteMenuCategory(id: number): Promise<boolean> {
    const result = await db.delete(menuCategories).where(eq(menuCategories.id, id));
    return true;
  }

  // Menu Items
  async getMenuItems(): Promise<MenuItem[]> {
    return await db.select().from(menuItems);
  }

  async getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]> {
    return await db.select().from(menuItems).where(eq(menuItems.categoryId, categoryId));
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return item;
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const [newItem] = await db.insert(menuItems).values(item).returning();
    return newItem;
  }

  async updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const [updatedItem] = await db
      .update(menuItems)
      .set(item)
      .where(eq(menuItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    await db.delete(menuItems).where(eq(menuItems.id, id));
    return true;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async deleteOrder(id: number): Promise<boolean> {
    await db.delete(orders).where(eq(orders.id, id));
    return true;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const [newUser] = await db
      .insert(users)
      .values({ ...user, password: hashedPassword })
      .returning();
    return newUser;
  }

  async verifyUser(username: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByUsername(username);
    if (!user) return undefined;
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    return isValidPassword ? user : undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async updateUserPassword(id: number, password: string): Promise<boolean> {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error("Error updating user password:", error);
      return false;
    }
  }
  
  async updateUserProfile(id: number, data: {username?: string, email?: string}): Promise<boolean> {
    try {
      await db
        .update(users)
        .set(data)
        .where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error("Error updating user profile:", error);
      return false;
    }
  }

  // Special Offers
  async getSpecialOffers(): Promise<SpecialOffer[]> {
    return await db.select().from(specialOffers);
  }

  async getActiveSpecialOffer(): Promise<(SpecialOffer & { menuItem: MenuItem }) | undefined> {
    const [specialOffer] = await db
      .select()
      .from(specialOffers)
      .where(eq(specialOffers.active, true));
    
    if (!specialOffer) return undefined;
    
    const [menuItem] = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, specialOffer.menuItemId));
    
    return { ...specialOffer, menuItem };
  }

  async createSpecialOffer(offer: InsertSpecialOffer): Promise<SpecialOffer> {
    // First deactivate all other special offers
    await this.deactivateAllSpecialOffers();
    
    const [newOffer] = await db
      .insert(specialOffers)
      .values(offer)
      .returning();
    
    return newOffer;
  }

  async updateSpecialOffer(id: number, offer: Partial<InsertSpecialOffer>): Promise<SpecialOffer | undefined> {
    const [updatedOffer] = await db
      .update(specialOffers)
      .set(offer)
      .where(eq(specialOffers.id, id))
      .returning();
    
    return updatedOffer;
  }

  async deactivateAllSpecialOffers(): Promise<boolean> {
    await db
      .update(specialOffers)
      .set({ active: false });
    
    return true;
  }

  // Promo Codes
  async getPromoCodes(): Promise<PromoCode[]> {
    return db.select().from(promoCodes).orderBy(desc(promoCodes.id));
  }
  
  async getPromoCodeByCode(code: string): Promise<PromoCode | undefined> {
    const [promoCode] = await db
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.code, code));
    
    return promoCode;
  }
  
  async createPromoCode(promoCode: InsertPromoCode): Promise<PromoCode> {
    const [newPromoCode] = await db
      .insert(promoCodes)
      .values(promoCode)
      .returning();
    
    return newPromoCode;
  }
  
  async updatePromoCode(id: number, promoCode: Partial<InsertPromoCode>): Promise<PromoCode | undefined> {
    const [updatedPromoCode] = await db
      .update(promoCodes)
      .set(promoCode)
      .where(eq(promoCodes.id, id))
      .returning();
    
    return updatedPromoCode;
  }
  
  async incrementPromoCodeUsage(id: number): Promise<boolean> {
    await db
      .update(promoCodes)
      .set({
        currentUsage: sql`${promoCodes.currentUsage} + 1`
      })
      .where(eq(promoCodes.id, id));
    
    return true;
  }
  
  async deletePromoCode(id: number): Promise<boolean> {
    await db
      .delete(promoCodes)
      .where(eq(promoCodes.id, id));
    
    return true;
  }
  
  async validatePromoCode(code: string, orderTotal: number): Promise<{ valid: boolean; message?: string; discount?: number; }> {
    const promoCode = await this.getPromoCodeByCode(code);
    
    if (!promoCode) {
      return { valid: false, message: "Invalid promo code" };
    }
    
    if (!promoCode.active) {
      return { valid: false, message: "This promo code is not active" };
    }
    
    const now = new Date();
    if (promoCode.startDate && promoCode.startDate > now) {
      return { valid: false, message: "This promo code is not active yet" };
    }
    
    if (promoCode.endDate && promoCode.endDate < now) {
      return { valid: false, message: "This promo code has expired" };
    }
    
    if (promoCode.usageLimit && promoCode.currentUsage >= promoCode.usageLimit) {
      return { valid: false, message: "This promo code has reached its usage limit" };
    }
    
    if (promoCode.minOrderValue && orderTotal < promoCode.minOrderValue) {
      return { 
        valid: false, 
        message: `This promo code requires a minimum order of $${promoCode.minOrderValue.toFixed(2)}` 
      };
    }
    
    let discount = 0;
    
    if (promoCode.discountType === "percentage") {
      discount = (orderTotal * promoCode.discountValue) / 100;
      
      // Apply maximum discount if set
      if (promoCode.maxDiscountAmount && discount > promoCode.maxDiscountAmount) {
        discount = promoCode.maxDiscountAmount;
      }
    } else {
      // Fixed amount discount
      discount = Math.min(promoCode.discountValue, orderTotal);
    }
    
    return { valid: true, discount };
  }
  
  // System Settings
  async getSystemSetting(key: string): Promise<string | undefined> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key));
    
    return setting?.value;
  }
  
  async updateSystemSetting(key: string, value: string): Promise<boolean> {
    await db
      .insert(systemSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value, updatedAt: new Date() }
      });
    
    return true;
  }
  
  async getServiceFee(): Promise<number> {
    const fee = await this.getSystemSetting("service_fee");
    return fee ? parseFloat(fee) : 2.99; // Default to 2.99 if not set
  }

  // Daily Reports
  async getDailyReports(days: number = 30): Promise<DailyReport[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    return await db
      .select()
      .from(dailyReports)
      .where(gt(dailyReports.date, cutoffDateStr))
      .orderBy(desc(dailyReports.date));
  }

  async createOrUpdateDailyReport(date: string, ordersCount: number, revenue: number): Promise<DailyReport> {
    const existing = await db
      .select()
      .from(dailyReports)
      .where(eq(dailyReports.date, date))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(dailyReports)
        .set({
          totalOrders: ordersCount,
          totalRevenue: revenue.toString(),
          updatedAt: new Date()
        })
        .where(eq(dailyReports.date, date))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(dailyReports)
        .values({
          date,
          totalOrders: ordersCount,
          totalRevenue: revenue.toString()
        })
        .returning();
      return created;
    }
  }

  async getCurrentDayStats(): Promise<{ totalOrders: number; totalRevenue: number; completedRevenue: number; completedOrders: number }> {
    const today = new Date();
    // Convert to Cork/Dublin timezone
    const dublinDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Dublin',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(today);

    const todayOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          gt(orders.createdAt, new Date(`${dublinDate}T00:00:00`)),
          lte(orders.createdAt, new Date(`${dublinDate}T23:59:59`))
        )
      );

    const totalOrders = todayOrders.length;
    const totalRevenue = todayOrders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);
    
    // Calculate completed orders only
    const completedTodayOrders = todayOrders.filter(order => order.status === 'completed');
    const completedOrders = completedTodayOrders.length;
    const completedRevenue = completedTodayOrders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);

    return { totalOrders, totalRevenue, completedRevenue, completedOrders };
  }

  async resetDailyStats(): Promise<boolean> {
    // Archive current day stats to daily reports before reset
    const stats = await this.getCurrentDayStats();
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Dublin'
    }).format(new Date());
    
    await this.createOrUpdateDailyReport(today, stats.totalOrders, stats.totalRevenue);
    return true;
  }

  // Monthly Reports
  async getMonthlyReports(months: number = 12): Promise<MonthlyReport[]> {
    return await db
      .select()
      .from(monthlyReports)
      .orderBy(desc(monthlyReports.year), desc(monthlyReports.month))
      .limit(months);
  }

  async createOrUpdateMonthlyReport(year: number, month: number, ordersCount: number, revenue: number): Promise<MonthlyReport> {
    const existing = await db
      .select()
      .from(monthlyReports)
      .where(and(eq(monthlyReports.year, year), eq(monthlyReports.month, month)))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(monthlyReports)
        .set({
          totalOrders: ordersCount,
          totalRevenue: revenue.toString(),
          updatedAt: new Date()
        })
        .where(and(eq(monthlyReports.year, year), eq(monthlyReports.month, month)))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(monthlyReports)
        .values({
          year,
          month,
          totalOrders: ordersCount,
          totalRevenue: revenue.toString()
        })
        .returning();
      return created;
    }
  }

  // Data Cleanup
  async cleanupOldData(): Promise<boolean> {
    try {
      // Remove daily reports older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];

      await db.delete(dailyReports).where(lte(dailyReports.date, cutoffDate));

      // Remove monthly reports older than 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      await db.delete(monthlyReports).where(
        or(
          lt(monthlyReports.year, twelveMonthsAgo.getFullYear()),
          and(
            eq(monthlyReports.year, twelveMonthsAgo.getFullYear()),
            lt(monthlyReports.month, twelveMonthsAgo.getMonth() + 1)
          )
        )
      );

      return true;
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      return false;
    }
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
