import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MenuCategory, MenuItem } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import MenuItemCard from "./MenuItemCard";

interface MenuContentProps {
  activeCategory: string | null;
  searchQuery: string;
}

export default function MenuContent({ activeCategory, searchQuery }: MenuContentProps) {
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);

  // Fetch categories and menu items
  const { data: categories } = useQuery<MenuCategory[]>({
    queryKey: ["/api/categories"],
  });

  const { data: menuItems, isLoading: menuItemsLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
  });

  // Group items by category for display
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <Skeleton className="w-full h-48" />
      <div className="p-4">
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-3/4 mt-1" />
        <div className="flex justify-between items-center mt-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );

  return (
    <main className="lg:w-3/4">
      {/* Welcome Banner */}
      <section className="mb-8 relative rounded-xl overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836" 
          alt="Delicious food spread" 
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/80 to-secondary/40 flex items-center">
          <div className="px-6 py-4 text-white max-w-lg">
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">Fresh & Delicious</h1>
            <p className="mb-4">Experience the finest flavors delivered right to your doorstep. Order now and enjoy your meal within 30 minutes!</p>
            <Button className="bg-primary hover:bg-primary/90 text-white font-medium">
              View Today's Specials
            </Button>
          </div>
        </div>
      </section>
      
      {/* Show all items when searching */}
      {searchQuery && (
        <section className="mb-12">
          <h2 className="text-2xl font-heading font-bold mb-6 pb-2 border-b-2 border-primary inline-block text-secondary">
            Search Results
          </h2>
          
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No items match your search. Try a different term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {filteredItems.map(item => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
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
          <section id={category.slug} key={category.id} className="mb-12">
            <h2 className="text-2xl font-heading font-bold mb-6 pb-2 border-b-2 border-primary inline-block text-secondary">
              {category.name}
            </h2>
            
            {menuItemsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, index) => (
                  <div key={index}>{menuItemSkeleton()}</div>
                ))}
              </div>
            ) : categoryItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No items available in this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {categoryItems.map(item => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </main>
  );
}
