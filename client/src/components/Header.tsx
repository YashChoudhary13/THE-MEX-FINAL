import { useState } from "react";
import { useLocation } from "wouter";
import { useCart } from "@/context/CartContext";
import { MenuIcon, Search, ShoppingBag, ChevronRight, Flame, Star } from "lucide-react";
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
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2 lg:hidden text-foreground">
                <MenuIcon className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-card border-r border-border">
              <div className="py-6">
                <h3 className="font-heading font-bold text-xl mb-4 text-primary">MENU</h3>
                <nav className="space-y-2">
                  <SheetClose asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start font-menu" 
                      onClick={() => navigate("/")}
                    >
                      <Flame className="h-4 w-4 mr-2 text-primary" />
                      Home
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start font-menu"
                      onClick={() => navigate("/about")}
                    >
                      <ChevronRight className="h-4 w-4 mr-2 text-primary" />
                      About Us
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start font-menu"
                      onClick={() => navigate("/contact")}
                    >
                      <ChevronRight className="h-4 w-4 mr-2 text-primary" />
                      Contact
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start font-menu"
                      onClick={() => navigate("/checkout")}
                    >
                      <ChevronRight className="h-4 w-4 mr-2 text-primary" />
                      Checkout
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start font-menu"
                      onClick={() => navigate("/admin")}
                    >
                      <ChevronRight className="h-4 w-4 mr-2 text-primary" />
                      Admin
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
            <h1 className="ml-2 text-3xl font-heading text-primary">THE MEX</h1>
          </Button>
        </div>
        
        <div className="flex items-center">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center mr-6 space-x-6">
            <Button 
              variant="link" 
              className="font-menu text-foreground hover:text-primary"
              onClick={() => navigate("/")}
            >
              HOME
            </Button>
            <Button 
              variant="link" 
              className="font-menu text-foreground hover:text-primary"
              onClick={() => navigate("/about")}
            >
              ABOUT
            </Button>
            <Button 
              variant="link" 
              className="font-menu text-foreground hover:text-primary"
              onClick={() => navigate("/contact")}
            >
              CONTACT
            </Button>
            <Button 
              variant="link" 
              className="font-menu text-foreground hover:text-primary"
              onClick={() => navigate("/admin")}
            >
              ADMIN
            </Button>
          </div>
        
          {onCartToggle && (
            <div className="relative mr-4">
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
          
          <div className="hidden md:block">
            <Button variant="default" className="bg-primary hover:bg-primary/90 font-menu">
              SIGN IN
            </Button>
          </div>
        </div>
      </div>
      
      {!hideSearch && (
        <div className="bg-muted py-4 px-4">
          <div className="container mx-auto">
            <div className="relative">
              <Input
                placeholder="Search for burgers, sides, drinks..."
                className="w-full py-6 pl-12 pr-4 rounded-full border-primary/20 bg-card focus:ring-primary text-lg"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <Search className="h-6 w-6 text-primary absolute left-4 top-1/2 transform -translate-y-1/2" />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 hidden sm:flex items-center gap-3 text-muted-foreground">
                <span className="text-sm bg-primary/10 py-1 px-3 rounded-full">burgers</span>
                <span className="text-sm bg-primary/10 py-1 px-3 rounded-full">fries</span>
                <span className="text-sm bg-primary/10 py-1 px-3 rounded-full">shakes</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
