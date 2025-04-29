import { 
  MenuCategory, InsertMenuCategory,
  MenuItem, InsertMenuItem,
  Order, InsertOrder,
  User, InsertUser,
  SpecialOffer, InsertSpecialOffer,
  users, menuCategories, menuItems, orders, specialOffers
} from "@shared/schema";

import session from "express-session";
import { eq, and } from "drizzle-orm";
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
    const newItem: MenuItem = { ...item, id };
    this.menuItems.set(id, newItem);
    return newItem;
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
    const newOrder: Order = { ...order, id };
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
      popular: true,
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
      popular: false,
      rating: 4.5,
      reviewCount: 84
    });

    await this.createMenuItem({
      name: "Spinach Artichoke Dip",
      description: "Creamy spinach and artichoke dip served with toasted bread and vegetable crudités.",
      price: 9.99,
      categoryId: starters.id,
      image: "https://images.unsplash.com/photo-1576506295286-5cda18df43e7",
      popular: false,
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
      popular: false,
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
      popular: true,
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
      popular: true,
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
      popular: false,
      rating: 4.9,
      reviewCount: 112
    });

    await this.createMenuItem({
      name: "Garlic Bread",
      description: "Toasted bread with garlic butter and melted mozzarella cheese.",
      price: 5.99,
      categoryId: sides.id,
      image: "https://images.unsplash.com/photo-1619535860434-cf54aab1a60c",
      popular: false,
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
      popular: true,
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
      popular: false,
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
      popular: true,
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
      popular: false,
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
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
