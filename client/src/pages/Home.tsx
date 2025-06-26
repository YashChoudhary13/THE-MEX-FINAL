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

  // Fetch special offer for dynamic banner
  const { data: specialOffer } = useQuery({
    queryKey: ['/api/special-offer'],
    refetchInterval: 15000, // Refetch every 15 seconds for real-time updates
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
        <div className="absolute inset-0 bg-[url('https://scontent.fjai8-1.fna.fbcdn.net/v/t39.30808-6/470137200_18016000643644923_5572987016785909359_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=127cfc&_nc_ohc=qrQLfWrhTVMQ7kNvwFp7Lo8&_nc_oc=AdmxVxWFCwmqPFm61O3T3dCtZxW61a8WPeIdO_kgGdgCyA0IKWKPaN_RnmIFqGdwDjI&_nc_zt=23&_nc_ht=scontent.fjai8-1.fna&_nc_gid=2GAlB3mf8S9Cb3zTbJOmJw&oh=00_AfNg434ZS8ewit0-m0XyCkJPrp8pWejoQa6_lfpSaa5O2w&oe=685D67A0')] opacity-10 bg-cover bg-center"></div>
        
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
              <span className="font-menu text-xs sm:text-sm tracking-wider">
                {specialOffer && (specialOffer as any).menuItem ? (
                  `TODAY'S SPECIAL: ${(specialOffer as any).menuItem.name.toUpperCase()} - ${
                    (specialOffer as any).discountType === 'percentage' 
                      ? `${(specialOffer as any).discountValue || (specialOffer as any).discountAmount}% OFF`
                      : `€${(specialOffer as any).discountValue || (specialOffer as any).discountAmount} OFF`
                  }`
                ) : (
                  "TODAY'S SPECIAL: CHECK OUR MENU!"
                )}
              </span>
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
                MEXICAN HEAT<br className="hidden sm:block" />
                WITH EVERY CRUNCH.
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-md">
                From slow-cooked meats to smoky sauces, this is fast food with a soul. No forks, no fuss — just flavour.
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
                  src="https://res.cloudinary.com/dva2pren5/image/upload/b_rgb:F10000/c_fill,w_800,h_600,ar_4:3,e_improve/v1750576587/470203602_18016000436644923_8240666612134347088_n.jpg_v98bvs.jpg?auto=format&fit=crop&w=800&q=80"
                  alt="Signature Burger"
                  className="w-full h-auto rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl"
                />
                
                {/* Floating cards with additional menu categories - responsive positioning */}
                <div className="absolute -bottom-2 sm:-bottom-4 lg:-bottom-6 -left-2 sm:-left-4 lg:-left-6 bg-card p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl shadow-lg sm:shadow-xl border border-primary/20 hidden sm:block">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <img 
                      src="https://res.cloudinary.com/dva2pren5/image/upload/v1750577580/474576979_923764763217111_5465648993167304065_n.jpg_kjeuoh.jpg?auto=format&fit=crop&w=120" 
                      alt="Taco" 
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
                      src="https://res.cloudinary.com/dva2pren5/image/upload/v1750577751/474794630_924367589823495_9043190201700204349_n.jpg_prmrqz.jpg?auto=format&fit=crop&w=120" 
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
                  FROM €9.99
                </div>
              </div>
            </motion.div>
          </div>
          
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
