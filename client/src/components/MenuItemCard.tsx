import { useState } from "react";
import { MenuItem } from "@shared/schema";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, ShoppingBag, Flame, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";

interface MenuItemCardProps {
  item: MenuItem;
}

export default function MenuItemCard({ item }: MenuItemCardProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    setIsAddingToCart(true);
    
    // Simulate a slight delay for visual feedback
    setTimeout(() => {
      addToCart({
        id: Date.now(), // unique ID for cart item
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: quantity,
        image: item.image
      });
      
      toast({
        title: "Added to cart",
        description: `${quantity} ${quantity > 1 ? 'items' : 'item'} of ${item.name} added to your cart.`,
      });
      
      setIsAddingToCart(false);
      setQuantity(1); // Reset quantity after adding to cart
    }, 300);
  };

  const incrementQuantity = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity(prev => Math.min(prev + 1, 10));
  };

  const decrementQuantity = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity(prev => Math.max(prev - 1, 1));
  };
  
  const toggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(!showDetails);
  };

  // Create an array of stars based on the rating
  const stars = [];
  const rating = item.rating || 0;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  for (let i = 0; i < fullStars; i++) {
    stars.push("full");
  }
  
  if (hasHalfStar) {
    stars.push("half");
  }
  
  while (stars.length < 5) {
    stars.push("empty");
  }

  // Generate a random prep time between 10-25 minutes for the demo
  const prepTime = Math.floor(Math.random() * 16) + 10;

  return (
    <div 
      className="bg-card rounded-xl border border-border overflow-hidden menu-item-transition"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative h-52 overflow-hidden">
        <img 
          src={item.image} 
          alt={item.name} 
          className={`w-full h-full object-cover transition-transform duration-500 ${isHovering ? 'scale-110' : 'scale-100'}`}
        />
        
        {/* Labels */}
        {item.label && (
          <div className="absolute top-3 right-3 bg-primary text-white px-3 py-1 rounded-full text-xs font-menu font-medium shadow-md flex items-center">
            <Flame className="h-3 w-3 mr-1" />
            {item.label.toUpperCase()}
          </div>
        )}

        {/* Prep time badge */}
        <div className="absolute bottom-3 right-3 bg-card/80 backdrop-blur-sm text-foreground px-3 py-1 rounded-full text-xs font-medium shadow-md flex items-center">
          <Clock className="h-3 w-3 text-primary mr-1" />
          {prepTime} min
        </div>

        {/* Rating badge */}
        <div className="absolute bottom-3 left-3 bg-card/80 backdrop-blur-sm text-foreground px-3 py-1 rounded-full text-xs font-medium shadow-md flex items-center">
          <div className="flex text-warning mr-1">
            {stars.map((type, index) => (
              <span key={index}>
                {type === "full" && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                )}
                {type === "half" && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                )}
                {type === "empty" && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-muted-foreground/30" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                )}
              </span>
            ))}
          </div>
          <span className="text-muted-foreground">({item.reviewCount})</span>
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex justify-between items-start">
          <h3 className="font-heading text-xl text-foreground">{item.name}</h3>
          <span className="font-bold text-primary text-xl">${item.price.toFixed(2)}</span>
        </div>
        
        <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{item.description}</p>
        
        {/* Expandable details section */}
        <div className="mt-3">
          <button 
            onClick={toggleDetails}
            className="text-xs flex items-center text-muted-foreground hover:text-primary transition-colors"
          >
            <span>{showDetails ? 'Hide details' : 'Show details'}</span>
            <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
          </button>
          
          {showDetails && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3 text-xs text-muted-foreground space-y-2"
            >
              <p><strong>Ingredients:</strong> {item.ingredients || 'Proprietary blend of high-quality ingredients.'}</p>
              <p><strong>Calories:</strong> {item.calories || '600-800'} kcal</p>
              <p><strong>Allergens:</strong> {item.allergens || 'May contain wheat, dairy, and soy.'}</p>
            </motion.div>
          )}
        </div>
        
        {/* Add to cart controls */}
        <div className="flex justify-between items-center mt-5">
          <div className="flex items-center bg-muted rounded-lg">
            <Button 
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full text-foreground hover:text-primary"
              onClick={decrementQuantity}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <Button 
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full text-foreground hover:text-primary"
              onClick={incrementQuantity}
              disabled={quantity >= 10}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  className="bg-primary hover:bg-primary/90 text-white font-menu"
                  size="sm"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  ADD TO CART
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add {quantity} to cart</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
