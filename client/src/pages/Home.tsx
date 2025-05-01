import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDownCircle, Sparkles, Star, Award, ChevronDown, ShoppingBag } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import Header from "@/components/Header";
import CategorySidebar from "@/components/CategorySidebar";
import MenuContent from "@/components/MenuContent";
import MobileMenu from "@/components/MobileMenu";
import MobileMenuContent from "@/components/MobileMenuContent";
import CartPanel from "@/components/CartPanel";
import Footer from "@/components/Footer";
import { MenuCategory } from "@shared/schema";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const menuScrollRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  
  // Use mobile hook to detect screen size
  const isMobile = useIsMobile();
  
  // Set up scroll animation
  const { scrollYProgress } = useScroll();
  
  // Animation values to make the menu "open up" as user scrolls
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Simplified scroll position detection with debounce for performance
  useEffect(() => {
    // Set menu to open by default to avoid expensive animations
    setMenuOpen(true);
    
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Only toggle menu if needed (already at correct state, do nothing)
      if (scrollPosition > windowHeight * 0.2 && !menuOpen) {
        setMenuOpen(true);
      } else if (scrollPosition <= windowHeight * 0.2 && menuOpen) {
        setMenuOpen(false);
      }
    };
    
    // Use passive event listener for better scroll performance
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [menuOpen]);

  // Fetch menu categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<MenuCategory[]>({
    queryKey: ["/api/categories"],
  });

  // Set the first category as active when data loads
  useEffect(() => {
    if (categories && Array.isArray(categories) && categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].slug);
    }
  }, [categories, activeCategory]);

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const handleCategoryChange = (slug: string) => {
    setActiveCategory(slug);
    // Clear search when selecting a category
    setSearchQuery("");
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // If clearing search, let category selection be preserved
    if (!query.trim()) return;
    
    // Set activeCategory to null to search across all categories
    setActiveCategory(null);
    
    // Scroll to menu section
    if (menuRef.current) {
      setTimeout(() => {
        menuRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const scrollToMenu = () => {
    if (menuRef.current) {
      menuRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Optimized animations for hero section
  const heroImagesVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const heroTextVariants = {
    initial: { opacity: 0, y: -10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, delay: 0.2, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        onCartToggle={toggleCart} 
        onSearch={handleSearch} 
      />
      
      {/* Hero Section - Professional Static Design */}
      <section className="py-16 bg-gradient-to-b from-secondary/50 via-secondary/20 to-background relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center"></div>
        
        <div className="container mx-auto px-4">
          {/* Featured Banner */}
          <div className="flex justify-center mb-12">
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-full inline-flex items-center">
              <Sparkles className="w-4 h-4 mr-2" />
              <span className="font-menu text-sm tracking-wider">TODAY'S SPECIAL: DOUBLE SMASH BURGER - 20% OFF</span>
            </div>
          </div>
          
          {/* Hero Content */}
          <div className="flex flex-col lg:flex-row items-center gap-10 mb-10">
            {/* Left Content */}
            <div className="lg:w-1/2 z-10 flex flex-col items-center lg:items-start text-center lg:text-left">
              <h1 className="text-5xl md:text-7xl font-heading text-foreground mb-6 leading-tight">
                <span className="text-primary">FLAME-GRILLED</span> <br />
                PERFECTION IN <br />
                EVERY BITE.
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-md">
                Discover our handcrafted burgers made with premium ingredients and a side of attitude. Your cravings don't stand a chance.
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 font-menu text-lg"
                  onClick={scrollToMenu}
                >
                  VIEW MENU
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-primary text-primary hover:bg-primary/10 font-menu text-lg"
                  onClick={toggleCart}
                >
                  VIEW CART
                </Button>
              </div>
            </div>
            
            {/* Right Content - Static Food Display */}
            <div className="lg:w-1/2 rounded-2xl overflow-hidden relative">
              <div className="relative w-full">
                {/* Main hero image */}
                <img 
                  src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800"
                  alt="Signature Burger"
                  className="w-full h-auto rounded-2xl shadow-2xl"
                />
                
                {/* Floating cards with additional menu categories */}
                <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-xl shadow-xl border border-primary/20 hidden md:block">
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://images.unsplash.com/photo-1619881590738-a111d176d906?auto=format&fit=crop&w=120" 
                      alt="French Fries" 
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-bold">Classic Sides</p>
                      <button 
                        className="text-sm text-primary flex items-center" 
                        onClick={() => {
                          setActiveCategory("sides");
                          scrollToMenu();
                        }}
                      >
                        View Selection
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -top-4 -right-4 bg-card p-4 rounded-xl shadow-xl border border-primary/20 hidden md:block">
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://images.unsplash.com/photo-1629203432180-71e9b18d33f3?auto=format&fit=crop&w=120" 
                      alt="Drinks" 
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-bold">Fresh Drinks</p>
                      <button 
                        className="text-sm text-primary flex items-center" 
                        onClick={() => {
                          setActiveCategory("drinks");
                          scrollToMenu();
                        }}
                      >
                        View Selection
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Price badge */}
                <div className="absolute top-4 left-4 bg-primary text-white font-bold px-4 py-2 rounded-full">
                  FROM $9.99
                </div>
              </div>
            </div>
          </div>
          
          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-8 mt-12 mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <Star className="h-5 w-5 text-primary fill-primary" />
              </div>
              <div>
                <p className="font-bold">4.9 Star Rating</p>
                <p className="text-xs text-muted-foreground">1,200+ reviews</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-bold">Award Winner 2024</p>
                <p className="text-xs text-muted-foreground">Best burger in town</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-bold">Fast Pickup</p>
                <p className="text-xs text-muted-foreground">Ready in 15 minutes</p>
              </div>
            </div>
          </div>
          
          {/* Scroll Down Indicator */}
          <div className="text-center mt-10">
            <button 
              onClick={scrollToMenu}
              className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors"
            >
              <span className="text-sm mb-2">Scroll to See Menu</span>
              <ChevronDown className="h-6 w-6 animate-bounce" />
            </button>
          </div>
        </div>
      </section>
      
      {/* Menu Section - Simplified for better performance */}
      <section ref={menuScrollRef} className="w-full relative py-8">
        <div 
          ref={menuRef}
          className="container mx-auto px-4 py-6 flex flex-col lg:flex-row flex-grow"
        >
          {isMobile ? (
            // Mobile-specific layout
            <div className="w-full">
              <MobileMenuContent 
                activeCategory={activeCategory} 
                searchQuery={searchQuery}
              />
            </div>
          ) : (
            // Desktop layout
            <div className="flex flex-col lg:flex-row w-full">
              <CategorySidebar 
                categories={categories as MenuCategory[] || []} 
                isLoading={categoriesLoading}
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryChange}
              />
              
              <MenuContent 
                activeCategory={activeCategory} 
                searchQuery={searchQuery}
              />
            </div>
          )}
        </div>
      </section>
      
      {/* Mobile floating menu button */}
      {isMobile && categories && (
        <MobileMenu 
          categories={categories as MenuCategory[] || []}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      )}
      
      <CartPanel 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
      />
      
      <Footer />
    </div>
  );
}
