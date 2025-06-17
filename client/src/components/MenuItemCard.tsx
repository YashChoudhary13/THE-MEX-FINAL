import { useState, useEffect } from "react";
import { MenuItem } from "@shared/schema";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Minus, ShoppingBag, Flame, Clock, ChevronDown, 
  Info, X, Heart, Share, MessageSquare, Star 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MenuItemCardProps {
  item: MenuItem;
}

export default function MenuItemCard({ item }: MenuItemCardProps) {
  const { addToCart, cart, updateCartItemQuantity, removeFromCart } = useCart();
  const { toast } = useToast();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(0);
  
  // Use mobile hook to detect screen size
  const isMobile = useIsMobile();
  
  // Find the cart item for this menu item
  const getCartItem = () => {
    return cart.find(cartItem => cartItem.menuItemId === item.id);
  };
  
  // Check if item is already in cart and update state accordingly
  useEffect(() => {
    const cartItem = getCartItem();
    if (cartItem) {
      setIsInCart(true);
      setCartQuantity(cartItem.quantity);
    } else {
      setIsInCart(false);
      setCartQuantity(0);
    }
  }, [cart, item.id]);

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsAddingToCart(true);
    
    // Simulate a slight delay for visual feedback
    setTimeout(() => {
      addToCart({
        id: Date.now(), // unique ID for cart item
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: quantity,
        image: item.image,
        prepTime: item.prepTime || 15 // Use the item's prep time or default to 15 minutes
      });
      
      // Only show toast when adding from modal or detail view, not from quantity controls
      if (quantity > 1) {
        toast({
          title: "Added to cart",
          description: `${quantity} items of ${item.name} added to your cart.`,
        });
      }
      
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
  
  const openModal = () => {
    setIsModalOpen(true);
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

  // Use the item's prep time or calculate a fixed one based on item ID to avoid fluctuation
  const prepTime = item.prepTime || (10 + (item.id % 16)); // Fixed time based on item ID

  // Menu Item Detail Modal
  const MenuItemDetailModal = () => {
    if (!isModalOpen) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ touchAction: "none" }}>
        {/* Overlay - top 25% can be clicked to close */}
        <div 
          className="absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out" 
          onClick={() => setIsModalOpen(false)}
        />
        
        {/* Modal content - bottom 75% */}
        <div 
          className="relative w-full h-[75vh] bg-background rounded-t-xl border-t border-border shadow-lg z-10 overflow-hidden animate-in slide-in-from-bottom duration-300"
        >
          {/* Back button at the top */}
          <div className="sticky top-0 z-10 bg-background p-4 flex items-center border-b">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full flex items-center justify-center mr-3"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <h3 className="font-heading text-lg flex-1 truncate">{item.name}</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <Star className="h-4 w-4 text-primary fill-primary mr-1" />
              <span>{rating.toFixed(1)}</span>
            </div>
          </div>
          
          {/* Content area */}
          <div className="px-4 pt-4 pb-24 h-[calc(75vh-58px-68px)] overflow-y-auto no-scrollbar">
            {/* Image section */}
            <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
              {item.image ? (
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <div className="text-6xl mb-2">🍽️</div>
                    <div className="text-sm">No Image Available</div>
                  </div>
                </div>
              )}
              
              {/* Labels */}
              {item.label && (
                <div className="absolute top-4 left-4 bg-primary text-white px-3 py-1 rounded-full text-xs font-menu font-medium shadow-md flex items-center">
                  <Flame className="h-3 w-3 mr-1" />
                  {item.label.toUpperCase()}
                </div>
              )}
              
              {/* Price badge */}
              <div className="absolute bottom-4 right-4 bg-card/80 backdrop-blur-sm text-primary px-3 py-1 rounded-full text-sm font-bold shadow-md">
                ${item.price.toFixed(2)}
              </div>
            </div>
            
            {/* Description */}
            <div className="mb-6">
              <h3 className="font-heading text-xl text-foreground mb-2">{item.name}</h3>
              <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
            </div>
            
            {/* Details section */}
            <div className="space-y-5">
              <div>
                <h4 className="font-medium mb-2">Ingredients</h4>
                <p className="text-sm text-muted-foreground">
                  {item.ingredients || 'Proprietary blend of high-quality ingredients carefully selected to ensure the perfect balance of flavors.'}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Preparation</h4>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary mr-2" />
                  <span>Ready in approximately {prepTime} minutes</span>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Allergens</h4>
                <p className="text-sm text-muted-foreground">
                  {item.allergens || 'May contain wheat, dairy, soy, and tree nuts. Please inform our staff of any allergies before ordering.'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Add to cart section - fixed to bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border p-4 flex justify-between items-center">
            <div className="flex items-center bg-muted rounded-lg">
              <Button 
                variant="ghost"
                size="sm"
                className="h-9 w-9 rounded-full text-foreground hover:text-primary"
                onClick={(e) => decrementQuantity(e)}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-9 text-center text-sm font-medium">{quantity}</span>
              <Button 
                variant="ghost"
                size="sm"
                className="h-9 w-9 rounded-full text-foreground hover:text-primary"
                onClick={(e) => incrementQuantity(e)}
                disabled={quantity >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <Button 
              className="bg-primary hover:bg-primary/90 text-white font-menu"
              onClick={() => {
                handleAddToCart();
                setIsModalOpen(false);
              }}
              disabled={isAddingToCart}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              ADD TO CART - ${(item.price * quantity).toFixed(2)}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // If mobile, use a horizontal layout that's clickable
  if (isMobile) {
    return (
      <>
        <div 
          className="bg-card rounded-xl border border-border overflow-hidden menu-item-transition h-32 sm:h-36 cursor-pointer active:scale-[0.99] transition-transform"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={openModal}
        >
          <div className="flex h-full">
            {/* Left side - Image only if available */}
            {item.image && (
              <div className="relative w-1/3 sm:w-2/5 h-full">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className={`w-full h-full object-cover transition-transform duration-500 ${isHovering ? 'scale-110' : 'scale-100'}`}
                  onError={(e) => {
                    // Hide the image container if image fails to load
                    const target = e.target as HTMLImageElement;
                    const container = target.parentElement;
                    if (container) {
                      container.style.display = 'none';
                    }
                  }}
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
            )}
            
            {/* Right side - Content */}
            <div className={`flex-1 p-3 flex flex-col justify-between relative ${!item.image ? 'w-full' : ''}`}>
              {/* Top section - Title and rating */}
              <div>
                <div className="flex justify-between items-start mb-1.5">
                  <h3 className="font-heading text-base sm:text-lg text-foreground pr-16 line-clamp-1">{item.name}</h3>
                  
                  {/* Prep time badge - top right (only show if prepTime exists) */}
                  {item.prepTime && (
                    <div className="absolute top-3 right-3 bg-muted/80 text-foreground px-2 py-0.5 rounded-full text-[10px] flex items-center">
                      <Clock className="h-2.5 w-2.5 text-primary mr-0.5" />
                      {prepTime} min
                    </div>
                  )}
                </div>
                
                {/* Description */}
                <p className="text-muted-foreground text-xs line-clamp-2 mb-1.5">{item.description}</p>
              </div>
              
              {/* Bottom section */}
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
                </div>
                
                {/* Quantity selector or Add button */}
                {isInCart ? (
                  <div 
                    className="flex items-center bg-muted rounded-lg h-7"
                    onClick={(e) => e.stopPropagation()} // Prevent opening the modal
                  >
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 rounded-full text-foreground hover:text-primary hover:bg-transparent p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        const cartItem = getCartItem();
                        if (cartItem) {
                          if (cartQuantity <= 1) {
                            // Remove item completely if quantity will be 0
                            removeFromCart(cartItem.id);
                          } else {
                            // Otherwise update the quantity
                            updateCartItemQuantity(cartItem.id, cartQuantity - 1);
                          }
                        }
                      }}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-5 text-center text-xs font-medium">{cartQuantity}</span>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 rounded-full text-foreground hover:text-primary hover:bg-transparent p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        const cartItem = getCartItem();
                        if (cartItem) {
                          updateCartItemQuantity(cartItem.id, Math.min(10, cartQuantity + 1));
                        }
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-white font-menu h-7 px-3 text-xs"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent opening the modal
                      addToCart({
                        id: Date.now(), // unique ID for cart item
                        menuItemId: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: 1,
                        image: item.image,
                        prepTime: item.prepTime || 15
                      });
                    }}
                    disabled={isAddingToCart}
                  >
                    <ShoppingBag className="h-3 w-3 mr-1" />
                    ADD
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Item detail modal */}
        <MenuItemDetailModal />
      </>
    );
  }

  // Desktop layout with clickable card
  return (
    <>
      <div 
        className="bg-card rounded-xl border border-border overflow-hidden menu-item-transition cursor-pointer active:scale-[0.99] transition-transform"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={openModal}
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
            <span className="text-muted-foreground">({item.reviewCount || '42'})</span>
          </div>
        </div>
        
        <div className="p-5">
          <div className="flex justify-between items-start">
            <h3 className="font-heading text-xl text-foreground">{item.name}</h3>
            <span className="font-bold text-primary text-xl">${item.price.toFixed(2)}</span>
          </div>
          
          <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{item.description}</p>
          
          {/* Add to cart controls */}
          <div className="flex justify-between items-center mt-5">
            <div className="flex items-center bg-muted rounded-lg">
              <Button 
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-full text-foreground hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent opening the modal
                  decrementQuantity(e);
                }}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center text-sm font-medium">{quantity}</span>
              <Button 
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-full text-foreground hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent opening the modal
                  incrementQuantity(e);
                }}
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
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent opening the modal
                      handleAddToCart(e);
                    }}
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
      
      {/* Item detail modal */}
      <MenuItemDetailModal />
    </>
  );
}