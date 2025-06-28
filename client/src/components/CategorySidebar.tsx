import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MenuCategory, CartItem, MenuItemOptionGroup, MenuItemOption } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Flame, ChevronRight, Plus, Minus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    soldOut: boolean;
    isHot: boolean;
    isBestSeller: boolean;
    label: string | null;
    prepTime: number | null;
    hasOptions: boolean;
  };
}

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
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [showCustomization, setShowCustomization] = useState(false);
  const [selectedSpecialItem, setSelectedSpecialItem] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState<{[groupId: number]: number[]}>({});
  const [customizationQuantity, setCustomizationQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Fetch special offer data dynamically
  const { data: specialOffer } = useQuery<SpecialOffer | null>({
    queryKey: ['/api/special-offer'],
    refetchInterval: 15000, // Refetch every 15 seconds for fresh special offers
  });

  return (
    <aside className="w-full">
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
        
        {specialOffer && (
          <div className="mt-4 bg-gradient-to-br from-primary/20 to-accent/20 p-6 rounded-2xl border border-primary/10">
            <div className="flex items-center mb-3">
              <Flame className="h-5 w-5 text-primary mr-2" />
              <h3 className="font-heading text-xl text-primary">TODAY'S SPECIAL</h3>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <div className="bg-primary text-white text-xs px-3 py-1 rounded-full font-menu w-fit mb-3">
                  {specialOffer.discountType === 'percentage' 
                    ? `${specialOffer.discountValue}% OFF`
                    : `€${specialOffer.discountValue.toFixed(2)} OFF`
                  }
                </div>
                {specialOffer.menuItem.image && (
                  <div className="w-full h-48 overflow-hidden rounded-xl food-3d-effect">
                    <img 
                      src={specialOffer.menuItem.image} 
                      alt={specialOffer.menuItem.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const container = target.parentElement;
                        if (container) {
                          container.style.display = 'none';
                        }
                      }}
                    />
                  </div>
                )}
              </div>
              <h4 className="font-heading text-xl text-foreground">{specialOffer.menuItem.name}</h4>
              <p className="text-sm text-muted-foreground">{specialOffer.menuItem.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-primary">€{specialOffer.specialPrice.toFixed(2)}</span>
                <span className="text-sm line-through text-muted-foreground">€{specialOffer.originalPrice.toFixed(2)}</span>
              </div>
              <button 
                className={`w-full py-3 font-menu rounded-lg transition-colors ${
                  specialOffer.menuItem.soldOut 
                    ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
                disabled={specialOffer.menuItem.soldOut}
                onClick={async () => {
                  if (specialOffer.menuItem.soldOut) return;
                  
                  // Check if item has options
                  if (specialOffer.menuItem.hasOptions) {
                    // Fetch options and show customization dialog
                    try {
                      const response = await fetch(`/api/menu-items/${specialOffer.menuItem.id}/option-groups`);
                      const optionGroups = await response.json();
                      
                      if (optionGroups && optionGroups.length > 0) {
                        setSelectedSpecialItem({
                          ...specialOffer.menuItem,
                          specialPrice: specialOffer.specialPrice,
                          optionGroups
                        });
                        setShowCustomization(true);
                        return;
                      }
                    } catch (error) {
                      console.error('Failed to fetch options:', error);
                    }
                  }
                  
                  // Direct add to cart for items without options
                  const cartItem: CartItem = {
                    id: Date.now(),
                    menuItemId: specialOffer.menuItem.id,
                    name: specialOffer.menuItem.name,
                    price: specialOffer.specialPrice,
                    quantity: 1,
                    image: specialOffer.menuItem.image || ''
                  };
                  addToCart(cartItem);
                  toast({
                    title: "Added to cart",
                    description: `${specialOffer.menuItem.name} has been added to your cart at special price!`
                  });
                }}
              >
                {specialOffer.menuItem.soldOut ? 'SOLD OUT' : 'ADD TO CART'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customization Dialog for Today's Special */}
      <Dialog open={showCustomization} onOpenChange={setShowCustomization}>
        <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Customize {selectedSpecialItem?.name}</DialogTitle>
            <DialogDescription>
              Choose your options to customize this special offer
            </DialogDescription>
          </DialogHeader>
          
          {selectedSpecialItem && (
            <div className="space-y-6 py-4">
              {/* Special Price Display */}
              <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Special Price:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">€{selectedSpecialItem.specialPrice?.toFixed(2)}</span>
                    <span className="text-sm line-through text-muted-foreground">€{selectedSpecialItem.price?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

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
              {selectedSpecialItem.optionGroups?.map((group: MenuItemOptionGroup & { options: MenuItemOption[] }) => (
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
                              newSelections = current.filter(id => id !== option.id);
                            } else if (canSelect) {
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
                      let total = (selectedSpecialItem.specialPrice || selectedSpecialItem.price) * customizationQuantity;
                      if (selectedSpecialItem.optionGroups) {
                        for (const [groupId, optionIds] of Object.entries(selectedOptions)) {
                          const group = selectedSpecialItem.optionGroups.find((g: any) => g.id === parseInt(groupId));
                          if (group) {
                            for (const optionId of optionIds) {
                              const option = group.options.find((o: any) => o.id === optionId);
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
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                setShowCustomization(false);
                setSelectedSpecialItem(null);
                setSelectedOptions({});
                setCustomizationQuantity(1);
              }}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={async () => {
                if (!selectedSpecialItem) return;
                
                // Validate required groups
                if (selectedSpecialItem.optionGroups) {
                  const missingRequired = selectedSpecialItem.optionGroups.find((group: any) => 
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
                
                setIsAddingToCart(true);
                
                try {
                  // Calculate price with option modifiers
                  let finalPrice = selectedSpecialItem.specialPrice || selectedSpecialItem.price;
                  let optionDetails: any[] = [];
                  
                  if (selectedSpecialItem.optionGroups) {
                    for (const [groupId, optionIds] of Object.entries(selectedOptions)) {
                      const group = selectedSpecialItem.optionGroups.find((g: any) => g.id === parseInt(groupId));
                      if (group) {
                        for (const optionId of optionIds) {
                          const option = group.options.find((o: any) => o.id === optionId);
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
                    id: Date.now(),
                    name: selectedSpecialItem.name,
                    price: finalPrice,
                    quantity: customizationQuantity,
                    image: selectedSpecialItem.image || '',
                    menuItemId: selectedSpecialItem.id,
                    prepTime: selectedSpecialItem.prepTime || 15,
                    customizations: optionDetails.length > 0 ? JSON.stringify(optionDetails) : undefined
                  });
                  
                  toast({
                    title: "Added to cart",
                    description: `${selectedSpecialItem.name} has been added to your cart at special price!`,
                  });
                  
                  setShowCustomization(false);
                  setSelectedSpecialItem(null);
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
              }}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? (
                <span className="flex items-center">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Adding...
                </span>
              ) : (
                `Add to Cart • €${(() => {
                  if (!selectedSpecialItem) return '0.00';
                  let total = (selectedSpecialItem.specialPrice || selectedSpecialItem.price) * customizationQuantity;
                  if (selectedSpecialItem.optionGroups) {
                    for (const [groupId, optionIds] of Object.entries(selectedOptions)) {
                      const group = selectedSpecialItem.optionGroups.find((g: any) => g.id === parseInt(groupId));
                      if (group) {
                        for (const optionId of optionIds) {
                          const option = group.options.find((o: any) => o.id === optionId);
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
    </aside>
  );
}
