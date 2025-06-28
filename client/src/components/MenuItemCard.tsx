import { useState, useEffect } from "react";
import { MenuItem, MenuItemOptionGroup, MenuItemOption } from "@shared/schema";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, Minus, ShoppingBag, Flame, Clock, ChevronDown, 
  Info, X, Heart, Share, MessageSquare, Settings
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

interface SpecialOffer {
  id: number;
  menuItemId: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  originalPrice: number;
  specialPrice: number;
  active: boolean;
  startDate: string;
  endDate: string | null;
  menuItem: {
    id: number;
    name: string;
    description: string;
    price: number;
    categoryId: number;
    image: string | null;
    featured: boolean;
    label: string | null;
    prepTime: number | null;
  };
}

export default function MenuItemCard({ item }: MenuItemCardProps) {
  // Check store status to disable adding items when closed
  const { data: storeOpen = true } = useQuery({
    queryKey: ['/api/system-settings/store-open'],
    queryFn: async () => {
      const response = await fetch('/api/system-settings/store-open');
      const data = await response.json();
      return data.storeOpen;
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Use the item prop directly - the parent components handle cache invalidation
  const currentItem = item;

  const { addToCart, cart, updateCartItemQuantity, removeFromCart } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(0);
  const [showCustomization, setShowCustomization] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<{[groupId: number]: number[]}>({});
  const [customizationQuantity, setCustomizationQuantity] = useState(1);
  
  // Use mobile hook to detect screen size
  const isMobile = useIsMobile();
  

  
  // Fetch current special offer to check if this item has special pricing
  const { data: specialOffer } = useQuery<SpecialOffer>({
    queryKey: ["/api/special-offer"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Calculate pricing based on special offer using current item data
  const isOnSpecial = specialOffer && specialOffer.menuItemId === currentItem.id && specialOffer.active;
  const displayPrice = isOnSpecial ? specialOffer.specialPrice : currentItem.price;
  const originalPrice = currentItem.price;
  const savings = isOnSpecial ? originalPrice - displayPrice : 0;


  
  // Find the cart item for this menu item
  const getCartItem = () => {
    return cart.find(cartItem => cartItem.menuItemId === currentItem.id);
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
  }, [cart, currentItem.id]);

  // Fetch menu item options
  const { data: optionGroups } = useQuery({
    queryKey: ['/api/menu-items', currentItem.id, 'option-groups'],
    queryFn: () => fetch(`/api/menu-items/${currentItem.id}/option-groups`).then(res => res.json()) as Promise<(MenuItemOptionGroup & { options: MenuItemOption[] })[]>,
    enabled: currentItem.hasOptions
  });

  const handleAddToCart = async () => {
    // Check if item is sold out
    if (currentItem.soldOut) {
      toast({
        title: "Item unavailable",
        description: `${currentItem.name} is currently sold out.`,
        variant: "destructive",
      });
      return;
    }

    // If item has options, show customization dialog
    if (currentItem.hasOptions && optionGroups && optionGroups.length > 0) {
      setShowCustomization(true);
      return;
    }

    // Direct add to cart for items without options
    await addItemToCart();
  };

  const addItemToCart = async (customOptions?: {[groupId: number]: number[]}, qty: number = 1) => {

    setIsAddingToCart(true);
    
    try {
      // Calculate price with option modifiers
      let finalPrice = displayPrice;
      let optionDetails: any[] = [];
      
      if (customOptions && optionGroups) {
        for (const [groupId, optionIds] of Object.entries(customOptions)) {
          const group = optionGroups.find(g => g.id === parseInt(groupId));
          if (group) {
            for (const optionId of optionIds) {
              const option = group.options.find(o => o.id === optionId);
              if (option) {
                finalPrice += option.priceModifier;
                optionDetails.push({
                  groupName: group.name,
                  optionName: option.name,
                  priceModifier: option.priceModifier
                });
              }
            }
          }
        }
      }

      await addToCart({
        id: Date.now(), // Temporary ID
        name: currentItem.name,
        price: finalPrice,
        quantity: qty,
        image: currentItem.image || '',
        menuItemId: currentItem.id,
        prepTime: currentItem.prepTime || 15,
        customizations: optionDetails.length > 0 ? JSON.stringify(optionDetails) : undefined
      });
      
      toast({
        title: "Added to cart",
        description: `${currentItem.name} has been added to your cart.`,
      });
      
      setShowCustomization(false);
      setSelectedOptions({});
      setCustomizationQuantity(1);
    
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

  // Calculate preparation time using currentItem
  const prepTime = currentItem.prepTime || 15;



  return (
    <>
      <motion.div
        className={`bg-card text-card-foreground rounded-xl shadow-md overflow-hidden border border-border cursor-pointer group relative ${
          currentItem.soldOut ? 'opacity-75 grayscale' : ''
        }`}
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
          {currentItem.image && (
            <div className="relative h-48 overflow-hidden">
              <img
                src={currentItem.image}
                alt={currentItem.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const container = target.parentElement;
                  if (container) {
                    container.style.display = 'none';
                  }
                }}
              />
              
              {/* Status badges */}
              <div className="absolute top-3 right-3 flex flex-col gap-1">
                {currentItem.soldOut && (
                  <div className="bg-destructive text-destructive-foreground px-2 py-1 rounded-full text-xs font-medium">
                    Sold Out
                  </div>
                )}
                {isOnSpecial && !currentItem.soldOut && (
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    SPECIAL
                  </div>
                )}
                {currentItem.featured && !currentItem.soldOut && !isOnSpecial && (
                  <div className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                    Featured
                  </div>
                )}
                {currentItem.isBestSeller && !currentItem.soldOut && (
                  <div className="bg-yellow-500 text-yellow-50 px-2 py-1 rounded-full text-xs font-medium">
                    Best Seller
                  </div>
                )}
                {currentItem.isHot && !currentItem.soldOut && (
                  <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    Hot 🌶️
                  </div>
                )}
              </div>
              
              {/* Label badge */}
              {currentItem.label && (
                <div className="absolute top-3 left-3 bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs font-medium">
                  {currentItem.label}
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
              <h3 className="font-heading text-xl text-foreground">{currentItem.name}</h3>
              <div className="text-right">
                {isOnSpecial ? (
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-primary text-xl">€{displayPrice.toFixed(2)}</span>
                    <span className="text-sm line-through text-muted-foreground">€{originalPrice.toFixed(2)}</span>
                  </div>
                ) : (
                  <span className="font-bold text-primary text-xl">€{displayPrice.toFixed(2)}</span>
                )}
              </div>
            </div>
            
            <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{currentItem.description}</p>
            
            <div className="mt-4 flex justify-between items-center">
              {/* Prep Time */}
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                <span>{prepTime} min</span>
              </div>
              
              {/* Quantity selector or Add button */}
              {currentItem.soldOut ? (
                <div className="bg-destructive/10 text-destructive px-3 py-1 rounded-lg text-sm font-medium">
                  Sold Out
                </div>
              ) : isInCart ? (
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
            <h3 className="font-heading text-lg flex-1 truncate">{currentItem.name}</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-primary mr-1" />
              <span>{prepTime} min</span>
            </div>
          </div>
          
          {/* Content area */}
          <div className="px-4 pt-4 pb-24 h-[calc(75vh-58px-68px)] overflow-y-auto no-scrollbar">
            {/* Image section - only render if image exists and loads successfully */}
            {currentItem.image && (
              <div className="relative w-full h-64 rounded-lg overflow-hidden mb-6">
                <img
                  src={currentItem.image}
                  alt={currentItem.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  {currentItem.featured && (
                    <div className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                      Featured
                    </div>
                  )}
                  {currentItem.label && (
                    <div className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs font-medium">
                      {currentItem.label}
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
                    <h2 className="text-2xl font-heading text-foreground mb-2">{currentItem.name}</h2>
                    <p className="text-muted-foreground leading-relaxed">{currentItem.description}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-3xl font-bold text-primary">€{displayPrice.toFixed(2)}</div>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{prepTime} min prep</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional details tabs if available */}
              {(currentItem.ingredients || currentItem.calories || currentItem.allergens || (currentItem.dietaryInfo && currentItem.dietaryInfo.length > 0)) && (
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-1">
                    <TabsTrigger value="details">Details</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4 mt-4">
                    {currentItem.ingredients && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Ingredients</h4>
                        <p className="text-muted-foreground text-sm">{currentItem.ingredients}</p>
                      </div>
                    )}
                    
                    {currentItem.calories && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Calories</h4>
                        <p className="text-muted-foreground text-sm">{currentItem.calories}</p>
                      </div>
                    )}
                    
                    {currentItem.allergens && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Allergens</h4>
                        <p className="text-muted-foreground text-sm">{currentItem.allergens}</p>
                      </div>
                    )}
                    
                    {currentItem.dietaryInfo && currentItem.dietaryInfo.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Dietary Information</h4>
                        <div className="flex flex-wrap gap-2">
                          {currentItem.dietaryInfo.map((info, index) => (
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
                  €{(displayPrice * quantity).toFixed(2)}
                </div>
              </div>
              
              <Button
                className={`px-8 h-12 ${!storeOpen ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}
                onClick={storeOpen ? handleAddToCart : () => {
                  toast({
                    title: "Store Closed",
                    description: "We're not accepting orders at the moment. Please check back later.",
                    variant: "destructive",
                  });
                }}
                disabled={isAddingToCart || !storeOpen}
              >
                {!storeOpen ? (
                  <span className="flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    Store Closed
                  </span>
                ) : isAddingToCart ? (
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

      {/* Customization Dialog */}
      <Dialog open={showCustomization} onOpenChange={setShowCustomization}>
        <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Customize {item.name}</DialogTitle>
            <DialogDescription>
              Choose your options to customize this item
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Quantity Selection */}
            <div className="flex items-center justify-between">
              <span className="font-medium">Quantity</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCustomizationQuantity(Math.max(1, customizationQuantity - 1))}
                  disabled={customizationQuantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{customizationQuantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCustomizationQuantity(customizationQuantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Option Groups */}
            {optionGroups?.map((group) => (
              <div key={group.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground">
                    {group.name}
                    {group.required && <span className="text-destructive ml-1">*</span>}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {group.maxSelections === 1 ? 'Choose one' : `Choose up to ${group.maxSelections}`}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {group.options.map((option) => {
                    const isSelected = selectedOptions[group.id]?.includes(option.id) || false;
                    const currentSelections = selectedOptions[group.id]?.length || 0;
                    const canSelect = !isSelected && currentSelections < group.maxSelections;
                    
                    return (
                      <div
                        key={option.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : canSelect 
                              ? 'border-border hover:border-primary/50' 
                              : 'border-border opacity-50 cursor-not-allowed'
                        }`}
                        onClick={() => {
                          if (!option.available) return;
                          
                          const current = selectedOptions[group.id] || [];
                          let newSelections;
                          
                          if (isSelected) {
                            // Remove selection
                            newSelections = current.filter(id => id !== option.id);
                          } else if (canSelect) {
                            // Add selection
                            if (group.maxSelections === 1) {
                              newSelections = [option.id];
                            } else {
                              newSelections = [...current, option.id];
                            }
                          } else {
                            return;
                          }
                          
                          setSelectedOptions(prev => ({
                            ...prev,
                            [group.id]: newSelections
                          }));
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 border rounded ${
                              group.maxSelections === 1 ? 'rounded-full' : 'rounded-sm'
                            } ${
                              isSelected ? 'bg-primary border-primary' : 'border-border'
                            } flex items-center justify-center`}>
                              {isSelected && (
                                <div className={`${
                                  group.maxSelections === 1 ? 'w-2 h-2 bg-white rounded-full' : 'text-white text-xs'
                                }`}>
                                  {group.maxSelections === 1 ? '' : '✓'}
                                </div>
                              )}
                            </div>
                            <span className={`${!option.available ? 'text-muted-foreground line-through' : ''}`}>
                              {option.name}
                            </span>
                            {!option.available && (
                              <span className="text-xs text-muted-foreground">(Unavailable)</span>
                            )}
                          </div>
                          {option.priceModifier !== 0 && (
                            <span className="text-sm text-primary font-medium">
                              {option.priceModifier > 0 ? '+' : ''}€{option.priceModifier.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Price Summary */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-medium">
                <span>Total</span>
                <span className="text-primary">
                  €{(() => {
                    let total = displayPrice * customizationQuantity;
                    if (optionGroups) {
                      for (const [groupId, optionIds] of Object.entries(selectedOptions)) {
                        const group = optionGroups.find(g => g.id === parseInt(groupId));
                        if (group) {
                          for (const optionId of optionIds) {
                            const option = group.options.find(o => o.id === optionId);
                            if (option) {
                              total += option.priceModifier * customizationQuantity;
                            }
                          }
                        }
                      }
                    }
                    return total.toFixed(2);
                  })()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowCustomization(false)}
            >
              Cancel
            </Button>
            <Button 
              className={`flex-1 ${!storeOpen ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`}
              onClick={() => {
                // Validate required groups
                if (optionGroups) {
                  const missingRequired = optionGroups.find(group => 
                    group.required && (!selectedOptions[group.id] || selectedOptions[group.id].length === 0)
                  );
                  
                  if (missingRequired) {
                    toast({
                      title: "Required selection missing",
                      description: `Please select an option for ${missingRequired.name}`,
                      variant: "destructive",
                    });
                    return;
                  }
                }
                
                if (storeOpen) {
                  addItemToCart(selectedOptions, customizationQuantity);
                } else {
                  toast({
                    title: "Store Closed",
                    description: "We're not accepting orders at the moment. Please check back later.",
                    variant: "destructive",
                  });
                }
              }}
              disabled={isAddingToCart || !storeOpen}
            >
              {!storeOpen ? (
                <span className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Store Closed
                </span>
              ) : isAddingToCart ? (
                <span className="flex items-center">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Adding...
                </span>
              ) : (
                `Add to Cart • €${(() => {
                  let total = displayPrice * customizationQuantity;
                  if (optionGroups) {
                    for (const [groupId, optionIds] of Object.entries(selectedOptions)) {
                      const group = optionGroups.find(g => g.id === parseInt(groupId));
                      if (group) {
                        for (const optionId of optionIds) {
                          const option = group.options.find(o => o.id === optionId);
                          if (option) {
                            total += option.priceModifier * customizationQuantity;
                          }
                        }
                      }
                    }
                  }
                  return total.toFixed(2);
                })()}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
