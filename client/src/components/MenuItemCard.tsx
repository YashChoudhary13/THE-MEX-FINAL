import { useState } from "react";
import { MenuItem } from "@shared/schema";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, ShoppingBag, Flame, Clock, ChevronDown, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

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
  
  // Use mobile hook to detect screen size
  const isMobile = useIsMobile();

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

  // State for full-screen detailed view
  const [showFullDetails, setShowFullDetails] = useState(false);

  // Toggle full details
  const toggleFullDetails = () => {
    setShowFullDetails(!showFullDetails);
  };

  // Stop event propagation
  const handleStopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // If mobile, use a horizontal layout
  if (isMobile) {
    return (
      <>
        <div 
          className="bg-card rounded-xl border border-border overflow-hidden menu-item-transition h-32 sm:h-36 active:bg-muted/50 cursor-pointer"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={toggleFullDetails}
        >
          <div className="flex h-full">
            {/* Left side - Image */}
            <div className="relative w-1/3 sm:w-2/5 h-full">
              <img 
                src={item.image} 
                alt={item.name} 
                className={`w-full h-full object-cover transition-transform duration-500 ${isHovering ? 'scale-110' : 'scale-100'}`}
              />
              
              {/* Labels */}
              {item.label && (
                <div className="absolute top-2 left-2 bg-primary text-white px-2 py-0.5 rounded-full text-xs font-menu font-medium shadow-md flex items-center">
                  <Flame className="h-3 w-3 mr-0.5" />
                  {item.label.toUpperCase()}
                </div>
              )}
              
              {/* Price badge overlay */}
              <div className="absolute bottom-2 left-2 bg-card/90 backdrop-blur-sm text-primary px-2 py-0.5 rounded-full text-xs font-bold shadow-md">
                ${item.price.toFixed(2)}
              </div>
            </div>
            
            {/* Right side - Content */}
            <div className="flex-1 p-3 flex flex-col justify-between relative">
              {/* Top section - Title and rating */}
              <div>
                <div className="flex justify-between items-start mb-1.5">
                  <h3 className="font-heading text-base sm:text-lg text-foreground pr-16 line-clamp-1">{item.name}</h3>
                  
                  {/* Prep time badge - top right */}
                  <div className="absolute top-3 right-3 bg-muted/80 text-foreground px-2 py-0.5 rounded-full text-[10px] flex items-center">
                    <Clock className="h-2.5 w-2.5 text-primary mr-0.5" />
                    {prepTime} min
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-muted-foreground text-xs line-clamp-2 mb-1.5">{item.description}</p>
              </div>
              
              {/* Bottom section - Add to cart controls */}
              <div className="flex justify-between items-center">
                {/* Star Rating */}
                <div className="flex items-center text-xs">
                  <div className="flex mr-1">
                    {stars.slice(0, 3).map((type, index) => (
                      <span key={index} className="mr-0.5">
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
                  <span className="text-[10px] text-muted-foreground truncate mr-0.5">({item.reviewCount || '42'})</span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the parent's onClick
                      toggleDetails(e);
                    }}
                    className="text-[10px] text-primary flex items-center ml-1.5"
                  >
                    <Info className="h-3 w-3 mr-0.5" />
                    Info
                  </button>
                </div>
                
                {/* Add to cart button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        className="bg-primary hover:bg-primary/90 text-white font-menu h-7 px-3 text-xs"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the parent's onClick
                          handleAddToCart();
                        }}
                        disabled={isAddingToCart}
                      >
                        <ShoppingBag className="h-3 w-3 mr-1" />
                        ADD
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add to cart</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {/* Expandable details section (rendered as an overlay for mobile) */}
              {showDetails && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-background/95 backdrop-blur-sm p-3 flex flex-col text-xs z-10"
                  onClick={handleStopPropagation}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-heading text-sm text-primary">DETAILS</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the parent's onClick
                        toggleDetails(e);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 text-foreground mb-auto overflow-y-auto">
                    <p><strong>Ingredients:</strong> {item.ingredients || 'Proprietary blend of high-quality ingredients.'}</p>
                    <p><strong>Calories:</strong> {item.calories || '600-800'} kcal</p>
                    <p><strong>Allergens:</strong> {item.allergens || 'May contain wheat, dairy, and soy.'}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                    <div className="flex items-center bg-muted rounded-lg">
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 rounded-full text-foreground hover:text-primary px-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          decrementQuantity(e);
                        }}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-5 text-center text-xs font-medium">{quantity}</span>
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 rounded-full text-foreground hover:text-primary px-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          incrementQuantity(e);
                        }}
                        disabled={quantity >= 10}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button 
                      className="bg-primary hover:bg-primary/90 text-white font-menu h-7 text-xs"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart();
                      }}
                      disabled={isAddingToCart}
                    >
                      <ShoppingBag className="h-3 w-3 mr-1" />
                      ADD TO CART
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Full screen detailed view */}
        {showFullDetails && (
          <div 
            className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 overflow-y-auto"
            onClick={toggleFullDetails}
          >
            <div 
              className="max-w-md mx-auto p-4 pt-16 pb-24"
              onClick={handleStopPropagation}
            >
              {/* Close button */}
              <Button
                variant="outline"
                size="icon"
                className="absolute top-4 right-4 rounded-full border-border"
                onClick={toggleFullDetails}
              >
                <X className="h-5 w-5" />
              </Button>
              
              {/* Image */}
              <div className="relative w-full h-64 rounded-xl overflow-hidden mb-5">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                />
                
                {/* Labels */}
                {item.label && (
                  <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-xs font-menu font-medium shadow-md flex items-center">
                    <Flame className="h-3 w-3 mr-1" />
                    {item.label.toUpperCase()}
                  </div>
                )}
              </div>
              
              {/* Details */}
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h2 className="font-heading text-2xl text-foreground">{item.name}</h2>
                  <span className="font-bold text-primary text-2xl">${item.price.toFixed(2)}</span>
                </div>
                
                {/* Star Rating */}
                <div className="flex items-center">
                  <div className="flex mr-2">
                    {stars.map((type, index) => (
                      <span key={index} className="mr-0.5">
                        {type === "full" && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                          </svg>
                        )}
                        {type === "half" && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                          </svg>
                        )}
                        {type === "empty" && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground/30" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                          </svg>
                        )}
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">({item.reviewCount || '42'} reviews)</span>
                  
                  {/* Prep time */}
                  <div className="ml-auto flex items-center text-sm">
                    <Clock className="h-4 w-4 text-primary mr-1.5" />
                    <span>Ready in {prepTime} min</span>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-muted-foreground">{item.description}</p>
                
                {/* Detailed information */}
                <div className="space-y-3 pt-3 border-t border-border">
                  <h3 className="font-heading text-lg text-primary">DETAILS</h3>
                  
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <h4 className="font-medium text-foreground">Ingredients</h4>
                      <p className="text-muted-foreground">{item.ingredients || 'Proprietary blend of high-quality ingredients.'}</p>
                    </div>
                    
                    <div className="flex gap-6">
                      <div>
                        <h4 className="font-medium text-foreground">Calories</h4>
                        <p className="text-muted-foreground">{item.calories || '600-800'} kcal</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-foreground">Allergens</h4>
                        <p className="text-muted-foreground">{item.allergens || 'May contain wheat, dairy, and soy.'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Add to cart controls */}
                <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
                  <div className="max-w-md mx-auto flex items-center justify-between">
                    <div className="flex items-center bg-muted rounded-lg">
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 rounded-full text-foreground hover:text-primary"
                        onClick={(e) => decrementQuantity(e)}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-5 w-5" />
                      </Button>
                      <span className="w-10 text-center text-base font-medium">{quantity}</span>
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 rounded-full text-foreground hover:text-primary"
                        onClick={(e) => incrementQuantity(e)}
                        disabled={quantity >= 10}
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    <Button 
                      className="bg-primary hover:bg-primary/90 text-white font-menu h-10 px-6"
                      onClick={handleAddToCart}
                      disabled={isAddingToCart}
                    >
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      ADD TO CART · ${(item.price * quantity).toFixed(2)}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop layout (unchanged from original)
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
