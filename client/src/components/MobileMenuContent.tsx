import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MenuCategory, MenuItem, CartItem } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
  const queryClient = useQueryClient();
  
  // Fetch current special offer for real-time display
  const { data: specialOffer } = useQuery<{
    menuItem: MenuItem;
    discountValue?: number;
    discountAmount?: number;
    specialPrice?: number;
    endDate: string;
  } | null>({
    queryKey: ["/api/special-offer"],
    refetchInterval: 15000,
  });

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Format special offer data for display
  const todaysSpecial = specialOffer ? {
    name: (specialOffer as any).menuItem.name,
    description: (specialOffer as any).menuItem.description,
    price: (specialOffer as any).specialPrice || ((specialOffer as any).menuItem.price - ((specialOffer as any).discountValue || 0)),
    originalPrice: (specialOffer as any).menuItem.price,
    image: (specialOffer as any).menuItem.image || "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800",
    label: "SPECIAL OFFER",
    menuItem: (specialOffer as any).menuItem,
    savings: (specialOffer as any).discountValue || (specialOffer as any).discountAmount || 0
  } : null;

  // Fetch categories and menu items
  const { data: categories } = useQuery<MenuCategory[]>({
    queryKey: ["/api/categories"],
  });

  const { data: menuItems, isLoading: menuItemsLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
    refetchInterval: 30000,
  });

  // WebSocket listener for real-time menu updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'MENU_UPDATED') {
          console.log('🔄 Menu update received, refreshing mobile customer view');
          // Force immediate refresh of menu data
          queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
          queryClient.refetchQueries({ queryKey: ["/api/menu-items"] });
          queryClient.invalidateQueries({ queryKey: ["/api/special-offer"] });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    return () => {
      ws.close();
    };
  }, [queryClient]);

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
      {todaysSpecial && (
        <section className="mb-10">
          <div className="flex items-center mb-4">
            <Flame className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-2xl font-heading text-primary">TODAY'S SPECIAL</h2>
          </div>
          
          <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-5 rounded-xl border border-border">
            <div className="bg-primary text-white text-xs px-3 py-1 rounded-full font-menu w-fit mb-4">
              {todaysSpecial.label}
            </div>
            {todaysSpecial.image && (
              <div className="w-full h-48 overflow-hidden rounded-lg mb-4">
                <img 
                  src={todaysSpecial.image} 
                  alt={todaysSpecial.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const container = target.parentElement;
                    if (container) {
                      container.style.display = 'none';
                    }
                  }}
                />
              </div>
            )}
            
            <h3 className="font-heading text-xl text-foreground mb-2">{todaysSpecial.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">{todaysSpecial.description}</p>
            
            <div className="flex justify-between items-center mb-2">
              <span className="text-xl font-bold text-primary">{formatCurrency(todaysSpecial.price)}</span>
              <span className="text-sm line-through text-muted-foreground">{formatCurrency(todaysSpecial.originalPrice)}</span>
            </div>
            
            <div className="flex justify-center mb-4">
              <Badge variant="outline" className="text-xs">
                Save {formatCurrency(todaysSpecial.savings)}
              </Badge>
            </div>
            
            <button 
              className={`w-full py-3 font-menu rounded-lg transition-colors ${
                todaysSpecial.menuItem?.soldOut 
                  ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
              disabled={todaysSpecial.menuItem?.soldOut}
              onClick={() => {
                if (todaysSpecial.menuItem && !todaysSpecial.menuItem.soldOut) {
                  // For items with options, we need to trigger customization
                  // For now, add directly - we'll enhance this with customization later
                  const cartItem: CartItem = {
                    id: Date.now(),
                    menuItemId: todaysSpecial.menuItem.id,
                    name: todaysSpecial.menuItem.name,
                    price: todaysSpecial.price, // Use the special offer price
                    quantity: 1,
                    image: todaysSpecial.menuItem.image || ''
                  };
                  addToCart(cartItem);
                  toast({
                    title: "Added to cart",
                    description: `${todaysSpecial.menuItem.name} has been added to your cart at special price!`
                  });
                }
              }}
            >
              {todaysSpecial.menuItem?.soldOut ? 'SOLD OUT' : 'ADD TO CART'}
            </button>
          </div>
        </section>
      )}
      
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
