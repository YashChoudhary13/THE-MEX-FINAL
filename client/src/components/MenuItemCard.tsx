import { useState } from "react";
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
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Use mobile hook to detect screen size
  const isMobile = useIsMobile();

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

  // Generate a random prep time between 10-25 minutes for the demo
  const prepTime = Math.floor(Math.random() * 16) + 10;

  // Menu Item Detail Modal
  const MenuItemDetailModal = () => (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px] p-0 overflow-hidden">
        <div className="flex h-full flex-col md:flex-row">
          {/* Left side - Image (larger on desktop) */}
          <div className="relative w-full md:w-1/2 h-60 md:h-auto">
            <img 
              src={item.image} 
              alt={item.name} 
              className="w-full h-full object-cover"
            />
            
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
            
            {/* Action buttons */}
            <div className="absolute bottom-4 left-4 flex space-x-2">
              <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card">
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card">
                <Share className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Right side - Content */}
          <div className="flex-1 p-6 flex flex-col h-full overflow-auto">
            <DialogHeader className="mb-4">
              <div className="flex justify-between items-start mb-1">
                <DialogTitle className="text-2xl font-heading">{item.name}</DialogTitle>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 text-primary fill-primary" />
                  <span>{rating.toFixed(1)}</span>
                  <span>({item.reviewCount || '42'})</span>
                </div>
              </div>
              <DialogDescription className="text-sm text-muted-foreground">
                {item.description}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="details" className="mt-4 flex-1">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="border-t pt-4 mt-2">
                <div className="space-y-4">
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
                    <h4 className="font-medium mb-2">Special Instructions</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.specialInstructions || 'Our chefs recommend enjoying this dish fresh while it\'s hot. Available for dine-in, takeout, or delivery.'}
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="nutrition" className="border-t pt-4 mt-2">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <h5 className="text-xs text-muted-foreground mb-1">Calories</h5>
                      <p className="font-medium">{item.calories || '650'} kcal</p>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <h5 className="text-xs text-muted-foreground mb-1">Protein</h5>
                      <p className="font-medium">{item.protein || '28'} g</p>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <h5 className="text-xs text-muted-foreground mb-1">Carbs</h5>
                      <p className="font-medium">{item.carbs || '45'} g</p>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <h5 className="text-xs text-muted-foreground mb-1">Fat</h5>
                      <p className="font-medium">{item.fat || '22'} g</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Allergens</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.allergens || 'May contain wheat, dairy, soy, and tree nuts. Please inform our staff of any allergies before ordering.'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Dietary Information</h4>
                    <div className="flex flex-wrap gap-2">
                      {item.isVegetarian && (
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">Vegetarian</span>
                      )}
                      {item.isVegan && (
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">Vegan</span>
                      )}
                      {item.isGlutenFree && (
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">Gluten-Free</span>
                      )}
                      {!item.isVegetarian && !item.isVegan && !item.isGlutenFree && (
                        <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs">Standard Menu Item</span>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="border-t pt-4 mt-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {stars.map((type, index) => (
                          <span key={index}>
                            {type === "full" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                              </svg>
                            )}
                            {type === "half" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                              </svg>
                            )}
                            {type === "empty" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground/30" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                              </svg>
                            )}
                          </span>
                        ))}
                      </div>
                      <span className="text-muted-foreground">Based on {item.reviewCount || '42'} reviews</span>
                    </div>
                    <Button size="sm" variant="outline" className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>Write a Review</span>
                    </Button>
                  </div>
                  
                  {/* Sample reviews */}
                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/10 h-8 w-8 rounded-full flex items-center justify-center text-primary font-medium">JD</div>
                          <div>
                            <p className="font-medium text-sm">John Doe</p>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className={`h-3 w-3 ${star <= 5 ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">2 days ago</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        "Absolutely delicious! The flavor was incredible and it arrived hot and fresh. Definitely ordering again."
                      </p>
                    </div>
                    
                    <div className="border-b pb-4">
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/10 h-8 w-8 rounded-full flex items-center justify-center text-primary font-medium">SW</div>
                          <div>
                            <p className="font-medium text-sm">Sarah Wilson</p>
                            <div className="flex">
                              {[1, 2, 3, 4].map((star) => (
                                <Star key={star} className={`h-3 w-3 ${star <= 4 ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                              ))}
                              <Star className="h-3 w-3 text-muted-foreground/30" />
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">1 week ago</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        "Very good, but I would have liked more sauce. The portion size was generous though!"
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Add to cart section */}
            <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
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
                onClick={(e) => handleAddToCart(e)}
                disabled={isAddingToCart}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                ADD TO CART - ${(item.price * quantity).toFixed(2)}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

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
                
                {/* Add to cart button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        className="bg-primary hover:bg-primary/90 text-white font-menu h-7 px-3 text-xs"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent opening the modal
                          handleAddToCart(e);
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