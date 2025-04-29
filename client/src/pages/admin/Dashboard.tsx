import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MenuCategory, MenuItem, Order, InsertMenuItem, InsertMenuCategory, InsertSpecialOffer } from "@shared/schema";
import { CreditCard, Menu, ArrowRightLeft, Settings, BarChart3, Users, LogOut, ShoppingBag, Plus, Edit, Trash, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

// We'll wrap the admin component sections in conditional rendering
// to avoid errors when the component files are being loaded

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddMenuItemOpen, setIsAddMenuItemOpen] = useState(false);
  const [isEditMenuItemOpen, setIsEditMenuItemOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isUpdateSpecialOpen, setIsUpdateSpecialOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const { toast } = useToast();
  
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

  // Fetch current special offer
  const { data: specialOffer, isLoading: specialOfferLoading } = useQuery<any>({
    queryKey: ["/api/special-offer"],
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
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
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

  const updateSpecialOfferMutation = useMutation({
    mutationFn: async (data: InsertSpecialOffer) => {
      // First deactivate all existing specials
      await apiRequest("POST", "/api/admin/special-offers/deactivate-all");
      // Then create the new special
      const response = await apiRequest("POST", "/api/admin/special-offers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/special-offer"] });
      setIsUpdateSpecialOpen(false);
      toast({
        title: "Special offer updated",
        description: "Today's special has been updated successfully",
      });
    },
    onError: (error) => {
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

  const handleLogout = () => {
    // In a real app, we would handle authentication logout here
    navigate("/");
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
          
          <Separator className="my-4" />
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground" 
            onClick={() => navigate("/")}
          >
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            View Site
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground"
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
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
          variant="ghost"
          className="flex-1" 
          size="sm"
          onClick={() => navigate("/")}
        >
          <ArrowRightLeft className="h-5 w-5" />
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
              </h1>
              <p className="text-muted-foreground">
                {activeTab === "overview" && "Monitor your restaurant's performance and manage daily operations."}
                {activeTab === "orders" && "View, update and manage all customer orders."}
                {activeTab === "menu" && "Add, edit or remove items from your restaurant menu."}
                {activeTab === "specials" && "Set and manage today's special offers and promotions."}
              </p>
            </div>
            
            <div>
              {activeTab === "overview" && (
                <Button className="bg-primary hover:bg-primary/90">
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
              {activeTab === "specials" && (
                <Button className="bg-primary hover:bg-primary/90" onClick={() => setIsUpdateSpecialOpen(true)}>
                  Update Special
                </Button>
              )}
            </div>
          </div>
          
          {/* Dashboard Content */}
          <div>
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Today's Orders
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{orders?.length || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        +12.5% from yesterday
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Revenue
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">$1,245.89</div>
                      <p className="text-xs text-muted-foreground">
                        +2.5% from yesterday
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Menu Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{menuItems?.length || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        Across {categories?.length || 0} categories
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Recent Orders</CardTitle>
                      <CardDescription>
                        View and manage recent customer orders
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {ordersLoading ? (
                        <div className="flex items-center justify-center h-48">
                          <p>Loading orders...</p>
                        </div>
                      ) : !orders || orders.length === 0 ? (
                        <div className="flex items-center justify-center h-48 border rounded-md">
                          <p className="text-muted-foreground">No recent orders found</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {orders.slice(0, 5).map((order) => (
                            <div key={order.id} className="flex items-center justify-between border-b pb-3">
                              <div>
                                <p className="font-medium">Order #{order.id}</p>
                                <p className="text-sm text-muted-foreground">{order.customerName}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">${order.total.toFixed(2)}</p>
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
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Today's Special</CardTitle>
                      <CardDescription>Currently promoted special item</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-muted rounded-md overflow-hidden relative mb-4">
                        <img 
                          src="https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800" 
                          alt="Today's Special"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded-md">
                          SPECIAL OFFER
                        </div>
                      </div>
                      <h3 className="font-medium mb-1">Double Smash Burger</h3>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-lg font-bold text-primary">$14.99</p>
                        <p className="text-sm line-through text-muted-foreground">$17.99</p>
                      </div>
                      <Button variant="outline" className="w-full">Edit Special</Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            
            {activeTab === "orders" && (
              <div className="p-6 bg-card rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Order Management</h2>
                <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
                  <div className="w-full md:w-1/3">
                    <label className="text-sm font-medium mb-2 block">Search Orders</label>
                    <input 
                      className="w-full px-3 py-2 border rounded-md bg-background"
                      placeholder="Search by name or order number..." 
                    />
                  </div>
                  <div className="w-full md:w-1/3">
                    <label className="text-sm font-medium mb-2 block">Filter by Status</label>
                    <select className="w-full px-3 py-2 border rounded-md bg-background">
                      <option value="all">All Orders</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <Button className="bg-primary hover:bg-primary/90">
                    Export Orders
                  </Button>
                </div>
                
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="py-3 px-4 text-left">Order ID</th>
                        <th className="py-3 px-4 text-left">Customer</th>
                        <th className="py-3 px-4 text-left">Date</th>
                        <th className="py-3 px-4 text-left">Total</th>
                        <th className="py-3 px-4 text-left">Status</th>
                        <th className="py-3 px-4 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders?.map((order) => (
                        <tr key={order.id} className="border-t">
                          <td className="py-3 px-4">#{order.id}</td>
                          <td className="py-3 px-4">{order.customerName}</td>
                          <td className="py-3 px-4">Apr 28, 2025</td>
                          <td className="py-3 px-4">${order.total.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              order.status === 'completed' 
                                ? 'bg-green-500/10 text-green-500' 
                                : order.status === 'processing' 
                                  ? 'bg-blue-500/10 text-blue-500'
                                  : 'bg-orange-500/10 text-orange-500'
                            }`}>
                              {order.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Button variant="ghost" size="sm">View Details</Button>
                          </td>
                        </tr>
                      ))}
                      {!orders || orders.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted-foreground">
                            No orders found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {activeTab === "menu" && (
              <div className="p-6 bg-card rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Menu Management</h2>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2">
                    <Button 
                      variant="secondary"
                      size="sm"
                    >
                      All Items
                    </Button>
                    {categories?.map((category) => (
                      <Button 
                        key={category.id} 
                        variant="ghost"
                        size="sm"
                      >
                        {category.name}
                      </Button>
                    ))}
                  </div>
                  
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Menu Item
                  </Button>
                </div>
                
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="py-3 px-4 text-left">Image</th>
                        <th className="py-3 px-4 text-left">Name</th>
                        <th className="py-3 px-4 text-left">Category</th>
                        <th className="py-3 px-4 text-left">Price</th>
                        <th className="py-3 px-4 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuItems?.map((item) => {
                        const category = categories?.find(c => c.id === item.categoryId);
                        return (
                          <tr key={item.id} className="border-t">
                            <td className="py-3 px-4">
                              <div className="w-12 h-12 rounded-md overflow-hidden bg-muted">
                                <img 
                                  src={item.image} 
                                  alt={item.name} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium">{item.name}</td>
                            <td className="py-3 px-4">{category?.name || "Unknown"}</td>
                            <td className="py-3 px-4">${item.price.toFixed(2)}</td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <Button variant="outline" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {!menuItems || menuItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-muted-foreground">
                            No menu items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
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
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="col-span-1">
                        <div className="aspect-square rounded-xl border overflow-hidden bg-muted relative">
                          <img 
                            src="https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800" 
                            alt="Double Smash Burger"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 left-3 bg-primary text-white text-sm font-bold px-3 py-1 rounded-lg">
                            SPECIAL OFFER
                          </div>
                        </div>
                      </div>
                      
                      <div className="md:col-span-2 flex flex-col">
                        <h3 className="text-2xl font-heading mb-2">Double Smash Burger</h3>
                        <p className="text-muted-foreground mb-4">Two smashed beef patties, melted cheese, caramelized onions, special sauce, crispy pickles</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="space-y-1">
                            <h4 className="text-sm font-medium text-muted-foreground">Special Price</h4>
                            <p className="text-2xl font-bold text-primary">$14.99</p>
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-medium text-muted-foreground">Original Price</h4>
                            <p className="text-xl line-through text-muted-foreground">$17.99</p>
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md mb-4">
                          <p><strong>Discount:</strong> $3.00 off (17%)</p>
                        </div>
                        
                        <div className="mt-auto">
                          <Button className="w-full">Change Special</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Special Offer Performance</CardTitle>
                    <CardDescription>Analytics for your current special offer</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Orders Today</h3>
                        <p className="text-3xl font-bold">24</p>
                        <p className="text-sm text-muted-foreground">+12% from yesterday</p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Revenue</h3>
                        <p className="text-3xl font-bold">$359.76</p>
                        <p className="text-sm text-muted-foreground">+8% from yesterday</p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Promotion Effectiveness</h3>
                        <p className="text-3xl font-bold">85%</p>
                        <p className="text-sm text-muted-foreground">of customers order the special</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}