import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertOrderSchema, insertMenuItemSchema, insertMenuCategorySchema, insertSpecialOfferSchema } from "@shared/schema";
import { setupAuth } from "./auth";
import { 
  generatePasswordResetToken, 
  validatePasswordResetToken, 
  clearPasswordResetToken,
  sendPasswordResetEmail 
} from "./email";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication and get middleware
  const { isAuthenticated, isAdmin } = setupAuth(app);
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

  // API Route for creating an order
  app.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      // Validate request body
      const orderData = insertOrderSchema.parse(req.body);
      
      // Create the order
      const order = await storage.createOrder(orderData);
      
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

  // API Route for getting an order by ID
  app.get("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // API Route for updating order status
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
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

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
      const offerData = insertSpecialOfferSchema.parse(req.body);
      const offer = await storage.createSpecialOffer(offerData);
      res.status(201).json(offer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid special offer data", errors: error.errors });
      } else {
        console.error("Error creating special offer:", error);
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
      
      if (user) {
        // Generate token
        const token = generatePasswordResetToken(email);
        
        // Create reset URL
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${token}`;
        
        // Send email
        await sendPasswordResetEmail(email, resetUrl);
      }
      
      // Always return success to prevent user enumeration
      res.json({ 
        message: "If an account with this email exists, a password reset link has been sent."
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
      
      // Validate token
      const email = validatePasswordResetToken(token);
      
      if (!email) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      // Token is valid
      res.json({ 
        message: "Token is valid",
        email
      });
      
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
      
      // Validate token and get email
      const email = validatePasswordResetToken(token);
      
      if (!email) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update password
      const updated = await storage.updateUserPassword(user.id, password);
      
      if (!updated) {
        return res.status(500).json({ message: "Failed to update password" });
      }
      
      // Clear token so it can't be used again
      clearPasswordResetToken(token);
      
      res.json({ 
        message: "Password has been successfully reset"
      });
      
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
