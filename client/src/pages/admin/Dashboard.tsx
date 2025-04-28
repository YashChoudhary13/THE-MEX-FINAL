import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MenuCategory, MenuItem, Order } from "@shared/schema";
import { CreditCard, Menu, ArrowRightLeft, Settings, BarChart3, Users, LogOut, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import AdminOrders from "./components/AdminOrders";
import AdminMenu from "./components/AdminMenu";
import AdminTodaysSpecial from "./components/AdminTodaysSpecial";

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  
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
    queryKey: ["/api/orders"],
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
              <Button className="bg-primary hover:bg-primary/90">
                {activeTab === "overview" && "View Reports"}
                {activeTab === "orders" && "New Order"}
                {activeTab === "menu" && "Add Item"}
                {activeTab === "specials" && "Update Special"}
              </Button>
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
                                <p className="font-medium">${order.totalAmount.toFixed(2)}</p>
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
              <AdminOrders orders={orders || []} isLoading={ordersLoading} />
            )}
            
            {activeTab === "menu" && (
              <AdminMenu 
                categories={categories || []} 
                menuItems={menuItems || []} 
                isLoading={categoriesLoading || menuItemsLoading} 
              />
            )}
            
            {activeTab === "specials" && (
              <AdminTodaysSpecial menuItems={menuItems || []} isLoading={menuItemsLoading} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}