import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  MenuCategory, 
  MenuItem, 
  Order, 
  InsertMenuItem, 
  InsertMenuCategory, 
  InsertSpecialOffer, 
  PromoCode, 
  InsertPromoCode,
  MenuItemOptionGroup,
  MenuItemOption,
  InsertMenuItemOptionGroup,
  InsertMenuItemOption
} from "@shared/schema";
import { CreditCard, Menu, ArrowRightLeft, Settings, BarChart3, Users, LogOut, ShoppingBag, Plus, Edit, Trash, AlertTriangle, Tag, ChevronRight, Store, FileText } from "lucide-react";
import { PromoCodeForm } from "./AdminForms";
import MenuItemForm from "@/components/admin/MenuItemForm";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import OrderManager from "./OrderManager";
import TodayOrderManager from "@/components/admin/TodayOrderManager";
import LiveStatsDisplay from "@/components/admin/LiveStatsDisplay";
import ReportsSection from "@/components/admin/ReportsSection";
import AdminTimeDisplay from "@/components/admin/AdminTimeDisplay";
import TodaysSpecialManager from "./components/TodaysSpecialManager";
import CategoryOrderManager from "@/components/CategoryOrderManager";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/hooks/use-auth";
import { TaxRateFields } from "@/components/admin/TaxRateFields";
import { AddMenuItemForm } from "@/components/admin/AddMenuItemForm";
import TaxReportsManager from "@/components/admin/TaxReportsManager";

/**
 * Helper function to determine if a promo code is currently active based on:
 * - Manual active flag
 * - Expiry date (has passed)
 * - Usage limit (reached)
 */
function isPromoCodeActive(promo: PromoCode): boolean {
  // If manually set to inactive, it's inactive
  if (!promo.active) {
    return false;
  }

  // Check if expired
  if (promo.endDate) {
    const now = new Date();
    const endDate = new Date(promo.endDate);
    endDate.setHours(23, 59, 59, 999);
    if (endDate < now) {
      return false; // Expired
    }
  }

  // Check if usage limit reached
  if (promo.usageLimit && promo.currentUsage >= promo.usageLimit) {
    return false; // Usage limit exceeded
  }

  return true; // All checks passed, code is active
}

/**
 * Helper function to get the reason why a promo code is inactive
 */
function getPromoCodeInactiveReason(promo: PromoCode): string {
  if (!promo.active) {
    return "Manually disabled";
  }

  if (promo.endDate) {
    const now = new Date();
    const endDate = new Date(promo.endDate);
    endDate.setHours(23, 59, 59, 999);
    if (endDate < now) {
      return "Expired";
    }
  }

  if (promo.usageLimit && promo.currentUsage >= promo.usageLimit) {
    return "Usage limit reached";
  }

  return "Unknown";
}

// We'll wrap the admin component sections in conditional rendering
// to avoid errors when the component files are being loaded

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddMenuItemOpen, setIsAddMenuItemOpen] = useState(false);
  const [isEditMenuItemOpen, setIsEditMenuItemOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isUpdateSpecialOpen, setIsUpdateSpecialOpen] = useState(false);

  const [isPromoCodeOpen, setIsPromoCodeOpen] = useState(false);
  const [isManageOptionsOpen, setIsManageOptionsOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [selectedPromoCode, setSelectedPromoCode] = useState<PromoCode | null>(null);
  const { toast } = useToast();
  const { logoutMutation } = useAuth();

  // WebSocket connection for real-time updates
  useWebSocket({
    onMessage: (data) => {
      console.log('Admin received WebSocket message:', data);
      if (data.type === 'NEW_ORDER') {
        // Invalidate promo codes cache when new orders are placed (may include promo code usage)
        queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
        
        toast({
          title: "New Order Received",
          description: `Order #${data.order.dailyOrderNumber || data.order.id} from ${data.order.customerName}`,
        });
      } else if (data.type === 'ORDER_UPDATE') {
        toast({
          title: "Order Updated",
          description: `Order #${data.orderId} status changed to ${data.status}`,
        });
      }
    },
    onConnect: () => {
      console.log('Admin WebSocket connected');
    },
    onDisconnect: () => {
      console.log('Admin WebSocket disconnected');
    }
  });
  
  // Fetch menu categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<MenuCategory[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch menu items 
  const { data: menuItems, isLoading: menuItemsLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
  });
  
  // Fetch orders
  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
  });

  // Fetch current special offer with real-time updates
  const { data: specialOffer, isLoading: specialOfferLoading } = useQuery<any>({
    queryKey: ["/api/special-offer"],
    refetchInterval: 10000, // Admin gets faster updates
  });
  


  const { data: storeOpen = true } = useQuery({
    queryKey: ['/api/system-settings/store-open'],
    queryFn: async () => {
      const response = await fetch('/api/system-settings/store-open');
      const data = await response.json();
      return data.storeOpen;
    },
  });

  const storeToggleMutation = useMutation({
    mutationFn: async (isOpen: boolean) => {
      return apiRequest('PUT', '/api/system-settings/store-open', { value: isOpen });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-settings/store-open'] });
      toast({
        title: "Store status updated",
        description: `Store is now ${storeOpen ? 'closed' : 'open'}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update store status",
        variant: "destructive",
      });
    },
  });
  
  // Fetch promo codes with real-time updates
  const { data: promoCodes, isLoading: promoCodesLoading } = useQuery<PromoCode[]>({
    queryKey: ["/api/admin/promo-codes"],
    refetchInterval: 10000, // Refresh every 10 seconds to catch usage updates
  });

  // Mutations for menu management
  const createMenuItemMutation = useMutation({
    mutationFn: async (data: InsertMenuItem) => {
      const response = await apiRequest("POST", "/api/admin/menu-items", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
      setIsAddMenuItemOpen(false);
      toast({
        title: "Menu item created",
        description: "The menu item has been added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create menu item",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateMenuItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<InsertMenuItem> }) => {
      const response = await apiRequest("PATCH", `/api/admin/menu-items/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      // Aggressive cache invalidation to ensure customer menu updates immediately
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
      queryClient.refetchQueries({ queryKey: ["/api/menu-items"] });
      
      // Also invalidate special offers in case the updated item is part of a special
      queryClient.invalidateQueries({ queryKey: ["/api/special-offer"] });
      queryClient.refetchQueries({ queryKey: ["/api/special-offer"] });
      
      // Invalidate categories in case tax rates changed at category level
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      
      console.log("🔄 Menu item updated - forced cache refresh for customer views");
      
      setIsEditMenuItemOpen(false);
      setSelectedMenuItem(null);
      toast({
        title: "Menu item updated",
        description: "The menu item has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update menu item",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteMenuItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/menu-items/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
      toast({
        title: "Menu item deleted",
        description: "The menu item has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete menu item",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: InsertMenuCategory) => {
      const response = await apiRequest("POST", "/api/admin/categories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsAddCategoryOpen(false);
      toast({
        title: "Category created",
        description: "The category has been added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create category",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateMenuCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<InsertMenuCategory> }) => {
      const response = await apiRequest("PATCH", `/api/admin/categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsEditCategoryOpen(false);
      setSelectedCategory(null);
      toast({
        title: "Menu category updated",
        description: "The category has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update category",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/categories/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
      toast({
        title: "Category deleted",
        description: "The category and all its items have been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete category",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateSpecialOfferMutation = useMutation({
    mutationFn: async (data: InsertSpecialOffer) => {
      // First deactivate all existing specials
      await apiRequest("POST", "/api/admin/special-offers/deactivate-all");
      // Then create the new special
      const response = await apiRequest("POST", "/api/admin/special-offers", data);
      return response.json();
    },
    onSuccess: (newOffer) => {
      console.log("🎉 Frontend: Special offer update successful:", newOffer);
      
      // Force immediate refetch of special offer data
      queryClient.invalidateQueries({ queryKey: ["/api/special-offer"] });
      queryClient.refetchQueries({ queryKey: ["/api/special-offer"] });
      
      // Also invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/special-offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
      
      console.log("🔄 Frontend: Forced cache invalidation and refetch");
      
      setIsUpdateSpecialOpen(false);
      toast({
        title: "Special offer updated",
        description: "Today's special has been updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating special offer:", error);
      toast({
        title: "Failed to update special offer",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/orders/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Order status updated",
        description: "The order status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update order status",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  

  
  // Promo code mutations
  const createPromoCodeMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("🎯 Frontend: Creating promo code with data:", data);
      const response = await apiRequest("POST", "/api/admin/promo-codes", data);
      return response.json();
    },
    onSuccess: (newPromoCode) => {
      console.log("✅ Frontend: Promo code created successfully:", newPromoCode);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      setIsPromoCodeOpen(false);
      setSelectedPromoCode(null);
      toast({
        title: "Promo code created",
        description: "The promo code has been added successfully",
      });
    },
    onError: (error) => {
      console.error("❌ Frontend: Promo code creation failed:", error);
      toast({
        title: "Failed to create promo code",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const updatePromoCodeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      console.log("🎯 Frontend: Updating promo code ID:", id, "with data:", data);
      const response = await apiRequest("PATCH", `/api/admin/promo-codes/${id}`, data);
      return response.json();
    },
    onSuccess: (updatedPromoCode) => {
      console.log("✅ Frontend: Promo code updated successfully:", updatedPromoCode);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      setIsPromoCodeOpen(false);
      setSelectedPromoCode(null);
      toast({
        title: "Promo code updated",
        description: "The promo code has been updated successfully",
      });
    },
    onError: (error) => {
      console.error("❌ Frontend: Promo code update failed:", error);
      toast({
        title: "Failed to update promo code",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const deletePromoCodeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/promo-codes/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      toast({
        title: "Promo code deleted",
        description: "The promo code has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete promo code",
        description: error.message,
        variant: "destructive",
      });
    }
  });



  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/");
      }
    });
  };

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border p-6 flex flex-col hidden md:flex">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
            A
          </div>
          <h1 className="font-heading text-xl text-primary">THE MEX ADMIN</h1>
        </div>
        
        <nav className="space-y-1 flex-1">
          <Button 
            variant={activeTab === "overview" ? "secondary" : "ghost"}
            className="w-full justify-start" 
            onClick={() => setActiveTab("overview")}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </Button>
          <Button 
            variant={activeTab === "orders" ? "secondary" : "ghost"}
            className="w-full justify-start" 
            onClick={() => setActiveTab("orders")}
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            Orders
          </Button>
          <Button 
            variant={activeTab === "menu" ? "secondary" : "ghost"}
            className="w-full justify-start" 
            onClick={() => setActiveTab("menu")}
          >
            <Menu className="mr-2 h-4 w-4" />
            Menu Management
          </Button>
          <Button 
            variant={activeTab === "specials" ? "secondary" : "ghost"}
            className="w-full justify-start" 
            onClick={() => setActiveTab("specials")}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Today's Special
          </Button>
          <Button 
            variant={activeTab === "promo-codes" ? "secondary" : "ghost"}
            className="w-full justify-start" 
            onClick={() => setActiveTab("promo-codes")}
          >
            <Tag className="mr-2 h-4 w-4" />
            Promo Codes
          </Button>

          <Button 
            variant={activeTab === "tax-reports" ? "secondary" : "ghost"}
            className="w-full justify-start" 
            onClick={() => setActiveTab("tax-reports")}
          >
            <FileText className="mr-2 h-4 w-4" />
            Tax Reports
          </Button>
          
          <Separator className="my-4" />
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground" 
            onClick={() => navigate("/")}
          >
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            View Site
          </Button>
        </nav>
        
        <div className="mt-auto pt-4 border-t border-border">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 mr-3 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Admin User</h3>
              <p className="text-xs text-muted-foreground">admin@themex.com</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        </div>
      </aside>
      
      {/* Mobile Navbar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2 flex justify-between z-40">
        <Button 
          variant={activeTab === "overview" ? "secondary" : "ghost"}
          className="flex-1" 
          size="sm"
          onClick={() => setActiveTab("overview")}
        >
          <BarChart3 className="h-5 w-5" />
        </Button>
        <Button 
          variant={activeTab === "orders" ? "secondary" : "ghost"}
          className="flex-1" 
          size="sm"
          onClick={() => setActiveTab("orders")}
        >
          <ShoppingBag className="h-5 w-5" />
        </Button>
        <Button 
          variant={activeTab === "menu" ? "secondary" : "ghost"}
          className="flex-1" 
          size="sm"
          onClick={() => setActiveTab("menu")}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Button 
          variant={activeTab === "specials" ? "secondary" : "ghost"}
          className="flex-1" 
          size="sm"
          onClick={() => setActiveTab("specials")}
        >
          <CreditCard className="h-5 w-5" />
        </Button>
        <Button 
          variant={activeTab === "promo-codes" ? "secondary" : "ghost"}
          className="flex-1" 
          size="sm"
          onClick={() => setActiveTab("promo-codes")}
        >
          <Tag className="h-5 w-5" />
        </Button>

      </div>
      
      {/* Main Content */}
      <main className="flex-1 p-6 pb-20 md:pb-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-heading text-foreground">
                {activeTab === "overview" && "Dashboard Overview"}
                {activeTab === "orders" && "Order Management"}
                {activeTab === "menu" && "Menu Management"}
                {activeTab === "specials" && "Today's Special"}
                {activeTab === "promo-codes" && "Promo Code Management"}

              </h1>
              <p className="text-muted-foreground">
                {activeTab === "overview" && "Monitor your restaurant's performance and manage daily operations."}
                {activeTab === "orders" && "View, update and manage all customer orders."}
                {activeTab === "menu" && "Manage category order, add/edit categories and menu items."}
                {activeTab === "specials" && "Set and manage today's special offers and promotions."}
                {activeTab === "promo-codes" && "Create and manage promotional codes for discounts."}

              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <AdminTimeDisplay />
              {activeTab === "overview" && (
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => navigate("/admin/reports")}
                >
                  View Reports
                </Button>
              )}
              {activeTab === "orders" && (
                <Button className="bg-primary hover:bg-primary/90">
                  New Order
                </Button>
              )}
              {activeTab === "menu" && (
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setIsAddCategoryOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Category
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90" onClick={() => setIsAddMenuItemOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              )}

              {activeTab === "promo-codes" && (
                <Button className="bg-primary hover:bg-primary/90" onClick={() => setIsPromoCodeOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Promo Code
                </Button>
              )}

            </div>
          </div>
          
          {/* Dashboard Content */}
          <div>
            {activeTab === "overview" && (
              <div className="space-y-6">
                <LiveStatsDisplay />
                
                {/* Store Open/Close Toggle */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      Store Status
                    </CardTitle>
                    <CardDescription>
                      Control whether the store accepts new orders
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          Store is currently {storeOpen ? 'OPEN' : 'CLOSED'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {storeOpen ? 'Accepting new orders' : 'Not accepting new orders'}
                        </p>
                      </div>
                      <Switch
                        checked={storeOpen}
                        onCheckedChange={(checked) => storeToggleMutation.mutate(checked)}
                        disabled={storeToggleMutation.isPending}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Today's Orders</CardTitle>
                      <CardDescription>
                        Orders placed today (Cork/Dublin timezone)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {ordersLoading ? (
                        <div className="flex items-center justify-center h-48">
                          <p>Loading orders...</p>
                        </div>
                      ) : (() => {
                          // Filter orders for today only (Cork/Dublin timezone)
                          const today = new Date();
                          const dublinToday = new Intl.DateTimeFormat('en-CA', {
                            timeZone: 'Europe/Dublin'
                          }).format(today);
                          
                          const todaysOrders = orders?.filter(order => {
                            const orderDate = new Intl.DateTimeFormat('en-CA', {
                              timeZone: 'Europe/Dublin'
                            }).format(new Date(order.createdAt));
                            return orderDate === dublinToday;
                          }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

                          return !todaysOrders || todaysOrders.length === 0 ? (
                            <div className="flex items-center justify-center h-48 border rounded-md">
                              <p className="text-muted-foreground">No orders placed today</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {todaysOrders.slice(0, 5).map((order) => (
                                <div key={order.id} className="flex items-center justify-between border-b pb-3">
                                  <div>
                                    <p className="font-medium">Order #{order.dailyOrderNumber || order.id}</p>
                                    <p className="text-sm text-muted-foreground">{order.customerName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(order.createdAt).toLocaleTimeString('en-IE', { 
                                        timeZone: 'Europe/Dublin',
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">€{order.total.toFixed(2)}</p>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      order.status === 'completed' 
                                        ? 'bg-green-500/10 text-green-500' 
                                        : order.status === 'processing' 
                                          ? 'bg-blue-500/10 text-blue-500'
                                          : 'bg-orange-500/10 text-orange-500'
                                    }`}>
                                      {order.status.toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()
                      }
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Today's Special</CardTitle>
                      <CardDescription>Managed in the Today's Special tab</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {specialOffer?.menuItem ? (
                        <div className="space-y-3">
                          <div className="bg-primary text-white text-xs px-2 py-1 rounded-md w-fit mb-2">
                            SPECIAL OFFER
                          </div>
                          {specialOffer.menuItem.image && (
                            <div className="aspect-video bg-muted rounded-md overflow-hidden">
                              <img 
                                src={specialOffer.menuItem.image} 
                                alt={specialOffer.menuItem.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  const container = target.parentElement;
                                  if (container) {
                                    container.style.display = 'none';
                                  }
                                }}
                              />
                            </div>
                          )}
                          <h3 className="font-medium">{specialOffer.menuItem.name}</h3>
                          <div className="flex justify-between items-center">
                            <p className="text-lg font-bold text-primary">
                              €{(specialOffer.specialPrice || (specialOffer.menuItem.price - (specialOffer.discountValue || specialOffer.discountAmount || 0))).toFixed(2)}
                            </p>
                            <p className="text-sm line-through text-muted-foreground">
                              €{specialOffer.menuItem.price.toFixed(2)}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Active until {specialOffer.endDate ? new Date(specialOffer.endDate).toLocaleDateString('en-IE', { timeZone: 'Europe/Dublin' }) : 'End of day'}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No special offer active</p>
                          <p className="text-sm text-muted-foreground mt-1">Set one up in the Today's Special tab</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            
            {activeTab === "orders" && (
              <div className="p-6 bg-card rounded-lg">
                <OrderManager />
              </div>
            )}
            
            {activeTab === "menu" && (
              <div className="space-y-6">
                <CategoryOrderManager />
                
                <Card>
                  <CardHeader>
                    <CardTitle>Menu Management</CardTitle>
                    <CardDescription>Manage categories and menu items in one place</CardDescription>
                  </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categories?.map((category) => {
                      const categoryItems = menuItems?.filter(item => item.categoryId === category.id) || [];
                      return (
                        <Collapsible key={category.id} className="border rounded-lg">
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between p-4 hover:bg-muted/50">
                              <div className="flex items-center gap-3">
                                <ChevronRight className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-90" />
                                <div className="text-left">
                                  <h3 className="font-semibold">{category.name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    /{category.slug} • {categoryItems.length} items
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCategory(category);
                                    setIsEditCategoryOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{category.name}"? This will also delete all {categoryItems.length} menu items in this category. This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteCategoryMutation.mutate(category.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete Category
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="border-t bg-muted/20">
                              <div className="p-4">
                                <div className="flex justify-between items-center mb-4">
                                  <h4 className="font-medium">Menu Items in {category.name}</h4>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedCategory(category);
                                      setSelectedMenuItem(null);
                                      setIsAddMenuItemOpen(true);
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Item
                                  </Button>
                                </div>
                                
                                {categoryItems.length === 0 ? (
                                  <div className="text-center py-8 border rounded-lg bg-background">
                                    <p className="text-muted-foreground">No items in this category</p>
                                  </div>
                                ) : (
                                  <div className="grid gap-3">
                                    {categoryItems.map((item) => (
                                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                                        <div className="flex items-center gap-3">
                                          <div className="w-12 h-12 rounded-md overflow-hidden bg-muted">
                                            {item.image ? (
                                              <img 
                                                src={item.image} 
                                                alt={item.name} 
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  const target = e.target as HTMLImageElement;
                                                  target.style.display = 'none';
                                                }}
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                                No Image
                                              </div>
                                            )}
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <p className="font-medium">{item.name}</p>
                                              {item.featured && (
                                                <span className="text-xs bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded">Featured</span>
                                              )}
                                              {item.hasOptions && (
                                                <span className="text-xs bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded">Customizable</span>
                                              )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">€{item.price.toFixed(2)}</p>
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => {
                                              setSelectedMenuItem(item);
                                              setIsManageOptionsOpen(true);
                                            }}
                                            title="Manage Options"
                                          >
                                            <Settings className="h-4 w-4" />
                                          </Button>
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => {
                                              setSelectedMenuItem(item);
                                              setIsEditMenuItemOpen(true);
                                            }}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button 
                                                variant="outline" 
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                              >
                                                <Trash className="h-4 w-4" />
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Are you sure you want to delete "{item.name}"? This action cannot be undone.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction 
                                                  onClick={() => deleteMenuItemMutation.mutate(item.id)}
                                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                  Delete
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                    
                    {!categories || categories.length === 0 && (
                      <div className="text-center py-8 border rounded-lg bg-muted/20">
                        <p className="text-muted-foreground">No categories found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                </Card>
              </div>
            )}
            
            {activeTab === "specials" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Special Offer</CardTitle>
                    <CardDescription>The currently highlighted special on your menu</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {specialOfferLoading ? (
                      <div className="flex items-center justify-center h-48">
                        <p className="text-muted-foreground">Loading special offer...</p>
                      </div>
                    ) : !specialOffer || !specialOffer.menuItem ? (
                      <div className="text-center py-12 border rounded-md bg-muted/20">
                        <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium mb-2">No Special Offer Active</h3>
                        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                          Create a special offer to highlight featured items with discounts.
                        </p>
                        <Button onClick={() => setIsUpdateSpecialOpen(true)}>
                          Create Special Offer
                        </Button>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="col-span-1">
                          <div className="bg-primary text-white text-sm font-bold px-3 py-1 rounded-lg w-fit mb-3">
                            SPECIAL OFFER
                          </div>
                          {specialOffer.menuItem.image && (
                            <div className="aspect-square rounded-xl border overflow-hidden bg-muted">
                              <img 
                                src={specialOffer.menuItem.image} 
                                alt={specialOffer.menuItem.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  const container = target.parentElement;
                                  if (container) {
                                    container.style.display = 'none';
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="md:col-span-2 flex flex-col">
                          <h3 className="text-2xl font-heading mb-2">{specialOffer.menuItem.name}</h3>
                          <p className="text-muted-foreground mb-4">{specialOffer.menuItem.description}</p>
                          
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="space-y-1">
                              <h4 className="text-sm font-medium text-muted-foreground">Special Price</h4>
                              <p className="text-2xl font-bold text-primary">
                                €{(() => {
                                  if (specialOffer.discountType === 'percentage') {
                                    const discountAmount = (specialOffer.discountValue / 100) * specialOffer.menuItem.price;
                                    return (specialOffer.menuItem.price - discountAmount).toFixed(2);
                                  } else {
                                    return Math.max(specialOffer.menuItem.price - specialOffer.discountValue, 0).toFixed(2);
                                  }
                                })()}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-sm font-medium text-muted-foreground">Original Price</h4>
                              <p className="text-xl line-through text-muted-foreground">€{specialOffer.menuItem.price.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md mb-4">
                            <p><strong>Discount:</strong> {
                              specialOffer.discountType === 'percentage' 
                                ? `${specialOffer.discountValue}% off` 
                                : `€${specialOffer.discountValue.toFixed(2)} off`
                            } ({
                              specialOffer.discountType === 'percentage' 
                                ? specialOffer.discountValue
                                : ((specialOffer.discountValue / specialOffer.menuItem.price) * 100).toFixed(0)
                            }%)</p>
                            <p className="mt-1"><strong>Active until:</strong> {new Date(specialOffer.endDate).toLocaleDateString('en-IE', {
                              timeZone: 'Europe/Dublin',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</p>
                          </div>
                          
                          <div className="mt-auto">
                            <Button 
                              className="w-full" 
                              onClick={() => setIsUpdateSpecialOpen(true)}
                            >
                              Change Special
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                

              </div>
            )}
            
            {activeTab === "promo-codes" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Promo Code Management</CardTitle>
                    <CardDescription>Create and manage promotional discount codes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {promoCodesLoading ? (
                      <div className="flex items-center justify-center h-48">
                        <p className="text-muted-foreground">Loading promo codes...</p>
                      </div>
                    ) : !promoCodes || promoCodes.length === 0 ? (
                      <div className="text-center py-12 border rounded-md bg-muted/20">
                        <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium mb-2">No Promo Codes Available</h3>
                        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                          Create promotional codes to offer discounts to your customers.
                        </p>
                        <Button onClick={() => {
                          setSelectedPromoCode(null); // Clear any selected promo code
                          setIsPromoCodeOpen(true);
                        }}>
                          Create New Promo Code
                        </Button>
                      </div>
                    ) : (
                      <div className="border rounded-md overflow-x-auto">
                        <div className="min-w-full inline-block align-middle">
                          <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                              <tr>
                                <th scope="col" className="py-3 px-3 text-left text-xs font-medium sm:px-4">Code</th>
                                <th scope="col" className="py-3 px-3 text-left text-xs font-medium sm:px-4">Discount</th>
                                <th scope="col" className="py-3 px-3 text-left text-xs font-medium sm:px-4">Min Order</th>
                                <th scope="col" className="py-3 px-3 text-left text-xs font-medium sm:px-4">Usage</th>
                                <th scope="col" className="py-3 px-3 text-left text-xs font-medium sm:px-4">Status</th>
                                <th scope="col" className="py-3 px-3 text-left text-xs font-medium sm:px-4">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-card">
                              {promoCodes.map((promo) => (
                                <tr key={promo.id}>
                                  <td className="whitespace-nowrap py-3 px-3 text-sm font-medium sm:px-4">{promo.code}</td>
                                  <td className="whitespace-nowrap py-3 px-3 text-sm sm:px-4">
                                    {promo.discountType === 'percentage' 
                                      ? `${promo.discountValue}%` 
                                      : `€${promo.discountValue.toFixed(2)}`
                                    }
                                  </td>
                                  <td className="whitespace-nowrap py-3 px-3 text-sm sm:px-4">€{promo.minOrderValue?.toFixed(2) || '0.00'}</td>
                                  <td className="whitespace-nowrap py-3 px-3 text-sm sm:px-4">
                                    {promo.currentUsage} / {promo.usageLimit === null ? '∞' : promo.usageLimit}
                                  </td>
                                  <td className="whitespace-nowrap py-3 px-3 text-sm sm:px-4">
                                    <span className={`inline-flex text-xs px-2 py-1 rounded-full ${
                                      isPromoCodeActive(promo)
                                        ? 'bg-green-500/10 text-green-500' 
                                        : 'bg-red-500/10 text-red-500'
                                    }`} title={!isPromoCodeActive(promo) ? getPromoCodeInactiveReason(promo) : 'Active'}>
                                      {isPromoCodeActive(promo) ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                  </td>
                                  <td className="whitespace-nowrap py-3 px-3 text-sm sm:px-4">
                                    <div className="flex gap-2">
                                      <Button 
                                        variant="outline" 
                                        size="icon"
                                        onClick={() => {
                                          setSelectedPromoCode(promo);
                                          setIsPromoCodeOpen(true);
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button 
                                            variant="outline" 
                                            size="icon"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                          >
                                            <Trash className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Promo Code</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to delete "{promo.code}"? This action cannot be undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction 
                                              onClick={() => deletePromoCodeMutation.mutate(promo.id)}
                                              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                            >
                                              Delete
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex justify-end mt-4 p-4 border-t">
                          <Button 
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => {
                              setSelectedPromoCode(null); // Clear any selected promo code
                              setIsPromoCodeOpen(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Promo Code
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeTab === "tax-reports" && (
              <TaxReportsManager />
            )}
            

          </div>
        </div>
        
        {/* Add Menu Item Dialog */}
        <Dialog open={isAddMenuItemOpen} onOpenChange={setIsAddMenuItemOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Menu Item</DialogTitle>
              <DialogDescription>
                Create a new menu item to add to your restaurant menu.
              </DialogDescription>
            </DialogHeader>
            <AddMenuItemForm
              categories={categories || []}
              onSubmit={(data) => createMenuItemMutation.mutate({
                ...data,
                categoryId: selectedCategory ? selectedCategory.id : data.categoryId
              })}
              isSubmitting={createMenuItemMutation.isPending}
              defaultCategoryId={selectedCategory?.id}
            />
          </DialogContent>
        </Dialog>
        
        {/* Edit Menu Item Dialog */}
        <Dialog open={isEditMenuItemOpen} onOpenChange={setIsEditMenuItemOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Menu Item</DialogTitle>
              <DialogDescription>
                Update the details of this menu item.
              </DialogDescription>
            </DialogHeader>
            {selectedMenuItem && (
              <AddMenuItemForm
                categories={categories || []}
                onSubmit={(data) => updateMenuItemMutation.mutate({ id: selectedMenuItem.id, data })}
                isSubmitting={updateMenuItemMutation.isPending}
                menuItem={selectedMenuItem}
              />
            )}
          </DialogContent>
        </Dialog>
        
        {/* Add Category Dialog */}
        <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new category for organizing your menu items.
              </DialogDescription>
            </DialogHeader>
            <AddCategoryForm 
              onSubmit={(data) => createCategoryMutation.mutate(data)}
              isSubmitting={createCategoryMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update the details of this menu category.
              </DialogDescription>
            </DialogHeader>
            {selectedCategory && (
              <EditCategoryForm
                category={selectedCategory}
                onSubmit={(data) => updateMenuCategoryMutation.mutate({ id: selectedCategory.id, data })}
                isSubmitting={updateMenuCategoryMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
        
        {/* Update Special Offer Dialog */}
        <Dialog open={isUpdateSpecialOpen} onOpenChange={setIsUpdateSpecialOpen}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Update Today's Special</DialogTitle>
              <DialogDescription>
                Select a menu item and set a discount for today's special offer.
              </DialogDescription>
            </DialogHeader>
            <UpdateSpecialForm
              menuItems={menuItems || []}
              onSubmit={(data) => updateSpecialOfferMutation.mutate(data)}
              isSubmitting={updateSpecialOfferMutation.isPending}
            />
          </DialogContent>
        </Dialog>
        
        {/* Create/Edit Promo Code Dialog */}
        <Dialog open={isPromoCodeOpen} onOpenChange={(open) => {
          setIsPromoCodeOpen(open);
          if (!open) {
            // Clear selected promo code when dialog closes
            setSelectedPromoCode(null);
          }
        }}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedPromoCode ? "Edit Promo Code" : "Create Promo Code"}</DialogTitle>
              <DialogDescription>
                {selectedPromoCode 
                  ? "Update an existing promotional code."
                  : "Create a new promotional code for customer discounts."
                }
              </DialogDescription>
            </DialogHeader>
            <PromoCodeForm 
              promoCode={selectedPromoCode || undefined}
              onSubmit={(data) => {
                if (selectedPromoCode) {
                  updatePromoCodeMutation.mutate({ id: selectedPromoCode.id, data });
                } else {
                  createPromoCodeMutation.mutate(data);
                }
              }}
              isSubmitting={createPromoCodeMutation.isPending || updatePromoCodeMutation.isPending}
            />
          </DialogContent>
        </Dialog>
        

        
        {/* Manage Menu Item Options Dialog */}
        <Dialog open={isManageOptionsOpen} onOpenChange={setIsManageOptionsOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Menu Item Options</DialogTitle>
              <DialogDescription>
                Configure customization options for {selectedMenuItem?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedMenuItem && (
              <MenuItemOptionsManager 
                menuItem={selectedMenuItem}
                onClose={() => setIsManageOptionsOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

// Form components for the admin dialogs
type AddCategoryFormProps = {
  onSubmit: (data: InsertMenuCategory) => void;
  isSubmitting: boolean;
};

function AddCategoryForm({ onSubmit, isSubmitting }: AddCategoryFormProps) {
  const categoryFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
    description: z.string().optional(),
    taxRate: z.coerce.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate cannot exceed 100%").optional(),
  });

  const form = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      taxRate: 0,
    },
  });

  function handleSubmit(values: z.infer<typeof categoryFormSchema>) {
    const submitData: InsertMenuCategory = {
      name: values.name,
      slug: values.slug,
      description: values.description || null,
      taxRate: values.taxRate !== undefined ? (values.taxRate / 100).toString() : undefined, // Convert percentage to decimal
    };
    onSubmit(submitData);
  }

  // Auto-generate slug from name
  const watchName = form.watch("name");
  React.useEffect(() => {
    if (watchName) {
      const slug = watchName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      form.setValue("slug", slug);
    }
  }, [watchName, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input placeholder="Main Dishes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="main-dishes" {...field} />
              </FormControl>
              <FormDescription>
                URL-friendly version of the name. Auto-generated from the name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="A brief description of this category that will be shown to customers..." {...field} />
              </FormControl>
              <FormDescription>
                Optional description that will be displayed when customers browse this category.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="taxRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax Rate (%)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="100"
                  placeholder="13.5" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Tax rate for all items in this category (%). Individual items can override this rate. Leave empty to use default system rate.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Category"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

type EditCategoryFormProps = {
  category: MenuCategory;
  onSubmit: (data: Partial<InsertMenuCategory>) => void;
  isSubmitting: boolean;
};

function EditCategoryForm({ category, onSubmit, isSubmitting }: EditCategoryFormProps) {
  const categoryFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
    description: z.string().optional(),
    taxRate: z.coerce.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate cannot exceed 100%").optional(),
  });

  const form = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      taxRate: category.taxRate ? parseFloat(category.taxRate) * 100 : 0, // Convert from decimal to percentage
    },
  });

  function handleSubmit(values: z.infer<typeof categoryFormSchema>) {
    const submitData: Partial<InsertMenuCategory> = {
      ...values,
      taxRate: values.taxRate !== undefined ? (values.taxRate / 100).toString() : undefined, // Convert percentage to decimal
    };
    onSubmit(submitData);
  }

  // Auto-generate slug from name only if the name is significantly different
  const watchName = form.watch("name");
  React.useEffect(() => {
    if (watchName && watchName !== category.name && watchName.trim() !== "") {
      const newSlug = watchName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      // Only update slug if it's different from current slug to avoid conflicts
      if (newSlug !== category.slug) {
        form.setValue("slug", newSlug);
      }
    }
  }, [watchName, form, category.name, category.slug]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input placeholder="Main Dishes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="main-dishes" {...field} />
              </FormControl>
              <FormDescription>
                URL-friendly version of the name. Auto-generated from the name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="A brief description of this category that will be shown to customers..." {...field} />
              </FormControl>
              <FormDescription>
                Optional description that will be displayed when customers browse this category.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="taxRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax Rate (%)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="100"
                  placeholder="13.5" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Tax rate for all items in this category (%). Individual items can override this rate. Leave empty to use default system rate.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Category"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

type UpdateSpecialFormProps = {
  menuItems: MenuItem[];
  onSubmit: (data: InsertSpecialOffer) => void;
  isSubmitting: boolean;
};

function UpdateSpecialForm({ menuItems, onSubmit, isSubmitting }: UpdateSpecialFormProps) {
  const specialFormSchema = z.object({
    menuItemId: z.coerce.number().positive("Please select a menu item"),
    discountType: z.string().default("percentage"),
    discountValue: z.coerce.number().min(1, "Min discount is 1%").max(100, "Max discount is 100%"),
    originalPrice: z.coerce.number().min(0, "Price cannot be negative"),
    specialPrice: z.coerce.number().min(0, "Price cannot be negative"),
    active: z.boolean().default(true),
    startDate: z.coerce.date().default(new Date()),
    endDate: z.coerce.date().nullable().optional(),
  });

  const form = useForm<z.infer<typeof specialFormSchema>>({
    resolver: zodResolver(specialFormSchema),
    defaultValues: {
      menuItemId: 0,
      discountType: "percentage",
      discountValue: 15,
      originalPrice: 0,
      specialPrice: 0,
      active: true,
      startDate: new Date(),
      endDate: null,
    },
  });

  function handleSubmit(values: z.infer<typeof specialFormSchema>) {
    const specialOfferData = {
      ...values,
      specialPrice: Number(values.specialPrice),
      originalPrice: Number(values.originalPrice),
      startDate: values.startDate instanceof Date ? values.startDate : new Date(values.startDate),
      endDate: values.endDate ? (values.endDate instanceof Date ? values.endDate : new Date(values.endDate)) : null
    };
    onSubmit(specialOfferData);
  }

  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const menuItemId = form.watch("menuItemId");
  const discountValue = form.watch("discountValue");
  const discountType = form.watch("discountType");

  useEffect(() => {
    if (menuItemId) {
      const item = menuItems.find(item => item.id === menuItemId);
      if (item) {
        setSelectedMenuItem(item);
        
        // Calculate special price based on discount
        if (item && discountValue) {
          let specialPrice = item.price;
          
          if (discountType === "percentage") {
            specialPrice = item.price * (1 - discountValue / 100);
          } else if (discountType === "amount") {
            specialPrice = Math.max(0, item.price - discountValue);
          }
          
          form.setValue("originalPrice", item.price);
          form.setValue("specialPrice", specialPrice);
        }
      }
    }
  }, [menuItemId, discountValue, discountType, menuItems, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="menuItemId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Menu Item</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value ? field.value.toString() : undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a menu item" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {menuItems.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {selectedMenuItem && (
          <div className="border rounded-md p-3 bg-muted/20">
            <div className="flex gap-3 items-center">
              <div className="w-16 h-16 rounded overflow-hidden bg-muted">
                {selectedMenuItem.image ? (
                  <img 
                    src={selectedMenuItem.image} 
                    alt={selectedMenuItem.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                    No Image
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-medium">{selectedMenuItem.name}</h4>
                <p className="text-sm text-muted-foreground">Regular price: ${selectedMenuItem.price.toFixed(2)}</p>
                {discountValue > 0 && (
                  <p className="text-sm text-primary-foreground">
                    Special price: ${form.watch("specialPrice").toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        <FormField
          control={form.control}
          name="discountType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discount Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="amount">Fixed Amount ($)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="discountValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {discountType === "percentage" ? "Discount (%)" : "Discount Amount ($)"}
              </FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input 
                    type="number" 
                    min="1" 
                    max={discountType === "percentage" ? "100" : undefined} 
                    {...field} 
                  />
                </FormControl>
                <span>{discountType === "percentage" ? "%" : "$"}</span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="originalPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Original Price ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} readOnly />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="specialPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Special Price ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} readOnly />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} 
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} 
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <Switch 
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>Active</FormLabel>
              <FormDescription className="text-xs ml-auto">Display this special offer on the website</FormDescription>
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Special"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}


// Menu Item Options Manager Component
type MenuItemOptionsManagerProps = {
  menuItem: MenuItem;
  onClose: () => void;
};

function MenuItemOptionsManager({ menuItem, onClose }: MenuItemOptionsManagerProps) {
  const [selectedOptionGroup, setSelectedOptionGroup] = useState<MenuItemOptionGroup | null>(null);
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [isAddOptionOpen, setIsAddOptionOpen] = useState(false);
  const [isEditOptionOpen, setIsEditOptionOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<MenuItemOption | null>(null);

  // Fetch option groups for this menu item
  const { data: optionGroups, isLoading, refetch } = useQuery({
    queryKey: ['/api/menu-items', menuItem.id, 'option-groups'],
    queryFn: () => fetch(`/api/menu-items/${menuItem.id}/option-groups`).then(res => res.json()) as Promise<(MenuItemOptionGroup & { options: MenuItemOption[] })[]>
  });

  // Mutations for option groups
  const createOptionGroupMutation = useMutation({
    mutationFn: (data: InsertMenuItemOptionGroup) => {
      console.log("Creating option group with data:", data);
      return fetch(`/api/admin/menu-items/${menuItem.id}/option-groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      }).then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      });
    },
    onSuccess: () => {
      refetch();
      setIsAddGroupOpen(false);
    },
    onError: (error) => {
      console.error("Failed to create option group:", error);
    }
  });

  const updateOptionGroupMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertMenuItemOptionGroup> }) =>
      fetch(`/api/admin/option-groups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: () => {
      refetch();
      setIsEditGroupOpen(false);
      setSelectedOptionGroup(null);
    }
  });

  const deleteOptionGroupMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/admin/option-groups/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    }).then(res => res.json()),
    onSuccess: () => {
      refetch();
    }
  });

  // Mutations for options
  const createOptionMutation = useMutation({
    mutationFn: (data: InsertMenuItemOption) =>
      fetch(`/api/admin/option-groups/${selectedOptionGroup!.id}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: () => {
      refetch();
      setIsAddOptionOpen(false);
    }
  });

  const updateOptionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertMenuItemOption> }) =>
      fetch(`/api/admin/options/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: () => {
      refetch();
      setIsEditOptionOpen(false);
      setSelectedOption(null);
    }
  });

  const deleteOptionMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/admin/options/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    }).then(res => res.json()),
    onSuccess: () => {
      refetch();
    }
  });

  // Mark menu item as having options
  const updateMenuItemMutation = useMutation({
    mutationFn: (data: { hasOptions: boolean }) =>
      fetch(`/api/admin/menu-items/${menuItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
    }
  });

  const hasAnyGroups = optionGroups && optionGroups.length > 0;

  // Auto-update hasOptions field based on whether groups exist
  React.useEffect(() => {
    if (optionGroups !== undefined) {
      const shouldHaveOptions = optionGroups.length > 0;
      if (menuItem.hasOptions !== shouldHaveOptions) {
        updateMenuItemMutation.mutate({ hasOptions: shouldHaveOptions });
      }
    }
  }, [optionGroups, menuItem.hasOptions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-muted-foreground">Loading options...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{menuItem.name} Options</h3>
          <p className="text-sm text-muted-foreground">
            {hasAnyGroups ? `${optionGroups.length} option groups configured` : 'No option groups configured'}
          </p>
        </div>
        <Button onClick={() => setIsAddGroupOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Option Group
        </Button>
      </div>

      {!hasAnyGroups ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium mb-2">No Option Groups</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Create option groups like "Meat", "Rice", "Toppings" to let customers customize this item.
          </p>
          <Button onClick={() => setIsAddGroupOpen(true)}>
            Create First Option Group
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {optionGroups.map((group) => (
            <Collapsible key={group.id} className="border rounded-lg">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <ChevronRight className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-90" />
                    <div className="text-left">
                      <h4 className="font-medium">{group.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {group.required ? 'Required' : 'Optional'} • 
                        Max {group.maxSelections} selections • 
                        {group.options.length} options
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOptionGroup(group);
                        setIsEditGroupOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Option Group</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{group.name}"? This will also delete all {group.options.length} options in this group.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteOptionGroupMutation.mutate(group.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Group
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t bg-muted/20">
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="font-medium">Options in {group.name}</h5>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedOptionGroup(group);
                          setIsAddOptionOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Option
                      </Button>
                    </div>

                    {group.options.length === 0 ? (
                      <div className="text-center py-8 border rounded-lg bg-background">
                        <p className="text-muted-foreground">No options in this group</p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {group.options.map((option) => (
                          <div key={option.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{option.name}</p>
                                {option.priceModifier > 0 && (
                                  <span className="text-xs bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded">
                                    +€{option.priceModifier.toFixed(2)}
                                  </span>
                                )}
                                {!option.available && (
                                  <span className="text-xs bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded">
                                    Unavailable
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedOption(option);
                                  setIsEditOptionOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Option</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{option.name}"?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteOptionMutation.mutate(option.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}

      {/* Add Option Group Dialog */}
      <Dialog open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Option Group</DialogTitle>
            <DialogDescription>
              Create a new option group for {menuItem.name}
            </DialogDescription>
          </DialogHeader>
          <OptionGroupForm
            onSubmit={(data) => createOptionGroupMutation.mutate(data)}
            isSubmitting={createOptionGroupMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Option Group Dialog */}
      <Dialog open={isEditGroupOpen} onOpenChange={setIsEditGroupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Option Group</DialogTitle>
            <DialogDescription>
              Update the option group settings
            </DialogDescription>
          </DialogHeader>
          {selectedOptionGroup && (
            <OptionGroupForm
              optionGroup={selectedOptionGroup}
              onSubmit={(data) => updateOptionGroupMutation.mutate({ id: selectedOptionGroup.id, data })}
              isSubmitting={updateOptionGroupMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Option Dialog */}
      <Dialog open={isAddOptionOpen} onOpenChange={setIsAddOptionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Option</DialogTitle>
            <DialogDescription>
              Add a new option to {selectedOptionGroup?.name}
            </DialogDescription>
          </DialogHeader>
          <OptionForm
            onSubmit={(data) => createOptionMutation.mutate(data)}
            isSubmitting={createOptionMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Option Dialog */}
      <Dialog open={isEditOptionOpen} onOpenChange={setIsEditOptionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Option</DialogTitle>
            <DialogDescription>
              Update the option details
            </DialogDescription>
          </DialogHeader>
          {selectedOption && (
            <OptionForm
              option={selectedOption}
              onSubmit={(data) => updateOptionMutation.mutate({ id: selectedOption.id, data })}
              isSubmitting={updateOptionMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Option Group Form Component
type OptionGroupFormProps = {
  optionGroup?: MenuItemOptionGroup;
  onSubmit: (data: InsertMenuItemOptionGroup) => void;
  isSubmitting: boolean;
};

function OptionGroupForm({ optionGroup, onSubmit, isSubmitting }: OptionGroupFormProps) {
  const optionGroupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    required: z.boolean().default(false),
    maxSelections: z.coerce.number().int().min(1, "Must allow at least 1 selection"),
    order: z.coerce.number().int().min(0).default(0),
  });

  const form = useForm<z.infer<typeof optionGroupSchema>>({
    resolver: zodResolver(optionGroupSchema),
    defaultValues: {
      name: optionGroup?.name || "",
      required: optionGroup?.required || false,
      maxSelections: optionGroup?.maxSelections || 1,
      order: optionGroup?.order || 0,
    },
  });

  function handleSubmit(values: z.infer<typeof optionGroupSchema>) {
    console.log("Form submitted with values:", values);
    onSubmit(values as InsertMenuItemOptionGroup);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Meat, Rice, Toppings" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="maxSelections"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Selections</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Order</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="required"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <Switch 
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>Required Selection</FormLabel>
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (optionGroup ? "Updating..." : "Creating...") : (optionGroup ? "Update Group" : "Create Group")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// Option Form Component
type OptionFormProps = {
  option?: MenuItemOption;
  onSubmit: (data: InsertMenuItemOption) => void;
  isSubmitting: boolean;
};

function OptionForm({ option, onSubmit, isSubmitting }: OptionFormProps) {
  const optionSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    priceModifier: z.coerce.number().min(0, "Price modifier cannot be negative").default(0),
    order: z.coerce.number().int().min(0).default(0),
    available: z.boolean().default(true),
  });

  const form = useForm<z.infer<typeof optionSchema>>({
    resolver: zodResolver(optionSchema),
    defaultValues: {
      name: option?.name || "",
      priceModifier: option?.priceModifier || 0,
      order: option?.order || 0,
      available: option?.available ?? true,
    },
  });

  function handleSubmit(values: z.infer<typeof optionSchema>) {
    onSubmit(values as InsertMenuItemOption);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Option Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Chicken, Brown Rice, Extra Cheese" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priceModifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Extra Cost (€)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                </FormControl>
                <FormDescription>Additional cost for this option</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Order</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="available"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <Switch 
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>Available</FormLabel>
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (option ? "Updating..." : "Creating...") : (option ? "Update Option" : "Create Option")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
