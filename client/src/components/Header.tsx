import { useState } from "react";
import { useLocation } from "wouter";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/use-auth";
import { MenuIcon, Search, ShoppingBag, ChevronRight, Flame, LogOut, User, LayoutDashboard, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Sheet, 
  SheetTrigger, 
  SheetContent, 
  SheetClose 
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onCartToggle?: () => void;
  onSearch?: (query: string) => void;
  hideSearch?: boolean;
}

export default function Header({ 
  onCartToggle, 
  onSearch,
  hideSearch = false
}: HeaderProps) {
  const [, navigate] = useLocation();
  const { cart, calculateTotals } = useCart();
  const { user, isAdmin, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch && onSearch(e.target.value);
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      {/* Main header section */}
      <div className="container mx-auto px-4 py-3 lg:py-4 flex items-center justify-between">
        {/* Left section with mobile menu and logo */}
        <div className="flex items-center">
          {/* Mobile menu trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2 md:hidden text-foreground">
                <MenuIcon className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-card border-r border-border">
              <div className="py-6">
                <div className="flex items-center mb-6">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="h-6 w-6 text-primary"
                  >
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="font-heading font-bold text-xl ml-2 text-primary">THE MEX</h3>
                </div>
                <nav className="space-y-1">
                  <SheetClose asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start font-menu text-base" 
                      onClick={() => navigate("/")}
                    >
                      <Flame className="h-5 w-5 mr-3 text-primary" />
                      Home
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start font-menu text-base"
                      onClick={() => navigate("/about")}
                    >
                      <ChevronRight className="h-5 w-5 mr-3 text-primary" />
                      About Us
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start font-menu text-base"
                      onClick={() => navigate("/contact")}
                    >
                      <ChevronRight className="h-5 w-5 mr-3 text-primary" />
                      Contact
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start font-menu text-base"
                      onClick={() => navigate("/track-order")}
                    >
                      <MapPin className="h-5 w-5 mr-3 text-primary" />
                      Track Order
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start font-menu text-base"
                      onClick={() => navigate("/checkout")}
                    >
                      <ShoppingBag className="h-5 w-5 mr-3 text-primary" />
                      Checkout
                    </Button>
                  </SheetClose>
                  <div className="pt-4 mt-4 border-t border-border">
                    {user ? (
                      <>
                        <SheetClose asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-start font-menu text-base"
                            onClick={() => navigate("/account")}
                          >
                            <User className="h-5 w-5 mr-3 text-primary" />
                            My Account
                          </Button>
                        </SheetClose>
                        {isAdmin && (
                          <SheetClose asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-start font-menu text-base"
                              onClick={() => navigate("/admin")}
                            >
                              <LayoutDashboard className="h-5 w-5 mr-3 text-primary" />
                              Admin Dashboard
                            </Button>
                          </SheetClose>
                        )}
                        <SheetClose asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-start font-menu text-base"
                            onClick={() => logoutMutation.mutate()}
                          >
                            <LogOut className="h-5 w-5 mr-3 text-primary" />
                            Sign Out
                          </Button>
                        </SheetClose>
                      </>
                    ) : (
                      <SheetClose asChild>
                        <Button
                          variant="default" 
                          className="w-full justify-center mt-2 bg-primary hover:bg-primary/90 font-menu"
                          onClick={() => navigate("/auth")}
                        >
                          SIGN IN
                        </Button>
                      </SheetClose>
                    )}
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Logo on desktop and tablet */}
          <Button
            variant="ghost"
            className="flex items-center p-0"
            onClick={() => navigate("/")}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="h-7 w-7 md:h-8 md:w-8 text-primary"
            >
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h1 className="ml-2 text-2xl md:text-3xl font-heading text-primary">THE MEX</h1>
          </Button>
        </div>
        
        {/* Center section with navigation links - visible on md and larger */}
        <div className="hidden md:flex justify-center items-center">
          <nav className="flex items-center space-x-2 lg:space-x-8">
            <Button 
              variant="link" 
              className="font-menu text-sm lg:text-base text-foreground hover:text-primary"
              onClick={() => navigate("/")}
            >
              HOME
            </Button>
            <Button 
              variant="link" 
              className="font-menu text-sm lg:text-base text-foreground hover:text-primary"
              onClick={() => navigate("/about")}
            >
              ABOUT
            </Button>
            <Button 
              variant="link" 
              className="font-menu text-sm lg:text-base text-foreground hover:text-primary"
              onClick={() => navigate("/contact")}
            >
              CONTACT
            </Button>
            <Button 
              variant="link" 
              className="font-menu text-sm lg:text-base text-foreground hover:text-primary flex items-center"
              onClick={() => navigate("/track-order")}
            >
              <MapPin className="h-4 w-4 mr-1 text-primary" />
              TRACK ORDER
            </Button>
            {isAdmin && (
              <Button 
                variant="link" 
                className="font-menu text-sm lg:text-base text-foreground hover:text-primary"
                onClick={() => navigate("/admin")}
              >
                DASHBOARD
              </Button>
            )}
          </nav>
        </div>
        
        {/* Right section with cart and account */}
        <div className="flex items-center justify-end space-x-2">
          {/* Cart button */}
          {onCartToggle && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground hover:text-primary transition-colors"
                onClick={onCartToggle}
              >
                <ShoppingBag className="h-6 w-6" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center cart-badge-animation">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </div>
          )}
          
          {/* Account section - visible on md and larger */}
          <div className="hidden md:block">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/10 ml-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-menu truncate max-w-[100px]">{user.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/account")}>
                    <User className="h-4 w-4 mr-2" />
                    <span>Account Settings</span>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      <span>Admin Dashboard</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="default" 
                className="bg-primary hover:bg-primary/90 font-menu text-sm lg:text-base ml-2"
                onClick={() => navigate("/auth")}
              >
                SIGN IN
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Search bar section */}
      {!hideSearch && (
        <div className="bg-muted py-3 px-4 md:py-4">
          <div className="container mx-auto">
            <div className="relative">
              <Input
                placeholder="Search for burgers, sides, drinks..."
                className="w-full py-2 md:py-6 pl-10 md:pl-12 pr-4 rounded-full border-primary/20 bg-card focus:ring-primary text-base md:text-lg"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <Search className="h-5 w-5 md:h-6 md:w-6 text-primary absolute left-4 top-1/2 transform -translate-y-1/2" />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 hidden sm:flex items-center gap-2 md:gap-3 text-muted-foreground">
                <span className="text-xs md:text-sm bg-primary/10 py-1 px-2 md:px-3 rounded-full">burgers</span>
                <span className="text-xs md:text-sm bg-primary/10 py-1 px-2 md:px-3 rounded-full">fries</span>
                <span className="text-xs md:text-sm bg-primary/10 py-1 px-2 md:px-3 rounded-full">shakes</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
