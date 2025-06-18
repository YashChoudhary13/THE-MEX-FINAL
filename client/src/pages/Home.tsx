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
      
      {/* Hero Section - Fully Responsive Professional Design */}
      <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-b from-secondary/50 via-secondary/20 to-background relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center"></div>
        
        <div className="container mx-auto px-4 sm:px-6">
          {/* Featured Banner */}
          <motion.div 
            className="flex justify-center mb-8 sm:mb-12"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="bg-primary/10 text-primary px-3 py-1.5 sm:px-4 sm:py-2 rounded-full inline-flex items-center">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              <span className="font-menu text-xs sm:text-sm tracking-wider">TODAY'S SPECIAL: DOUBLE SMASH BURGER - 20% OFF</span>
            </div>
          </motion.div>
          
          {/* Hero Content */}
          <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8 lg:gap-10 mb-6 sm:mb-10">
            {/* Left Content */}
            <motion.div 
              className="lg:w-1/2 z-10 flex flex-col items-center lg:items-start text-center lg:text-left"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading text-foreground mb-4 sm:mb-6 leading-tight">
                <span className="text-primary">FLAME-GRILLED</span> <br />
                PERFECTION IN <br className="hidden sm:block" />
                EVERY BITE.
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-md">
                Discover our handcrafted burgers made with premium ingredients and a side of attitude. Your cravings don't stand a chance.
              </p>
              <div className="flex flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 font-menu text-base sm:text-lg h-10 sm:h-12 px-4 sm:px-6"
                  onClick={scrollToMenu}
                >
                  VIEW MENU
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-primary text-primary hover:bg-primary/10 font-menu text-base sm:text-lg h-10 sm:h-12 px-4 sm:px-6"
                  onClick={toggleCart}
                >
                  VIEW CART
                </Button>
              </div>
            </motion.div>
            
            {/* Right Content - Responsive Food Display */}
            <motion.div 
              className="w-full sm:w-4/5 lg:w-1/2 rounded-xl sm:rounded-2xl overflow-visible relative mt-6 lg:mt-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="relative w-full">
                {/* Main hero image */}
                <img 
                  src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800"
                  alt="Signature Burger"
                  className="w-full h-auto rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl"
                />
                
                {/* Floating cards with additional menu categories - responsive positioning */}
                <div className="absolute -bottom-2 sm:-bottom-4 lg:-bottom-6 -left-2 sm:-left-4 lg:-left-6 bg-card p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl shadow-lg sm:shadow-xl border border-primary/20 hidden sm:block">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <img 
                      src="https://images.unsplash.com/photo-1619881590738-a111d176d906?auto=format&fit=crop&w=120" 
                      alt="French Fries" 
                      className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-md sm:rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-bold text-sm sm:text-base">Classic Sides</p>
                      <button 
                        className="text-xs sm:text-sm text-primary flex items-center" 
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
                
                <div className="absolute -top-2 sm:-top-3 lg:-top-4 -right-2 sm:-right-3 lg:-right-4 bg-card p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl shadow-lg sm:shadow-xl border border-primary/20 hidden sm:block">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <img 
                      src="https://images.unsplash.com/photo-1629203432180-71e9b18d33f3?auto=format&fit=crop&w=120" 
                      alt="Drinks" 
                      className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-md sm:rounded-lg object-cover"
                      onError={(e) => {
                        // Hide the entire image container if image fails to load
                        const target = e.target as HTMLImageElement;
                        const container = target.closest('.absolute') as HTMLElement;
                        if (container) {
                          container.style.display = 'none';
                        }
                      }}
                    />
                    <div>
                      <p className="font-bold text-sm sm:text-base">Fresh Drinks</p>
                      <button 
                        className="text-xs sm:text-sm text-primary flex items-center" 
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
                
                {/* Price badge - responsive sizing */}
                <div className="absolute top-2 sm:top-3 lg:top-4 left-2 sm:left-3 lg:left-4 bg-primary text-white font-bold px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-full text-xs sm:text-sm">
                  FROM $9.99
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Trust indicators - responsive layout */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-8 sm:mt-10 lg:mt-12 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center justify-center sm:justify-start gap-2 bg-card/50 p-3 rounded-lg">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-full">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 text-primary fill-primary" />
              </div>
              <div>
                <p className="font-bold text-sm sm:text-base">4.9 Star Rating</p>
                <p className="text-xs text-muted-foreground">1,200+ reviews</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center sm:justify-start gap-2 bg-card/50 p-3 rounded-lg">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-full">
                <Award className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm sm:text-base">Award Winner 2024</p>
                <p className="text-xs text-muted-foreground">Best burger in town</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center sm:justify-start gap-2 bg-card/50 p-3 rounded-lg">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-full">
                <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm sm:text-base">Fast Pickup</p>
                <p className="text-xs text-muted-foreground">Ready in 15 minutes</p>
              </div>
            </div>
          </motion.div>
          
          {/* Scroll Down Indicator - responsive */}
          <motion.div 
            className="text-center mt-6 sm:mt-8 lg:mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <button 
              onClick={scrollToMenu}
              className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors"
            >
              <span className="text-xs sm:text-sm mb-1 sm:mb-2">Scroll to See Menu</span>
              <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 animate-bounce" />
            </button>
          </motion.div>
        </div>
      </section>
      
      {/* Menu Section - Enhanced for Responsive Design */}
      <section ref={menuScrollRef} className="w-full relative py-6 sm:py-8 lg:py-10">
        <div 
          ref={menuRef}
          className="container mx-auto px-4 py-4 sm:py-6"
        >
          {/* Section title */}
          <motion.div 
            className="mb-6 sm:mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading text-center sm:text-left">
              Our <span className="text-primary">Menu</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base text-center sm:text-left mt-2">
              Explore our delicious selection of handcrafted foods
            </p>
          </motion.div>
          
          {/* Menu content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
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
              // Tablet and Desktop layout
              <div className="flex flex-col lg:flex-row w-full">
                <div className="lg:w-1/4 xl:w-1/5 mb-6 lg:mb-0 lg:pr-6">
                  <CategorySidebar 
                    categories={categories as MenuCategory[] || []} 
                    isLoading={categoriesLoading}
                    activeCategory={activeCategory}
                    onCategoryChange={handleCategoryChange}
                  />
                </div>
                
                <div className="lg:w-3/4 xl:w-4/5">
                  <MenuContent 
                    activeCategory={activeCategory} 
                    searchQuery={searchQuery}
                  />
                </div>
              </div>
            )}
          </motion.div>
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
