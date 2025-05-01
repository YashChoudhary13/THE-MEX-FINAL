import { useState, useEffect } from "react";
import { Menu, X, ChevronRight, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MenuCategory } from "@shared/schema";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileMenuProps {
  categories: MenuCategory[];
  activeCategory: string | null;
  onCategoryChange: (slug: string) => void;
}

export default function MobileMenu({ 
  categories, 
  activeCategory, 
  onCategoryChange 
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Function to scroll to a specific category section
  const scrollToCategory = (slug: string | null) => {
    if (!slug) return;
    
    const element = document.getElementById(`category-${slug}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Function to scroll to the full menu section
  const scrollToMenu = () => {
    const menuElement = document.getElementById('full-menu');
    if (menuElement) {
      menuElement.scrollIntoView({ behavior: 'smooth' });
      return true;
    }
    return false;
  };

  const handleCategoryClick = (slug: string) => {
    onCategoryChange(slug);
    setIsOpen(false);
    
    // Give time for the UI to update before scrolling
    setTimeout(() => {
      scrollToCategory(slug);
    }, 100);
  };

  return (
    <div className="lg:hidden fixed bottom-6 right-6 z-50">
      {/* Floating menu button */}
      <Button
        onClick={() => {
          // First try to scroll to menu before opening the menu panel
          const menuScrolled = scrollToMenu();
          
          // If scrolling to menu fails (possibly because we're not on the home page),
          // then open the menu panel
          if (!menuScrolled) {
            setIsOpen(true);
          }
        }}
        className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 shadow-xl flex items-center justify-center"
        aria-label="Open menu"
      >
        <Menu className="h-8 w-8" />
      </Button>

      {/* Menu panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed inset-y-0 right-0 w-4/5 max-w-xs bg-card border-l border-border shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-2xl font-heading text-primary">THE MEX MENU</h2>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              
              <div className="overflow-y-auto flex-1 py-4">
                {/* All Categories Button */}
                <div className="px-4 mb-4">
                  <button
                    className="flex items-center justify-between w-full text-left px-4 py-3 rounded-lg font-menu text-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                    onClick={() => {
                      setIsOpen(false);
                      // Give time for the panel to close before scrolling
                      setTimeout(() => {
                        scrollToMenu();
                      }, 300);
                    }}
                  >
                    <div className="flex items-center">
                      <ArrowDown className="mr-2 h-5 w-5" />
                      VIEW ALL CATEGORIES
                    </div>
                  </button>
                </div>
                
                <nav className="px-4">
                  <ul className="space-y-2">
                    {categories.map((category) => (
                      <li key={category.id}>
                        <button
                          className={`flex items-center justify-between w-full text-left px-4 py-3 rounded-lg font-menu text-lg transition-all ${
                            activeCategory === category.slug 
                              ? 'bg-primary text-white' 
                              : 'text-foreground hover:bg-muted'
                          }`}
                          onClick={() => handleCategoryClick(category.slug)}
                        >
                          <div className="flex items-center">
                            {activeCategory === category.slug && (
                              <Flame className="mr-2 h-5 w-5" />
                            )}
                            {category.name.toUpperCase()}
                          </div>
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}