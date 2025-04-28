import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import CategorySidebar from "@/components/CategorySidebar";
import MenuContent from "@/components/MenuContent";
import CartPanel from "@/components/CartPanel";
import Footer from "@/components/Footer";
import { MenuCategory } from "@shared/schema";

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch menu categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Set the first category as active when data loads
  if (categories && !activeCategory && categories.length > 0) {
    setActiveCategory(categories[0].slug);
  }

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const handleCategoryChange = (slug: string) => {
    setActiveCategory(slug);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        onCartToggle={toggleCart} 
        onSearch={handleSearch} 
      />
      
      <div className="container mx-auto px-4 py-6 flex flex-col lg:flex-row flex-grow">
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
