import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowDownCircle, Sparkles, Star, Award, ChevronDown } from "lucide-react";
import Header from "@/components/Header";
import CategorySidebar from "@/components/CategorySidebar";
import MenuContent from "@/components/MenuContent";
import CartPanel from "@/components/CartPanel";
import Footer from "@/components/Footer";
import { MenuCategory } from "@shared/schema";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    setShowMenu(true);
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
    setShowMenu(true);
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
      
      {/* Hero Section with 3D Food */}
      <section className="py-14 md:py-28 bg-gradient-to-b from-secondary/30 to-background relative overflow-hidden">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center">
          {/* Left Text Content */}
          <motion.div 
            className="lg:w-1/2 z-10 mb-16 lg:mb-0"
            initial="initial"
            animate="animate"
            variants={heroTextVariants}
          >
            <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              <span className="font-menu text-sm tracking-wider">NEW SMASH BURGERS JUST DROPPED</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-heading text-foreground mb-6 leading-tight">
              <span className="text-primary">FLAME-GRILLED</span> <br />
              PERFECTION IN <br />
              EVERY BITE.
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-md">
              Discover our handcrafted burgers made with premium ingredients and a side of attitude. Your cravings don't stand a chance.
            </p>
            <div className="flex flex-wrap gap-4">
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
            <div className="flex items-center mt-10 gap-8">
              <div className="flex -space-x-3">
                <div className="w-8 h-8 rounded-full border-2 border-background overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100" 
                    alt="User" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-background overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100" 
                    alt="User" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-background overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=100" 
                    alt="User" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-primary fill-primary" />
                  <Star className="h-4 w-4 text-primary fill-primary" />
                  <Star className="h-4 w-4 text-primary fill-primary" />
                  <Star className="h-4 w-4 text-primary fill-primary" />
                  <Star className="h-4 w-4 text-primary fill-primary" />
                  <span className="ml-2 text-sm text-foreground font-medium">4.9</span>
                </div>
                <span className="text-xs text-muted-foreground">1,200+ ratings</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <span className="text-sm text-foreground">Award Winner 2024</span>
              </div>
            </div>
          </motion.div>
          
          {/* Right 3D Food Images */}
          <motion.div 
            className="lg:w-1/2 relative"
            initial="initial"
            animate="animate"
            variants={heroImagesVariants}
          >
            <div className="relative h-80 md:h-[32rem] w-full perspective-1000">
              {/* Main Burger Image */}
              <div className="food-3d-effect absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 z-20">
                <img 
                  src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800" 
                  alt="Delicious Burger" 
                  className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(255,80,0,0.5)]"
                />
              </div>
              
              {/* Secondary food images positioned around */}
              <div className="absolute left-0 top-1/4 w-32 h-32 md:w-48 md:h-48 rotate-12 opacity-70 z-10 food-3d-effect">
                <img 
                  src="https://images.unsplash.com/photo-1619881590738-a111d176d906?auto=format&fit=crop&w=400" 
                  alt="French Fries" 
                  className="w-full h-full object-contain drop-shadow-xl"
                />
              </div>
              
              <div className="absolute right-0 top-2/3 w-24 h-24 md:w-40 md:h-40 -rotate-6 opacity-80 z-10 food-3d-effect">
                <img 
                  src="https://images.unsplash.com/photo-1629203432180-71e9b18d33f3?auto=format&fit=crop&w=400" 
                  alt="Soda drink" 
                  className="w-full h-full object-contain drop-shadow-xl"
                />
              </div>
              
              {/* Removed bouncing elements to improve performance */}
            </div>
            
            {/* Simplified decorative gradient in the background for better performance */}
            <div className="absolute inset-0 opacity-20 bg-gradient-radial from-primary/20 via-transparent to-transparent"></div>
          </motion.div>
        </div>
        
        {/* Scroll Down Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
          <button 
            onClick={scrollToMenu}
            className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors"
          >
            <span className="text-sm mb-2">Scroll to See Menu</span>
            <ChevronDown className="h-6 w-6 animate-bounce" />
          </button>
        </div>
      </section>
      
      {/* Menu Section (only shown if showMenu is true) */}
      <div 
        ref={menuRef}
        className={`container mx-auto px-4 py-6 flex flex-col lg:flex-row flex-grow transition-opacity duration-500 ease-in-out ${showMenu ? 'opacity-100' : 'opacity-0 hidden'}`}
      >
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
      
      <CartPanel 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
      />
      
      <Footer />
    </div>
  );
}
