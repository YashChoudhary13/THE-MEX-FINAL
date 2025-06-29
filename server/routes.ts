import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from "./storage";
import { taxService } from "./tax-service";
import { z } from "zod";
import { 
  insertOrderSchema, 
  createOrderSchema,
  insertMenuItemSchema, 
  insertMenuCategorySchema, 
  insertSpecialOfferSchema,
  insertPromoCodeSchema,
  insertMenuItemOptionGroupSchema,
  insertMenuItemOptionSchema
} from "@shared/schema";
import { setupAuth } from "./auth";
import { comparePasswords } from './auth';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();



// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Map to keep track of admin WebSocket connections
const adminSocketConnections = new Set<WebSocket>();

// Map to keep track of customer WebSocket connections by order ID
const customerSocketConnections = new Map<number, Set<WebSocket>>();

// Map to keep track of user WebSocket connections by user ID
const userSocketConnections = new Map<number, Set<WebSocket>>();

// Function to broadcast updates to all connected admin clients
function broadcastToAdmins(message: any) {
  const messageStr = JSON.stringify(message);
  adminSocketConnections.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}


// Function to broadcast updates to users
function broadcastToUser(userId: number, message: any) {
  const messageStr = JSON.stringify(message);
  const userConnections = userSocketConnections.get(userId);
  
  if (userConnections) {
    userConnections.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
}


// Function to broadcast updates to customers tracking specific orders
function broadcastToCustomers(orderId: number, message: any) {
  const messageStr = JSON.stringify(message);
  const customerConnections = customerSocketConnections.get(orderId);
  
  if (customerConnections) {
    let sentCount = 0;
    customerConnections.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
        sentCount++;
        console.log(`Sent update to customer tracking order ${orderId}`);
      }
    });
  }
}

// Function to broadcast order updates to both admin panel and customers
function broadcastOrderUpdate(orderId: number, orderData: any) {
  const updateMessage = {
    type: 'ORDER_UPDATE',
    orderId,
    order: orderData
  };
  
  // Send to admins
  broadcastToAdmins(updateMessage);
  
  // Also broadcast stats refresh message to trigger Overview updates
  broadcastToAdmins({
    type: 'REFRESH_STATS',
    reason: 'order_status_changed'
  });
  
  // Send to customers tracking this order
  broadcastToCustomers(orderId, updateMessage);
  
  // Send to the user who placed the order (if userId exists)
  if (orderData && orderData.userId) {
    broadcastToUser(orderData.userId, updateMessage);
  }
}

// Function to broadcast new orders to admin panel
function broadcastNewOrder(orderData: any) {
  broadcastToAdmins({
    type: 'NEW_ORDER',
    order: orderData
  });
  
  // Also broadcast to the user who placed the order
  if (orderData && orderData.userId) {
    broadcastToUser(orderData.userId, {
      type: 'NEW_ORDER',
      order: orderData
    });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication and get middleware
  const { isAuthenticated, isAdmin } = setupAuth(app);
  
  // Stripe payment endpoint
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, currency = 'usd' } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      console.error('Stripe payment intent error:', error);
      res.status(500).json({ 
        message: "Error creating payment intent",
        error: error.message 
      });
    }
  });

  // API Routes for menu categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getMenuCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.put("/api/categories/reorder", async (req, res) => {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    try {
      const categoryOrders = req.body.categoryOrders as { id: number; order: number }[];
      
      if (!Array.isArray(categoryOrders)) {
        return res.status(400).json({ message: "Invalid category orders data" });
      }

      const success = await storage.updateCategoryOrder(categoryOrders);
      
      if (success) {
        res.json({ message: "Category order updated successfully" });
      } else {
        res.status(500).json({ message: "Failed to update category order" });
      }
    } catch (error) {
      console.error("Error updating category order:", error);
      res.status(500).json({ message: "Failed to update category order" });
    }
  });

  // API Route for menu items
  app.get("/api/menu-items", async (req, res) => {
    try {
      const menuItems = await storage.getMenuItems();
      res.json(menuItems);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  // API Route for menu items by category
  app.get("/api/categories/:categoryId/menu-items", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const menuItems = await storage.getMenuItemsByCategory(categoryId);
      res.json(menuItems);
    } catch (error) {
      console.error("Error fetching menu items by category:", error);
      res.status(500).json({ message: "Failed to fetch menu items by category" });
    }
  });

  // API Route for a single menu item
  app.get("/api/menu-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid menu item ID" });
      }
      
      const menuItem = await storage.getMenuItem(id);
      
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      res.json(menuItem);
    } catch (error) {
      console.error("Error fetching menu item:", error);
      res.status(500).json({ message: "Failed to fetch menu item" });
    }
  });

  // API Route for creating an order (supports both authenticated and guest users)
  app.post("/api/orders", async (req, res) => {
    try {
      // Check if store is open before accepting orders
      const storeOpenSetting = await storage.getSystemSetting('store_open') || 'true';
      const isStoreOpen = storeOpenSetting === 'true';
      
      if (!isStoreOpen) {
        return res.status(423).json({ 
          message: "Store is currently closed and not accepting new orders",
          storeOpen: false 
        });
      }
      
      // Validate request body (dailyOrderNumber is auto-generated on backend)
      const orderData = createOrderSchema.parse(req.body);
      
      console.log("📝 Creating order with data:", orderData);
      
      // Add user ID to order if authenticated
      if (req.user && req.isAuthenticated()) {
        orderData.userId = req.user.id;
      }
      
      // Create the order (dailyOrderNumber will be auto-generated)
      const order = await storage.createOrder(orderData);
      console.log("✅ Order created:", order);
      
      // If a promo code was used, increment its usage count
      if (orderData.promoCode) {
        console.log("🎯 Order used promo code:", orderData.promoCode);
        const promoCodeRecord = await storage.getPromoCodeByCode(orderData.promoCode);
        
        if (promoCodeRecord) {
          await storage.incrementPromoCodeUsage(promoCodeRecord.id);
          console.log("✅ Incremented usage for promo code:", orderData.promoCode, "ID:", promoCodeRecord.id);
        } else {
          console.log("⚠️ Promo code not found during usage increment:", orderData.promoCode);
        }
      }
      
      // Broadcast new order to admin panel
      broadcastNewOrder(order);
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        res.status(400).json({ message: "Invalid order data", errors: error.errors });
      } else {
        console.error("Error creating order:", error);
        res.status(500).json({ message: "Failed to create order" });
      }
    }
  });

  // API Route for getting an order by ID or daily order number (supports both authenticated and guest users)
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      // First try to find by database ID
      let order = await storage.getOrder(id);
      
      // If not found and the ID is small (likely a daily order number), search by daily order number
      if (!order && id < 1000) {
        console.log(`Searching for order with daily number: ${id}`);
        const todaysOrders = await storage.getTodaysOrders();
        console.log(`Today's orders:`, todaysOrders.map(o => ({id: o.id, dailyOrderNumber: o.dailyOrderNumber})));
        order = todaysOrders.find(o => o.dailyOrderNumber === id);
        console.log(`Found order by daily number:`, order ? `Order ${order.id}` : 'Not found');
      }
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // If user is authenticated and not admin, check if they own this order
      if (req.isAuthenticated() && req.user && req.user.role !== 'admin') {
        // Check if order has a userId and it's different from the authenticated user
        const orderUserId = order.userId ? Number(order.userId) : null;
        if (orderUserId && orderUserId !== req.user.id) {
          return res.status(403).json({ message: "Access denied to this order" });
        }
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // (Order status update route is defined below with WebSocket integration)

  // API Route for getting all orders (admin only)
  app.get("/api/admin/orders", isAdmin, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  
  // Fetch today's orders only
  app.get("/api/admin/orders/today", isAdmin, async (req, res) => {
    try {
      const orders = await storage.getTodaysOrders();
      console.log(`Fetched ${orders.length} orders for today`);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching today's orders:", error);
      res.status(500).json({ message: "Failed to fetch today's orders" });
    }
  });

  // Fetch orders by date range (for 30-day tabs)
  app.get("/api/admin/orders/range", isAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      const orders = await storage.getOrdersByDateRange(startDate as string, endDate as string);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders by date range:", error);
      res.status(500).json({ message: "Failed to fetch orders by date range" });
    }
  });

  // API Route for deleting an order (admin only)
  app.delete("/api/orders/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const success = await storage.deleteOrder(id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete order" });
      }
      
      res.json({ message: "Order deleted successfully" });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // Menu Item Options Routes
  
  // Get option groups for a menu item
  app.get("/api/menu-items/:id/option-groups", async (req, res) => {
    try {
      const menuItemId = parseInt(req.params.id);
      const groups = await storage.getMenuItemOptionGroupsWithOptions(menuItemId);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching menu item option groups:", error);
      res.status(500).json({ message: "Failed to fetch option groups" });
    }
  });

  // Create option group for a menu item
  app.post("/api/admin/menu-items/:id/option-groups", isAdmin, async (req, res) => {
    try {
      const menuItemId = parseInt(req.params.id);
      
      const dataToValidate = { ...req.body, menuItemId };
      const result = insertMenuItemOptionGroupSchema.safeParse(dataToValidate);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid option group data", 
          errors: result.error.errors 
        });
      }

      const group = await storage.createMenuItemOptionGroup(result.data);
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating option group:", error);
      res.status(500).json({ message: "Failed to create option group" });
    }
  });

  // Update option group
  app.put("/api/admin/option-groups/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertMenuItemOptionGroupSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid option group data", 
          errors: result.error.errors 
        });
      }

      const group = await storage.updateMenuItemOptionGroup(id, result.data);
      if (!group) {
        return res.status(404).json({ message: "Option group not found" });
      }
      res.json(group);
    } catch (error) {
      console.error("Error updating option group:", error);
      res.status(500).json({ message: "Failed to update option group" });
    }
  });

  // Delete option group
  app.delete("/api/admin/option-groups/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMenuItemOptionGroup(id);
      if (!success) {
        return res.status(404).json({ message: "Option group not found" });
      }
      res.json({ message: "Option group deleted successfully" });
    } catch (error) {
      console.error("Error deleting option group:", error);
      res.status(500).json({ message: "Failed to delete option group" });
    }
  });

  // Create option within a group
  app.post("/api/admin/option-groups/:id/options", isAdmin, async (req, res) => {
    try {
      const optionGroupId = parseInt(req.params.id);
      const result = insertMenuItemOptionSchema.safeParse({ ...req.body, optionGroupId });
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid option data", 
          errors: result.error.errors 
        });
      }

      const option = await storage.createMenuItemOption(result.data);
      res.status(201).json(option);
    } catch (error) {
      console.error("Error creating option:", error);
      res.status(500).json({ message: "Failed to create option" });
    }
  });

  // Update option
  app.put("/api/admin/options/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertMenuItemOptionSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid option data", 
          errors: result.error.errors 
        });
      }

      const option = await storage.updateMenuItemOption(id, result.data);
      if (!option) {
        return res.status(404).json({ message: "Option not found" });
      }
      res.json(option);
    } catch (error) {
      console.error("Error updating option:", error);
      res.status(500).json({ message: "Failed to update option" });
    }
  });

  // Delete option
  app.delete("/api/admin/options/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMenuItemOption(id);
      if (!success) {
        return res.status(404).json({ message: "Option not found" });
      }
      res.json({ message: "Option deleted successfully" });
    } catch (error) {
      console.error("Error deleting option:", error);
      res.status(500).json({ message: "Failed to delete option" });
    }
  });

  // Admin routes for menu category management
  app.post("/api/admin/categories", isAdmin, async (req, res) => {
    try {
      const categoryData = insertMenuCategorySchema.parse(req.body);
      const category = await storage.createMenuCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        console.error("Error creating category:", error);
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  });

  app.patch("/api/admin/categories/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const updatedCategory = await storage.updateMenuCategory(id, req.body);
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/admin/categories/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const success = await storage.deleteMenuCategory(id);
      
      if (!success) {
        return res.status(404).json({ message: "Category not found or could not be deleted" });
      }
      
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Admin routes for menu item management
  app.post("/api/admin/menu-items", isAdmin, async (req, res) => {
    try {
      const menuItemData = insertMenuItemSchema.parse(req.body);
      const menuItem = await storage.createMenuItem(menuItemData);
      res.status(201).json(menuItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid menu item data", errors: error.errors });
      } else {
        console.error("Error creating menu item:", error);
        res.status(500).json({ message: "Failed to create menu item" });
      }
    }
  });

  app.patch("/api/admin/menu-items/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid menu item ID" });
      }

      const updatedMenuItem = await storage.updateMenuItem(id, req.body);
      
      if (!updatedMenuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      // Broadcast menu update to all connected clients
      broadcastToAdmins({
        type: "MENU_ITEM_UPDATED",
        data: updatedMenuItem
      });
      
      // Also broadcast to customers so their menu refreshes
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "MENU_UPDATED",
            data: { menuItemId: updatedMenuItem.id, menuItem: updatedMenuItem }
          }));
        }
      });
      
      res.json(updatedMenuItem);
    } catch (error) {
      console.error("Error updating menu item:", error);
      res.status(500).json({ message: "Failed to update menu item" });
    }
  });

  app.delete("/api/admin/menu-items/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid menu item ID" });
      }

      const success = await storage.deleteMenuItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Menu item not found or could not be deleted" });
      }
      
      res.json({ message: "Menu item deleted successfully" });
    } catch (error) {
      console.error("Error deleting menu item:", error);
      res.status(500).json({ message: "Failed to delete menu item" });
    }
  });

  // Special Offers routes
  app.get("/api/special-offers", async (req, res) => {
    try {
      const specialOffers = await storage.getSpecialOffers();
      res.json(specialOffers);
    } catch (error) {
      console.error("Error fetching special offers:", error);
      res.status(500).json({ message: "Failed to fetch special offers" });
    }
  });

  app.get("/api/special-offers/active", async (req, res) => {
    try {
      const activeOffer = await storage.getActiveSpecialOffer();
      
      if (!activeOffer) {
        return res.json(null);
      }
      
      res.json(activeOffer);
    } catch (error) {
      console.error("Error fetching active special offer:", error);
      res.status(500).json({ message: "Failed to fetch active special offer" });
    }
  });

  // Admin routes for special offers management
  app.post("/api/admin/special-offers", isAdmin, async (req, res) => {
    try {
      console.log("📝 Creating special offer - incoming payload:", req.body);
      
      // Convert date strings to Date objects before validation
      const processedData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
        endDate: req.body.endDate ? new Date(req.body.endDate) : null
      };
      
      console.log("📝 Processed data for validation:", processedData);
      
      const offerData = insertSpecialOfferSchema.parse(processedData);
      console.log("📝 Validated offer data:", offerData);
      
      const offer = await storage.createSpecialOffer(offerData);
      console.log("✅ Special offer created in database:", offer);
      
      // Verify the update by fetching the active special
      const activeSpecial = await storage.getActiveSpecialOffer();
      console.log("🔍 Active special after creation:", activeSpecial);
      
      res.status(201).json(offer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("❌ Validation error:", error.errors);
        res.status(400).json({ message: "Invalid special offer data", errors: error.errors });
      } else {
        console.error("❌ Error creating special offer:", error);
        res.status(500).json({ message: "Failed to create special offer" });
      }
    }
  });

  app.patch("/api/admin/special-offers/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid special offer ID" });
      }

      const updatedOffer = await storage.updateSpecialOffer(id, req.body);
      
      if (!updatedOffer) {
        return res.status(404).json({ message: "Special offer not found" });
      }
      
      res.json(updatedOffer);
    } catch (error) {
      console.error("Error updating special offer:", error);
      res.status(500).json({ message: "Failed to update special offer" });
    }
  });

  app.delete("/api/admin/special-offers/deactivate-all", isAdmin, async (req, res) => {
    try {
      await storage.deactivateAllSpecialOffers();
      res.json({ message: "All special offers deactivated successfully" });
    } catch (error) {
      console.error("Error deactivating special offers:", error);
      res.status(500).json({ message: "Failed to deactivate special offers" });
    }
  });

  // API Route for testing auth
  app.get("/api/auth/test", isAuthenticated, (req, res) => {
    res.json({ 
      message: "You are authenticated!",
      user: req.user
    });
  });
  
  // API Route for testing admin auth
  app.get("/api/admin/test", isAdmin, (req, res) => {
    res.json({ 
      message: "You are authenticated as admin!",
      user: req.user 
    });
  });
  
  // User profile routes
  app.put("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { username, email } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      // Check if username is already taken by a different user
      if (username !== req.user.username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(400).json({ message: "Username is already taken" });
        }
      }
      
      // Check if email is already taken
      if (email && email !== req.user.email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(400).json({ message: "Email is already in use" });
        }
      }
      
      // Update user profile
      const updated = await storage.updateUserProfile(req.user.id, { username, email });
      
      if (updated) {
        // Get updated user to return
        const updatedUser = await storage.getUser(req.user.id);
        res.status(200).json(updatedUser);
      } else {
        res.status(500).json({ message: "Failed to update profile" });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "An error occurred while updating your profile" });
    }
  });

  app.put("/api/user/password", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      // Verify current password
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!await comparePasswords(currentPassword, user.password)) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Update password
      const updated = await storage.updateUserPassword(user.id, newPassword);
      
      if (updated) {
        res.status(200).json({ message: "Password has been updated successfully" });
      } else {
        res.status(500).json({ message: "Failed to update password" });
      }
    } catch (error) {
      console.error("Password update error:", error);
      res.status(500).json({ message: "An error occurred while updating your password" });
    }
  });

  // Password reset request route
  app.post("/api/password-reset/request", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Valid email is required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      // For security reasons, always return the same response regardless of whether the email exists
      // This prevents user enumeration attacks
      
      // Email functionality has been removed - password reset requires manual admin intervention
      res.json({ 
        message: "Password reset functionality is temporarily unavailable. Please contact support for assistance."
      });
      
    } catch (error) {
      console.error("Error requesting password reset:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });
  
  // Password reset validation route
  app.get("/api/password-reset/validate/:token", (req, res) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }
      
      // Password reset functionality has been removed
      res.status(400).json({ message: "Password reset functionality is temporarily unavailable. Please contact support for assistance." });
      
    } catch (error) {
      console.error("Error validating reset token:", error);
      res.status(500).json({ message: "Failed to validate reset token" });
    }
  });
  
  // Password reset completion route
  app.post("/api/password-reset/reset", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }
      
      // Password reset functionality has been removed
      return res.status(400).json({ message: "Password reset functionality is temporarily unavailable. Please contact support for assistance." });
      
      res.json({ 
        message: "Password has been successfully reset"
      });
      
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Get user's order history
  app.get("/api/user/orders", isAuthenticated, async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const userOrders = await storage.getUserOrders(req.user.id);
      console.log(`Fetched ${userOrders.length} orders for user ${req.user.id}`);
      res.json(userOrders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });


  // Admin reporting routes
  app.get('/api/admin/current-stats', isAdmin, async (req, res) => {
    try {
      const stats = await storage.getCurrentDayStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching current stats:', error);
      res.status(500).json({ message: "Error fetching current stats" });
    }
  });

  app.get('/api/admin/daily-reports', isAdmin, async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const reports = await storage.getDailyReports(days);
      res.json(reports);
    } catch (error) {
      console.error('Error fetching daily reports:', error);
      res.status(500).json({ message: "Error fetching daily reports" });
    }
  });

  app.get('/api/admin/monthly-reports', async (req, res) => {
    if (!req.isAuthenticated() || req.user.username !== 'admin') {
      return res.sendStatus(403);
    }

    try {
      const months = req.query.months ? parseInt(req.query.months as string) : 12;
      const reports = await storage.getMonthlyReports(months);
      res.json(reports);
    } catch (error) {
      console.error('Error fetching monthly reports:', error);
      res.status(500).json({ message: "Error fetching monthly reports" });
    }
  });

  const httpServer = createServer(app);

  // Admin route for updating order status
  app.patch("/api/orders/:id/status", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const { status } = req.body;
      
      if (!status || typeof status !== "string") {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const updatedOrder = await storage.updateOrderStatus(id, status);
      
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Broadcast the update to all subscribed clients
      broadcastOrderUpdate(id, updatedOrder);
      
      // SMS notifications have been removed - status updates are handled via WebSocket only
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });
  
  // Admin route for deleting an order
  app.delete("/api/orders/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const deleted = await storage.deleteOrder(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Broadcast to any connected clients that the order was deleted
      broadcastOrderUpdate(id, { id, deleted: true });
      
      res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });
  
  // Test route for updating order status (for testing WebSocket without admin auth)
  app.patch("/api/test/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const { status } = req.body;
      
      if (!status || typeof status !== "string") {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const updatedOrder = await storage.updateOrderStatus(id, status);
      
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Broadcast the update to all subscribed clients
      broadcastOrderUpdate(id, updatedOrder);
      
      // SMS notifications have been removed - status updates are handled via WebSocket only
      
      console.log(`Broadcasting update for order ${id} with status ${status}`);
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Promo code routes
  app.get('/api/admin/promo-codes', isAdmin, async (req, res) => {
    try {
      const promoCodes = await storage.getPromoCodes();
      res.json(promoCodes);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      res.status(500).json({ message: 'Failed to fetch promo codes' });
    }
  });

  app.post('/api/admin/promo-codes', isAdmin, async (req, res) => {
    try {
      console.log("📝 Creating promo code - incoming payload:", req.body);
      
      // Process dates if they exist
      const processedData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        minOrderValue: req.body.minOrderValue || 0,
        currentUsage: 0 // Always start with 0 usage
      };
      
      console.log("📝 Processed promo code data:", processedData);
      
      const promoCodeData = insertPromoCodeSchema.parse(processedData);
      console.log("📝 Validated promo code data:", promoCodeData);
      
      const newPromoCode = await storage.createPromoCode(promoCodeData);
      console.log("✅ Promo code created in database:", newPromoCode);
      
      res.status(201).json(newPromoCode);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("❌ Promo code validation error:", error.errors);
        res.status(400).json({ message: "Invalid promo code data", errors: error.errors });
      } else {
        console.error('❌ Error creating promo code:', error);
        res.status(500).json({ message: 'Failed to create promo code' });
      }
    }
  });

  app.patch('/api/admin/promo-codes/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      console.log("📝 Updating promo code ID:", id, "with payload:", req.body);
      
      // Process dates if they exist, similar to create endpoint
      const processedData = {
        ...req.body,
        startDate: req.body.startDate ? (typeof req.body.startDate === 'string' ? new Date(req.body.startDate + 'T00:00:00') : new Date(req.body.startDate)) : undefined,
        endDate: req.body.endDate ? (typeof req.body.endDate === 'string' ? new Date(req.body.endDate + 'T23:59:59') : new Date(req.body.endDate)) : undefined,
        minOrderValue: Number(req.body.minOrderValue) || 0,
        usageLimit: req.body.usageLimit ? Number(req.body.usageLimit) : null,
        discountValue: Number(req.body.discountValue),
      };
      
      // Remove undefined values to avoid database issues
      Object.keys(processedData).forEach(key => 
        processedData[key] === undefined && delete processedData[key]
      );
      
      console.log("📝 Processed update data:", processedData);
      
      const updatedPromoCode = await storage.updatePromoCode(parseInt(id), processedData);
      
      if (!updatedPromoCode) {
        return res.status(404).json({ message: 'Promo code not found' });
      }
      
      console.log("✅ Promo code updated successfully:", updatedPromoCode);
      res.json(updatedPromoCode);
    } catch (error) {
      console.error('❌ Error updating promo code:', error);
      res.status(500).json({ message: 'Failed to update promo code' });
    }
  });

  app.delete('/api/admin/promo-codes/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await storage.deletePromoCode(parseInt(id));
      
      if (!result) {
        return res.status(404).json({ message: 'Promo code not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting promo code:', error);
      res.status(500).json({ message: 'Failed to delete promo code' });
    }
  });

  app.post('/api/validate-promo', async (req, res) => {
    try {
      const { code, orderTotal } = req.body;
      
      if (!code || typeof orderTotal !== 'number') {
        return res.status(400).json({ message: 'Invalid request data' });
      }
      
      const result = await storage.validatePromoCode(code, orderTotal);
      res.json(result);
    } catch (error) {
      console.error('Error validating promo code:', error);
      res.status(500).json({ message: 'Failed to validate promo code' });
    }
  });
  
  // Test endpoint to create promo codes (remove in production)
  app.post('/api/test/create-promo', async (req, res) => {
    try {
      // Get promo code type from query param (percentage or fixed)
      const type = req.query.type === 'fixed' ? 'fixed' : 'percentage';
      
      if (type === 'fixed') {
        // Create a fixed amount promo code
        const promoCode = await storage.createPromoCode({
          code: "FLAT5",
          discountType: "amount", // Fixed amount discount
          discountValue: 5,        // $5 off
          minOrderValue: 25,       // Minimum order $25
          usageLimit: 100,
          currentUsage: 0,
          endDate: new Date("2025-12-31"),
          active: true
        });
        
        res.status(201).json(promoCode);
      } else {
        // Create a percentage promo code (default)
        const promoCode = await storage.createPromoCode({
          code: "WELCOME10",
          discountType: "percentage", // Percentage discount
          discountValue: 10,          // 10% off
          minOrderValue: 20,          // Minimum order $20
          usageLimit: 100,
          currentUsage: 0,
          endDate: new Date("2025-12-31"),
          active: true
        });
        
        res.status(201).json(promoCode);
      }
    } catch (error) {
      console.error('Error creating test promo code:', error);
      res.status(500).json({ message: 'Failed to create test promo code' });
    }
  });

  // Tax reporting routes - Extract tax amounts from final prices
  app.get('/api/admin/tax-reports/daily', isAdmin, async (req, res) => {
    try {
      const { date } = req.query;
      const reportDate = date ? new Date(date as string) : new Date();
      
      console.log('📊 Daily tax report request:');
      console.log('📊 Query date:', date);
      console.log('📊 Parsed date:', reportDate.toISOString());
      console.log('📊 Report date string:', reportDate.toLocaleDateString('en-GB'));
      
      // Import the new tax calculator
      const { calculateDailyTax } = await import('./tax-calculator');
      
      // Calculate tax data directly for the specific date with order details
      const taxData = await calculateDailyTax(reportDate, true);
      
      console.log('📊 Tax data for', reportDate.toLocaleDateString('en-GB'), ':', {
        orders: taxData.totalOrders,
        revenue: taxData.totalIncTaxRevenue,
        tax: taxData.totalTaxCollected
      });
      
      // Format as a report array for consistency
      const report = {
        id: Date.now(),
        reportType: 'daily',
        reportDate: reportDate.toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        }),
        year: reportDate.getFullYear(),
        month: reportDate.getMonth() + 1,
        day: reportDate.getDate(),
        totalOrders: taxData.totalOrders,
        totalTaxCollected: taxData.totalTaxCollected.toString(),
        totalPreTaxRevenue: taxData.totalPreTaxRevenue.toString(),
        totalIncTaxRevenue: taxData.totalIncTaxRevenue.toString(),
        averageTaxPerOrder: taxData.averageTaxPerOrder,
        averageOrderValue: taxData.averageOrderValue,
        taxBreakdown: taxData.taxBreakdown,
        orderDetails: taxData.orderDetails || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      res.json([report]);
    } catch (error) {
      console.error('Error generating daily tax report:', error);
      res.status(500).json({ message: 'Failed to generate daily tax report' });
    }
  });

  app.get('/api/admin/tax-reports/monthly', isAdmin, async (req, res) => {
    try {
      const { year, month } = req.query;
      const reportYear = year ? parseInt(year as string) : new Date().getFullYear();
      const reportMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
      
      // Import the new tax calculator
      const { calculateMonthlyTax } = await import('./tax-calculator');
      
      // Calculate tax data directly for the specific month
      const taxData = await calculateMonthlyTax(reportYear, reportMonth);
      
      // Format as a report array for consistency
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const report = {
        id: Date.now(),
        reportType: 'monthly',
        reportDate: `${monthNames[reportMonth - 1]} ${reportYear}`,
        year: reportYear,
        month: reportMonth,
        day: null,
        totalOrders: taxData.totalOrders,
        totalTaxCollected: taxData.totalTaxCollected.toString(),
        totalPreTaxRevenue: taxData.totalPreTaxRevenue.toString(),
        totalIncTaxRevenue: taxData.totalIncTaxRevenue.toString(),
        averageTaxPerOrder: taxData.averageTaxPerOrder,
        averageOrderValue: taxData.averageOrderValue,
        taxBreakdown: taxData.taxBreakdown,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      res.json([report]);
    } catch (error) {
      console.error('Error generating monthly tax report:', error);
      res.status(500).json({ message: 'Failed to generate monthly tax report' });
    }
  });

  app.get('/api/admin/tax-reports/yearly', isAdmin, async (req, res) => {
    try {
      const { year } = req.query;
      const reportYear = year ? parseInt(year as string) : new Date().getFullYear();
      
      // Import the new tax calculator
      const { calculateYearlyTax } = await import('./tax-calculator');
      
      // Calculate tax data directly for the specific year
      const taxData = await calculateYearlyTax(reportYear);
      
      // Format as a report array for consistency
      const report = {
        id: Date.now(),
        reportType: 'yearly',
        reportDate: `Year ${reportYear}`,
        year: reportYear,
        month: null,
        day: null,
        totalOrders: taxData.totalOrders,
        totalTaxCollected: taxData.totalTaxCollected.toString(),
        totalPreTaxRevenue: taxData.totalPreTaxRevenue.toString(),
        totalIncTaxRevenue: taxData.totalIncTaxRevenue.toString(),
        averageTaxPerOrder: taxData.averageTaxPerOrder,
        averageOrderValue: taxData.averageOrderValue,
        taxBreakdown: taxData.taxBreakdown,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      res.json([report]);
    } catch (error) {
      console.error('Error generating yearly tax report:', error);
      res.status(500).json({ message: 'Failed to generate yearly tax report' });
    }
  });

  app.get('/api/admin/tax-reports/range', isAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required' });
      }
      
      const reports = await taxService.getTaxReportsByDateRange(startDate as string, endDate as string);
      res.json(reports);
    } catch (error) {
      console.error('Error fetching tax reports:', error);
      res.status(500).json({ message: 'Failed to fetch tax reports' });
    }
  });

  // Generate current period tax reports (for cron jobs)
  app.post('/api/admin/tax-reports/generate-current', isAdmin, async (req, res) => {
    try {
      await taxService.generateCurrentPeriodReports();
      res.json({ message: 'Current period tax reports generated successfully' });
    } catch (error) {
      console.error('Error generating current period reports:', error);
      res.status(500).json({ message: 'Failed to generate current period reports' });
    }
  });

  // System settings routes
  app.get('/api/system-settings/service-fee', async (req, res) => {
    try {
      const serviceFee = await storage.getServiceFee();
      res.json({ serviceFee });
    } catch (error) {
      console.error('Error fetching service fee:', error);
      res.status(500).json({ message: 'Failed to fetch service fee' });
    }
  });

  app.patch('/api/admin/system-settings/service-fee', isAdmin, async (req, res) => {
    try {
      const { fee, serviceFee } = req.body;
      const feeValue = fee || serviceFee; // Accept both parameter names
      
      if (isNaN(parseFloat(feeValue))) {
        return res.status(400).json({ message: 'Invalid service fee value' });
      }
      
      await storage.updateSystemSetting('service_fee', feeValue.toString());
      res.json({ serviceFee: parseFloat(feeValue) });
    } catch (error) {
      console.error('Error updating service fee:', error);
      res.status(500).json({ message: 'Failed to update service fee' });
    }
  });
  
  app.get('/api/system-settings/tax-rate', async (req, res) => {
    try {
      const taxRate = await storage.getSystemSetting('tax_rate') || '8';
      res.json({ taxRate: parseFloat(taxRate) });
    } catch (error) {
      console.error('Error fetching tax rate:', error);
      res.status(500).json({ message: 'Failed to fetch tax rate' });
    }
  });
  
  app.patch('/api/admin/system-settings/tax-rate', isAdmin, async (req, res) => {
    try {
      const { rate, taxRate } = req.body;
      const rateValue = rate || taxRate; // Accept both parameter names
      
      if (isNaN(parseFloat(rateValue)) || parseFloat(rateValue) < 0 || parseFloat(rateValue) > 100) {
        return res.status(400).json({ message: 'Invalid tax rate value' });
      }
      
      await storage.updateSystemSetting('tax_rate', rateValue.toString());
      res.json({ taxRate: parseFloat(rateValue) });
    } catch (error) {
      console.error('Error updating tax rate:', error);
      res.status(500).json({ message: 'Failed to update tax rate' });
    }
  });

  // Store open/close endpoints
  app.get('/api/system-settings/store-open', async (req, res) => {
    try {
      const storeOpenSetting = await storage.getSystemSetting('store_open') || 'true';
      res.json({ storeOpen: storeOpenSetting === 'true' });
    } catch (error) {
      console.error('Error fetching store open status:', error);
      res.status(500).json({ message: 'Failed to fetch store status' });
    }
  });

  app.put('/api/system-settings/store-open', isAdmin, async (req, res) => {
    try {
      const { value } = req.body;
      
      if (typeof value !== 'boolean') {
        return res.status(400).json({ message: 'Store open value must be a boolean' });
      }
      
      await storage.updateSystemSetting('store_open', value.toString());
      res.json({ storeOpen: value });
    } catch (error) {
      console.error('Error updating store open status:', error);
      res.status(500).json({ message: 'Failed to update store status' });
    }
  });

  // Admin endpoints for real-time stats and reporting


  app.get('/api/admin/daily-reports', isAdmin, async (req, res) => {
    try {
      const reports = await storage.getDailyReports(30);
      res.json(reports);
    } catch (error) {
      console.error('Error fetching daily reports:', error);
      res.status(500).json({ message: 'Failed to fetch daily reports' });
    }
  });

  app.get('/api/admin/monthly-reports', isAdmin, async (req, res) => {
    try {
      const reports = await storage.getMonthlyReports(12);
      res.json(reports);
    } catch (error) {
      console.error('Error fetching monthly reports:', error);
      res.status(500).json({ message: 'Failed to fetch monthly reports' });
    }
  });

  // Daily reset scheduler for Cork/Dublin timezone
  let dailyResetTimer: NodeJS.Timeout | null = null;
  
  const scheduleDailyReset = () => {
    // Clear any existing timer to prevent loops
    if (dailyResetTimer) {
      clearTimeout(dailyResetTimer);
    }
    
    const now = new Date();
    const dublinTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Dublin',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(now);

    const [hours, minutes, seconds] = dublinTime.split(':').map(Number);
    
    // Calculate milliseconds until next midnight in Dublin timezone
    let msUntilMidnight = (24 * 60 * 60 * 1000) - (hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000);
    
    // If we're already past midnight, schedule for next day
    if (msUntilMidnight <= 0) {
      msUntilMidnight += (24 * 60 * 60 * 1000);
    }
    
    const minutesUntilMidnight = Math.round(msUntilMidnight / 1000 / 60);
    console.log(`Scheduling daily reset in ${minutesUntilMidnight} minutes (Dublin time)`);
    
    dailyResetTimer = setTimeout(async () => {
      try {
        console.log('Performing daily reset at midnight Dublin time...');
        
        // Archive current day stats
        const stats = await storage.getCurrentDayStats();
        const today = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Europe/Dublin'
        }).format(new Date());
        
        await storage.createOrUpdateDailyReport(today, stats.totalOrders, stats.totalRevenue);
        
        // Update monthly reports
        const dublinDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Dublin' });
        const [year, month] = dublinDate.split('-').map(Number);
        
        const monthlyStats = await storage.getDailyReports(31);
        const currentMonthStats = monthlyStats.filter(report => {
          const reportDate = new Date(report.date);
          return reportDate.getFullYear() === year && reportDate.getMonth() + 1 === month;
        });
        
        const monthlyOrders = currentMonthStats.reduce((sum, report) => sum + report.totalOrders, 0);
        const monthlyRevenue = currentMonthStats.reduce((sum, report) => sum + parseFloat(report.totalRevenue.toString()), 0);
        
        await storage.createOrUpdateMonthlyReport(year, month, monthlyOrders, monthlyRevenue);
        
        // Clean up old data
        await storage.cleanupOldData();
        
        console.log('Daily reset completed successfully');
        
        // Broadcast reset notification to connected admin clients
        broadcastToAdmins({
          type: 'daily_reset',
          message: 'Daily stats have been reset',
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Error during daily reset:', error);
      }
      
      // Schedule next reset (only once per day)
      scheduleDailyReset();
    }, msUntilMidnight);
  };

  // Start the daily reset scheduler only once
  scheduleDailyReset();

  // Special offers routes
  app.get('/api/special-offer', async (req, res) => {
    try {
      const specialOffer = await storage.getActiveSpecialOffer();
      res.json(specialOffer);
    } catch (error) {
      console.error('Error fetching special offer:', error);
      res.status(500).json({ message: 'Failed to fetch special offer' });
    }
  });

  app.get('/api/admin/special-offer-stats', isAdmin, async (req, res) => {
    try {
      const specialOffer = await storage.getActiveSpecialOffer();
      if (!specialOffer) {
        return res.json({ ordersToday: 0, revenueToday: 0, totalSavings: 0 });
      }

      // Get ALL orders (not just today's) to calculate statistics since special activation
      const allOrders = await storage.getOrders();
      
      // Filter orders placed AFTER the special offer started
      const specialStartTime = new Date(specialOffer.startDate || new Date()).getTime();
      const relevantOrders = allOrders.filter(order => {
        const orderTime = new Date(order.createdAt).getTime();
        const hasSpecialItem = order.items && Array.isArray(order.items) && 
                              (order.items as any[]).some((item: any) => item.menuItemId === specialOffer.menuItemId);
        return orderTime >= specialStartTime && hasSpecialItem;
      });

      let ordersToday = 0;
      let revenueToday = 0;
      let totalSavings = 0;

      relevantOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          const specialItems = (order.items as any[]).filter((item: any) => item.menuItemId === specialOffer.menuItemId);
          specialItems.forEach((item: any) => {
            const quantity = item.quantity || 0;
            const price = item.price || 0;
            const discountAmount = (specialOffer as any).discountValue || (specialOffer as any).discountAmount || 0;
            
            ordersToday += quantity;
            revenueToday += price * quantity;
            totalSavings += discountAmount * quantity;
          });
        }
      });

      res.json({ ordersToday, revenueToday, totalSavings });
    } catch (error) {
      console.error('Error fetching special offer stats:', error);
      res.status(500).json({ message: 'Failed to fetch special offer statistics' });
    }
  });

  app.post('/api/admin/special-offers', isAdmin, async (req, res) => {
    try {
      const specialOffer = await storage.createSpecialOffer(req.body);
      
      // Broadcast special offer update to all connected clients
      broadcastToAdmins({
        type: 'SPECIAL_OFFER_UPDATE',
        specialOffer: await storage.getActiveSpecialOffer(),
        timestamp: new Date().toISOString()
      });
      
      res.status(201).json(specialOffer);
    } catch (error) {
      console.error('Error creating special offer:', error);
      res.status(500).json({ message: 'Failed to create special offer' });
    }
  });

  app.post('/api/admin/special-offers/deactivate-all', isAdmin, async (req, res) => {
    try {
      await storage.deactivateAllSpecialOffers();
      
      // Broadcast deactivation to all connected clients
      broadcastToAdmins({
        type: 'SPECIAL_OFFER_DEACTIVATED',
        timestamp: new Date().toISOString()
      });
      
      res.json({ message: 'All special offers deactivated successfully' });
    } catch (error) {
      console.error('Error deactivating special offers:', error);
      res.status(500).json({ message: 'Failed to deactivate special offers' });
    }
  });

  // Setup WebSocket server for real-time admin updates
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });

  // Add error handling for WebSocket server
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
    // Don't crash the entire server if WebSocket fails
  });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'SUBSCRIBE_ADMIN') {
          adminSocketConnections.add(ws);
          console.log('Client subscribed to admin updates');
        } else if (data.type === 'SUBSCRIBE_ORDER_UPDATES' && data.orderId) {
          // Customer subscribing to order updates
          const orderId = data.orderId;
          
          if (!customerSocketConnections.has(orderId)) {
            customerSocketConnections.set(orderId, new Set());
          }
          
          customerSocketConnections.get(orderId)!.add(ws);
          console.log(`Customer subscribed to order ${orderId} updates`);
          
          // Send confirmation back to client
          ws.send(JSON.stringify({
            type: 'SUBSCRIPTION_CONFIRMED',
            orderId: orderId,
            message: `Successfully subscribed to order ${orderId} updates`
          }));
        } else if (data.type === 'SUBSCRIBE_USER_ORDERS' && data.userId) {
          // User subscribing to their order updates
          const userId = data.userId;
          
          if (!userSocketConnections.has(userId)) {
            userSocketConnections.set(userId, new Set());
          }
          
          userSocketConnections.get(userId)!.add(ws);
          console.log(`User ${userId} subscribed to order updates`);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      // Remove from admin connections
      adminSocketConnections.delete(ws);
      
      // Remove from customer connections
      customerSocketConnections.forEach((connections, orderId) => {
        connections.delete(ws);
        if (connections.size === 0) {
          customerSocketConnections.delete(orderId);
        }
      });
      
      // Remove from user connections
      userSocketConnections.forEach((connections, userId) => {
        connections.delete(ws);
        if (connections.size === 0) {
          userSocketConnections.delete(userId);
        }
      });
      
      console.log('WebSocket client disconnected');
    });
  });

  // User profile management endpoints
  app.post("/api/user/update-username", isAuthenticated, async (req, res) => {
    try {
      const { newUsername } = req.body;
      
      if (!newUsername || typeof newUsername !== 'string' || newUsername.trim().length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters long" });
      }

      const result = await storage.updateUsername(req.user!.id, newUsername.trim());
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      // Update the session with the new user data
      req.user = result.user!;
      
      res.json({ 
        message: "Username updated successfully", 
        user: result.user 
      });
    } catch (error) {
      console.error("Error updating username:", error);
      res.status(500).json({ message: "Failed to update username" });
    }
  });

  return httpServer;
}
