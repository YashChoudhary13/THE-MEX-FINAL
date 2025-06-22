import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MenuCategory, MenuItem } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ChevronDown, Bookmark, Flame, AlertCircle, ShoppingBag, Info, Clock } from "lucide-react";
import MenuItemCard from "./MenuItemCard";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";

interface MenuContentProps {
  activeCategory: string | null;
  searchQuery: string;
}

export default function MenuContent({ activeCategory, searchQuery }: MenuContentProps) {
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high'>('popular');
  const [showFilters, setShowFilters] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();

  // Fetch categories and menu items
  const { data: categories } = useQuery<MenuCategory[]>({
    queryKey: ["/api/categories"],
  });

  const { data: menuItems, isLoading: menuItemsLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
    refetchInterval: 30000, // Regular updates for pricing changes
  });

  // Fetch current special offer for real-time updates
  const { data: specialOffer } = useQuery({
    queryKey: ["/api/special-offer"],
    refetchInterval: 15000,
  });

  // Group items by category and apply filters
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
    
    // Sort items based on the selected option
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } 
    
    setFilteredItems(filtered);
  }, [menuItems, searchQuery, sortBy]);

  // Get items for the selected category
  const getCategoryItems = (categoryId: number) => {
    return filteredItems.filter(item => item.categoryId === categoryId);
  };

  // Find a category by slug
  const findCategoryBySlug = (slug: string | null): MenuCategory | undefined => {
    if (!slug || !categories) return undefined;
    return categories.find(cat => cat.slug === slug);
  };

  // Get the active category object
  const currentCategory = findCategoryBySlug(activeCategory);

  // Create skeleton for loading state
  const menuItemSkeleton = () => (
    <div className="bg-card rounded-xl shadow-md overflow-hidden border border-border">
      <Skeleton className="w-full h-48 bg-muted" />
      <div className="p-5">
        <div className="flex justify-between items-start">
          <Skeleton className="h-7 w-32 bg-muted" />
          <Skeleton className="h-7 w-16 bg-muted" />
        </div>
        <Skeleton className="h-4 w-full mt-3 bg-muted" />
        <Skeleton className="h-4 w-3/4 mt-1 bg-muted" />
        <div className="flex justify-between items-center mt-4">
          <Skeleton className="h-5 w-28 bg-muted" />
          <Skeleton className="h-10 w-10 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );

  // Animation variants for the menu items
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <main className="lg:w-3/4">
      {/* Category header and filter options */}
      <div className="mb-8 flex flex-col space-y-5">
        {currentCategory && (
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-heading text-primary">
              {currentCategory.name.toUpperCase()}
            </h1>
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-menu">
              {filteredItems.filter(item => item.categoryId === currentCategory.id).length} items
            </span>
          </div>
        )}

        {searchQuery && (
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-4xl font-heading text-primary">SEARCH RESULTS</h1>
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-menu">
              {filteredItems.length} items
            </span>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <Button 
            variant="outline"
            size="sm"
            className="gap-2 border-primary/20 text-muted-foreground hover:text-primary hover:border-primary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            Filters
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-card text-foreground border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="price-low">Price (Low to High)</option>
              <option value="price-high">Price (High to Low)</option>
            </select>
          </div>
        </div>
        
        {showFilters && (
          <div className="bg-card p-4 rounded-lg border border-border grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="vegetarian" className="rounded border-primary/30 text-primary focus:ring-primary/40" />
              <label htmlFor="vegetarian" className="text-foreground text-sm">Vegetarian</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="spicy" className="rounded border-primary/30 text-primary focus:ring-primary/40" />
              <label htmlFor="spicy" className="text-foreground text-sm">Spicy</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="new" className="rounded border-primary/30 text-primary focus:ring-primary/40" />
              <label htmlFor="new" className="text-foreground text-sm">New Items</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="glutenfree" className="rounded border-primary/30 text-primary focus:ring-primary/40" />
              <label htmlFor="glutenfree" className="text-foreground text-sm">Gluten Free</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="bestseller" className="rounded border-primary/30 text-primary focus:ring-primary/40" />
              <label htmlFor="bestseller" className="text-foreground text-sm">Best Sellers</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="combo" className="rounded border-primary/30 text-primary focus:ring-primary/40" />
              <label htmlFor="combo" className="text-foreground text-sm">Combo Meals</label>
            </div>
          </div>
        )}
      </div>
      
      {/* Show all items when searching */}
      {searchQuery && (
        <section className="mb-12">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-muted/50 rounded-xl border border-border">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-heading text-xl text-foreground mb-2">No items found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">We couldn't find any items matching "{searchQuery}". Try a different search term or browse our categories.</p>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
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
        </section>
      )}
      
      {/* If not searching, show items by category */}
      {!searchQuery && categories && categories.map(category => {
        const categoryItems = getCategoryItems(category.id);
        
        // Only show categories with items or that match the active category
        if (categoryItems.length === 0 && category.id !== currentCategory?.id) {
          return null;
        }
        
        // Skip this category if it's not the active one and we have an active category
        if (activeCategory && category.slug !== activeCategory) {
          return null;
        }
        
        return (
          <section id={category.slug} key={category.id} className="mb-16">
            {/* Category description for active category */}
            {activeCategory === category.slug && category.description && (
              <div className="mb-8 bg-gradient-to-r from-secondary/10 to-transparent p-6 rounded-xl border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <Flame className="h-5 w-5 text-primary" />
                  <h3 className="font-heading text-lg text-foreground">About {category.name}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {category.description}
                </p>
              </div>
            )}
            
            {menuItemsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, index) => (
                  <div key={index}>{menuItemSkeleton()}</div>
                ))}
              </div>
            ) : categoryItems.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-xl border border-border">
                <Bookmark className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-heading text-lg text-foreground mb-2">No items available</h3>
                <p className="text-muted-foreground">We're currently updating our menu in this category. Check back soon!</p>
              </div>
            ) : (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {categoryItems.map(item => (
                  <motion.div key={item.id} variants={itemVariants}>
                    <MenuItemCard item={item} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </section>
        );
      })}
    </main>
  );
}
