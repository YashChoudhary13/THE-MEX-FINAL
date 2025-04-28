import { useState } from "react";
import { useLocation } from "wouter";
import { useCart } from "@/context/CartContext";
import { MenuIcon, Search, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Sheet, 
  SheetTrigger, 
  SheetContent, 
  SheetClose 
} from "@/components/ui/sheet";

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
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch && onSearch(e.target.value);
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2 lg:hidden text-secondary">
                <MenuIcon className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="py-6">
                <h3 className="font-heading font-bold text-lg mb-4 text-secondary">Menu</h3>
                <nav className="space-y-2">
                  <SheetClose asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start" 
                      onClick={() => navigate("/")}
                    >
                      Home
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate("/checkout")}
                    >
                      Checkout
                    </Button>
                  </SheetClose>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          
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
              className="h-8 w-8 text-primary"
            >
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h1 className="ml-2 text-2xl font-heading font-bold text-secondary">Flavor Haven</h1>
          </Button>
        </div>
        
        <div className="flex items-center">
          {onCartToggle && (
            <div className="relative mr-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-secondary hover:text-primary transition-colors"
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
          
          <div className="hidden md:block">
            <Button variant="default" className="bg-primary hover:bg-primary/90">
              Sign In
            </Button>
          </div>
        </div>
      </div>
      
      {!hideSearch && (
        <div className="bg-light py-3 px-4 border-b">
          <div className="container mx-auto">
            <div className="relative">
              <Input
                placeholder="Search for dishes, cuisine..."
                className="w-full py-2 pl-10 pr-4 rounded-lg border focus:ring-primary"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
