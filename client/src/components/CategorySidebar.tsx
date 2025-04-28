import { useMemo } from "react";
import { MenuCategory } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface CategorySidebarProps {
  categories: MenuCategory[];
  isLoading: boolean;
  activeCategory: string | null;
  onCategoryChange: (slug: string) => void;
}

export default function CategorySidebar({ 
  categories, 
  isLoading, 
  activeCategory, 
  onCategoryChange 
}: CategorySidebarProps) {
  // Find today's special - just using the first item from the main courses for demo
  const todaysSpecial = useMemo(() => {
    if (categories.length > 0) {
      // For the sake of this demo, we'll just pick the first category's special
      return {
        name: "Mediterranean Salad",
        price: 12.99,
        originalPrice: 15.99,
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"
      };
    }
    return null;
  }, [categories]);

  return (
    <aside className="lg:w-1/4 mb-6 lg:mb-0 lg:pr-6">
      <div className="lg:sticky lg:top-32">
        <h2 className="text-xl font-heading font-bold mb-4 text-secondary">Categories</h2>
        
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <nav>
            <ul>
              {categories.map((category) => (
                <li key={category.id} className="mb-1">
                  <button
                    className={`category-pill block w-full text-left px-4 py-2 rounded-lg font-menu font-medium hover:bg-primary hover:text-white transition-colors ${activeCategory === category.slug ? 'active' : ''}`}
                    onClick={() => onCategoryChange(category.slug)}
                  >
                    {category.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
        
        <div className="mt-8 bg-secondary text-white p-4 rounded-lg">
          <h3 className="font-heading font-bold text-lg mb-2">Today's Special</h3>
          <p className="text-sm mb-3">Try our chef's signature dish with 15% off!</p>
          
          {isLoading || !todaysSpecial ? (
            <div className="bg-white rounded-lg p-2 overflow-hidden">
              <Skeleton className="w-full h-32 rounded" />
              <div className="mt-2">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex justify-between items-center mt-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-2 overflow-hidden">
              <div className="w-full h-32 overflow-hidden rounded">
                <img 
                  src={todaysSpecial.image} 
                  alt={todaysSpecial.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-2">
                <h4 className="font-menu font-medium text-secondary">{todaysSpecial.name}</h4>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-primary font-bold">${todaysSpecial.price.toFixed(2)}</span>
                  <span className="text-xs line-through text-gray-500">${todaysSpecial.originalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
