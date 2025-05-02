import { useMemo } from "react";
import { MenuCategory } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, ChevronRight } from "lucide-react";

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
  // Find today's special - using a featured burger for demo
  const todaysSpecial = useMemo(() => {
    if (categories.length > 0) {
      return {
        name: "Double Smash Burger",
        price: 14.99,
        originalPrice: 17.99,
        image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800",
        label: "CHEF'S CHOICE",
        description: "Two smashed beef patties, melted cheese, caramelized onions, special sauce, crispy pickles"
      };
    }
    return null;
  }, [categories]);

  return (
    <aside>
      <div className="lg:sticky lg:top-32 flex flex-col h-full">
        <h2 className="text-3xl font-heading mb-6 text-primary">MENU</h2>
        
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full bg-muted" />
            <Skeleton className="h-12 w-full bg-muted" />
            <Skeleton className="h-12 w-full bg-muted" />
            <Skeleton className="h-12 w-full bg-muted" />
          </div>
        ) : (
          <nav className="mb-4">
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.id}>
                  <button
                    className={`block w-full text-left px-5 py-3 rounded-lg font-menu font-medium text-lg transition-all ${
                      activeCategory === category.slug 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                        : 'text-foreground hover:bg-muted hover:text-primary'
                    }`}
                    onClick={() => onCategoryChange(category.slug)}
                  >
                    <div className="flex items-center">
                      {activeCategory === category.slug && (
                        <Flame className="mr-2 h-5 w-5" />
                      )}
                      {category.name.toUpperCase()}
                      {activeCategory === category.slug && (
                        <ChevronRight className="ml-auto h-5 w-5" />
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
        
        <div className="mt-4 mb-6 bg-gradient-to-br from-primary/20 to-accent/20 p-6 rounded-2xl border border-primary/10">
          <div className="flex items-center mb-3">
            <Flame className="h-5 w-5 text-primary mr-2" />
            <h3 className="font-heading text-xl text-primary">TODAY'S SPECIAL</h3>
          </div>
          
          {isLoading || !todaysSpecial ? (
            <div className="space-y-4">
              <Skeleton className="w-full h-48 rounded-xl bg-card" />
              <Skeleton className="h-6 w-3/4 bg-card" />
              <Skeleton className="h-4 w-full bg-card" />
              <div className="flex justify-between items-center mt-1">
                <Skeleton className="h-6 w-20 bg-card" />
                <Skeleton className="h-4 w-16 bg-card" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute top-3 left-3 bg-primary text-white text-xs px-3 py-1 rounded-full font-menu">
                  {todaysSpecial.label}
                </div>
                <div className="w-full h-48 overflow-hidden rounded-xl food-3d-effect">
                  <img 
                    src={todaysSpecial.image} 
                    alt={todaysSpecial.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <h4 className="font-heading text-xl text-foreground">{todaysSpecial.name}</h4>
              <p className="text-sm text-muted-foreground">{todaysSpecial.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-primary">${todaysSpecial.price.toFixed(2)}</span>
                <span className="text-sm line-through text-muted-foreground">${todaysSpecial.originalPrice.toFixed(2)}</span>
              </div>
              <button 
                className="w-full py-3 bg-primary text-white font-menu rounded-lg hover:bg-primary/90 transition-colors"
                onClick={() => {
                  // This could trigger adding the item to cart
                  console.log('Special added to cart');
                }}
              >
                ADD TO CART
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
