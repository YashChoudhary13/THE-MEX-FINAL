import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MenuCategory, MenuItem, CartItem } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame } from "lucide-react";
import MenuItemCard from "./MenuItemCard";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";

interface MobileMenuContentProps {
  activeCategory: string | null;
  searchQuery: string;
}

export default function MobileMenuContent({ activeCategory, searchQuery }: MobileMenuContentProps) {
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const { addToCart } = useCart();
  const { toast } = useToast();
  
  // Special item for "Today's Special" section
  const todaysSpecial = {
    name: "Double Smash Burger",
    price: 14.99,
    originalPrice: 17.99,
    image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800",
    label: "CHEF'S CHOICE",
    description: "Two smashed beef patties, melted cheese, caramelized onions, special sauce, crispy pickles",
    menuItem: {
      id: 1, // Use a fixed ID for the special
      name: "Double Smash Burger",
      image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800"
    }
  };

  // Fetch categories and menu items
  const { data: categories } = useQuery<MenuCategory[]>({
    queryKey: ["/api/categories"],
  });

  const { data: menuItems, isLoading: menuItemsLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
  });

  // Apply filters
  useEffect(() => {
    if (!menuItems) return;

    let filtered = [...menuItems];

    // Filter by search query if present
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredItems(filtered);
  }, [menuItems, searchQuery]);

  // Get items for a specific category
  const getCategoryItems = (categoryId: number) => {
    return filteredItems.filter(item => item.categoryId === categoryId);
  };

  // Find a category by slug
  const findCategoryBySlug = (slug: string | null): MenuCategory | undefined => {
    if (!slug || !categories) return undefined;
    return categories.find(cat => cat.slug === slug);
  };

  // Find the "Starters" category
  const startersCategory = categories?.find(cat => cat.slug === 'starters');
  
  // Get the currently active category
  const currentCategory = findCategoryBySlug(activeCategory);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  // Create skeleton for loading state
  const menuItemSkeleton = () => (
    <div className="bg-card rounded-xl shadow-md overflow-hidden border border-border">
      <Skeleton className="w-full h-40 bg-muted" />
      <div className="p-4">
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-32 bg-muted" />
          <Skeleton className="h-6 w-16 bg-muted" />
        </div>
        <Skeleton className="h-4 w-full mt-2 bg-muted" />
        <Skeleton className="h-4 w-3/4 mt-1 bg-muted" />
        <div className="flex justify-between items-center mt-3">
          <Skeleton className="h-5 w-24 bg-muted" />
          <Skeleton className="h-9 w-9 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );

  // If we're showing search results
  if (searchQuery) {
    return (
      <div className="px-4">
        <h2 className="text-2xl font-heading mb-4 text-primary">SEARCH RESULTS</h2>
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-xl border border-border">
            <p className="text-muted-foreground">No items found matching "{searchQuery}"</p>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredItems.map(item => (
              <motion.div key={item.id} variants={itemVariants}>
                <MenuItemCard item={item} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    );
  }

  // For the mobile view, show all categories in sequence for easy scrolling
  return (
    <div className="px-4 pb-24" id="full-menu"> {/* Extra padding at bottom for floating menu button */}
      {/* Today's Special Section */}
      <section className="mb-10">
        <div className="flex items-center mb-4">
          <Flame className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-2xl font-heading text-primary">TODAY'S SPECIAL</h2>
        </div>
        
        <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-5 rounded-xl border border-border">
          <div className="relative">
            <div className="absolute top-2 left-2 bg-primary text-white text-xs px-3 py-1 rounded-full font-menu z-10">
              {todaysSpecial.label}
            </div>
            <div className="w-full h-48 overflow-hidden rounded-lg mb-4">
              <img 
                src={todaysSpecial.image} 
                alt={todaysSpecial.name} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <h3 className="font-heading text-xl text-foreground mb-2">{todaysSpecial.name}</h3>
          <p className="text-sm text-muted-foreground mb-3">{todaysSpecial.description}</p>
          
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-bold text-primary">${todaysSpecial.price.toFixed(2)}</span>
            <span className="text-sm line-through text-muted-foreground">${todaysSpecial.originalPrice.toFixed(2)}</span>
          </div>
          
          <button 
            className="w-full py-3 bg-primary text-white font-menu rounded-lg hover:bg-primary/90 transition-colors"
            onClick={() => {
              if (todaysSpecial.menuItem) {
                // Add special offer item to cart
                const cartItem: CartItem = {
                  id: Date.now(), // Generate a unique ID for the cart item
                  menuItemId: todaysSpecial.menuItem.id,
                  name: todaysSpecial.menuItem.name,
                  price: todaysSpecial.price, // Use the special offer price
                  quantity: 1,
                  image: todaysSpecial.menuItem.image
                };
                addToCart(cartItem);
                toast({
                  title: "Added to cart",
                  description: `${todaysSpecial.menuItem.name} has been added to your cart`,
                  variant: "success"
                });
              }
            }}
          >
            ADD TO CART
          </button>
        </div>
      </section>
      
      {/* Show all categories for mobile devices */}
      {categories && categories.length > 0 && menuItems && !searchQuery ? (
        <div className="space-y-12">
          {categories.map(category => (
            <section key={category.id} id={`category-${category.slug}`} className="scroll-mt-20">
              <div className="sticky top-16 z-10 bg-gradient-to-r from-background via-background to-background/90 py-2">
                <h2 className="text-2xl font-heading text-primary border-b border-border pb-2">{category.name.toUpperCase()}</h2>
              </div>
              
              {menuItemsLoading ? (
                <div className="grid grid-cols-1 gap-4 mt-4">
                  {[...Array(3)].map((_, index) => (
                    <div key={index}>{menuItemSkeleton()}</div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  className="grid grid-cols-1 gap-4 mt-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {getCategoryItems(category.id).map(item => (
                    <motion.div key={item.id} variants={itemVariants}>
                      <MenuItemCard item={item} />
                    </motion.div>
                  ))}
                  
                  {/* Show message if no items in category */}
                  {getCategoryItems(category.id).length === 0 && (
                    <div className="text-center py-6 bg-muted/30 rounded-xl border border-border">
                      <p className="text-muted-foreground">No items in this category</p>
                    </div>
                  )}
                </motion.div>
              )}
            </section>
          ))}
        </div>
      ) : (!searchQuery && (
        <div className="text-center py-12 bg-muted/30 rounded-xl border border-border">
          <p className="text-muted-foreground">Loading menu categories...</p>
        </div>
      ))}
      
      {/* If a specific category is selected (this will only apply for desktop view) */}
      {currentCategory && searchQuery && (
        <section className="mb-8">
          <h2 className="text-2xl font-heading mb-4 text-primary">{currentCategory.name.toUpperCase()}</h2>
          
          {menuItemsLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[...Array(3)].map((_, index) => (
                <div key={index}>{menuItemSkeleton()}</div>
              ))}
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {getCategoryItems(currentCategory.id).map(item => (
                <motion.div key={item.id} variants={itemVariants}>
                  <MenuItemCard item={item} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      )}
    </div>
  );
}