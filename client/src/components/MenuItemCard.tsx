import { useState, useEffect } from "react";
import { MenuItem } from "@shared/schema";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Minus, ShoppingBag, Flame, Clock, ChevronDown, 
  Info, X, Heart, Share, MessageSquare
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

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    
    try {
      await addToCart({
        id: Date.now(), // Temporary ID
        name: item.name,
        price: item.price,
        quantity: quantity,
        image: item.image || '',
        menuItemId: item.id,
        prepTime: item.prepTime || 15
      });
      
      toast({
        title: "Added to cart",
        description: `${item.name} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsAddingToCart(false);
  };

  const handleUpdateQuantity = (newQuantity: number) => {
    const cartItem = getCartItem();
    if (cartItem && newQuantity > 0) {
      updateCartItemQuantity(cartItem.id, newQuantity);
    } else if (cartItem && newQuantity === 0) {
      removeFromCart(cartItem.id);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  // Use the item's prep time or calculate a fixed one based on item ID to avoid fluctuation
  const prepTime = item.prepTime || (10 + (item.id % 16)); // Fixed time based on item ID

  return (
    <>
      <motion.div
        className="bg-card text-card-foreground rounded-xl shadow-md overflow-hidden border border-border cursor-pointer group relative"
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onHoverStart={() => setIsHovering(true)}
        onHoverEnd={() => setIsHovering(false)}
        onClick={openModal}
      >
        {/* Card Content */}
        <div className="relative">
          {/* Image container */}
          {item.image && (
            <div className="relative h-48 overflow-hidden">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              
              {/* Featured badge */}
              {item.featured && (
                <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                  Featured
                </div>
              )}
              
              {/* Label badge */}
              {item.label && (
                <div className="absolute top-3 left-3 bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs font-medium">
                  {item.label}
                </div>
              )}

              {/* Prep Time badge */}
              <div className="absolute bottom-3 left-3 bg-card/80 backdrop-blur-sm text-foreground px-3 py-1 rounded-full text-xs font-medium shadow-md flex items-center">
                <Clock className="h-3 w-3 text-primary mr-1" />
                <span>{prepTime} min</span>
              </div>
            </div>
          )}
          
          <div className="p-5">
            <div className="flex justify-between items-start">
              <h3 className="font-heading text-xl text-foreground">{item.name}</h3>
              <span className="font-bold text-primary text-xl">${item.price.toFixed(2)}</span>
            </div>
            
            <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{item.description}</p>
            
            <div className="mt-4 flex justify-between items-center">
              {/* Prep Time */}
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                <span>{prepTime} min</span>
              </div>
              
              {/* Quantity selector or Add button */}
              {isInCart ? (
                <div 
                  className="flex items-center bg-muted rounded-lg h-8"
                  onClick={(e) => e.stopPropagation()} // Prevent opening the modal
                >
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-full text-foreground hover:text-primary hover:bg-transparent p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateQuantity(cartQuantity - 1);
                    }}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="mx-3 text-sm font-medium min-w-[20px] text-center">
                    {cartQuantity}
                  </span>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-full text-foreground hover:text-primary hover:bg-transparent p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateQuantity(cartQuantity + 1);
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 px-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart();
                  }}
                  disabled={isAddingToCart}
                >
                  {isAddingToCart ? (
                    <span className="flex items-center">
                      <div className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-1" />
                      Adding...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </span>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] max-h-[900px] p-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="hover:bg-muted rounded-full w-10 h-10 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
            <h3 className="font-heading text-lg flex-1 truncate">{item.name}</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-primary mr-1" />
              <span>{prepTime} min</span>
            </div>
          </div>
          
          {/* Content area */}
          <div className="px-4 pt-4 pb-24 h-[calc(75vh-58px-68px)] overflow-y-auto no-scrollbar">
            {/* Image section - only render if image exists and loads successfully */}
            {item.image && (
              <div className="relative w-full h-64 rounded-lg overflow-hidden mb-6">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  {item.featured && (
                    <div className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                      Featured
                    </div>
                  )}
                  {item.label && (
                    <div className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs font-medium">
                      {item.label}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Item details */}
            <div className="space-y-6">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-heading text-foreground mb-2">{item.name}</h2>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-3xl font-bold text-primary">${item.price.toFixed(2)}</div>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{prepTime} min prep</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional details tabs if available */}
              {(item.ingredients || item.calories || item.allergens || (item.dietaryInfo && item.dietaryInfo.length > 0)) && (
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-1">
                    <TabsTrigger value="details">Details</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4 mt-4">
                    {item.ingredients && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Ingredients</h4>
                        <p className="text-muted-foreground text-sm">{item.ingredients}</p>
                      </div>
                    )}
                    
                    {item.calories && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Calories</h4>
                        <p className="text-muted-foreground text-sm">{item.calories}</p>
                      </div>
                    )}
                    
                    {item.allergens && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Allergens</h4>
                        <p className="text-muted-foreground text-sm">{item.allergens}</p>
                      </div>
                    )}
                    
                    {item.dietaryInfo && item.dietaryInfo.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Dietary Information</h4>
                        <div className="flex flex-wrap gap-2">
                          {item.dietaryInfo.map((info, index) => (
                            <span key={index} className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs">
                              {info}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>

          {/* Bottom action bar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-10 w-10 rounded-full"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="mx-4 text-lg font-medium min-w-[40px] text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-10 w-10 rounded-full"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="text-lg font-bold text-primary">
                  ${(item.price * quantity).toFixed(2)}
                </div>
              </div>
              
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-12"
                onClick={handleAddToCart}
                disabled={isAddingToCart}
              >
                {isAddingToCart ? (
                  <span className="flex items-center">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    Adding to Cart...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Add to Cart
                  </span>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}