import { 
  MenuCategory, InsertMenuCategory, 
  MenuItem, InsertMenuItem,
  Order, InsertOrder
} from "@shared/schema";

export interface IStorage {
  // Menu Categories
  getMenuCategories(): Promise<MenuCategory[]>;
  getMenuCategoryBySlug(slug: string): Promise<MenuCategory | undefined>;
  createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory>;

  // Menu Items
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
}

export class MemStorage implements IStorage {
  private menuCategories: Map<number, MenuCategory>;
  private menuItems: Map<number, MenuItem>;
  private orders: Map<number, Order>;
  private categoryIdCounter: number;
  private menuItemIdCounter: number;
  private orderIdCounter: number;

  constructor() {
    this.menuCategories = new Map();
    this.menuItems = new Map();
    this.orders = new Map();
    this.categoryIdCounter = 1;
    this.menuItemIdCounter = 1;
    this.orderIdCounter = 1;

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

export const storage = new MemStorage();
