import { useState } from "react";
import { MenuItem } from "@shared/schema";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MenuItemCardProps {
  item: MenuItem;
}

export default function MenuItemCard({ item }: MenuItemCardProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCart = () => {
    setIsAddingToCart(true);
    
    // Simulate a slight delay for visual feedback
    setTimeout(() => {
      addToCart({
        id: Date.now(), // unique ID for cart item
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        image: item.image
      });
      
      toast({
        title: "Added to cart",
        description: `${item.name} has been added to your cart.`,
      });
      
      setIsAddingToCart(false);
    }, 300);
  };

  // Create an array of stars based on the rating
  const stars = [];
  const fullStars = Math.floor(item.rating);
  const hasHalfStar = item.rating % 1 >= 0.5;
  
  for (let i = 0; i < fullStars; i++) {
    stars.push("full");
  }
  
  if (hasHalfStar) {
    stars.push("half");
  }
  
  while (stars.length < 5) {
    stars.push("empty");
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden menu-item-transition">
      <div className="relative">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-48 object-cover"
        />
        {item.label && (
          <div className={`absolute top-3 right-3 ${item.label === 'Popular' || item.label === 'Best Seller' ? 'bg-primary' : 'bg-accent'} text-white text-xs font-bold px-2 py-1 rounded`}>
            {item.label}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-menu font-semibold text-lg text-secondary">{item.name}</h3>
          <span className="font-bold text-primary">${item.price.toFixed(2)}</span>
        </div>
        <p className="text-gray-600 text-sm mt-1">{item.description}</p>
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center">
            <div className="flex text-warning">
              {stars.map((type, index) => (
                <span key={index}>
                  {type === "full" && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                  )}
                  {type === "half" && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                  )}
                  {type === "empty" && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                  )}
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-1">({item.reviewCount})</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon"
                  className="bg-primary hover:bg-primary/90 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center transition"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add to cart</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
