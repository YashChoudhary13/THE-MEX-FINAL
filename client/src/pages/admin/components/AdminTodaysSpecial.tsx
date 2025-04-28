import { useState } from "react";
import { MenuItem } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface AdminTodaysSpecialProps {
  menuItems: MenuItem[];
  isLoading: boolean;
}

export default function AdminTodaysSpecial({ menuItems, isLoading }: AdminTodaysSpecialProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [discountType, setDiscountType] = useState<string>("percentage");
  const [discountValue, setDiscountValue] = useState<string>("15");
  
  // For demo purposes, we'll hard-code the special
  const specialItem = {
    id: 1,
    name: "Double Smash Burger",
    price: 14.99,
    originalPrice: 17.99,
    image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800",
    description: "Two smashed beef patties, melted cheese, caramelized onions, special sauce, crispy pickles"
  };
  
  const handleUpdateSpecial = () => {
    // In a real app, we would send the data to the backend
    toast({
      title: "Special Updated",
      description: "The special offer has been updated successfully.",
    });
    setIsDialogOpen(false);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Special Offer</CardTitle>
          <CardDescription>The currently highlighted special on your menu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="col-span-1">
              <div className="aspect-square rounded-xl border overflow-hidden bg-muted relative">
                <img 
                  src={specialItem.image} 
                  alt={specialItem.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-primary text-white text-sm font-bold px-3 py-1 rounded-lg">
                  SPECIAL OFFER
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2 flex flex-col">
              <h3 className="text-2xl font-heading mb-2">{specialItem.name}</h3>
              <p className="text-muted-foreground mb-4">{specialItem.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Special Price</h4>
                  <p className="text-2xl font-bold text-primary">${specialItem.price.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Original Price</h4>
                  <p className="text-xl line-through text-muted-foreground">${specialItem.originalPrice.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md mb-4">
                <p><strong>Discount:</strong> ${(specialItem.originalPrice - specialItem.price).toFixed(2)} off (${(((specialItem.originalPrice - specialItem.price) / specialItem.originalPrice) * 100).toFixed(0)}%)</p>
              </div>
              
              <div className="mt-auto">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">Change Special</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Update Today's Special</DialogTitle>
                      <DialogDescription>
                        Select a menu item and set the special price or discount.
                      </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="select" className="mt-4">
                      <TabsList className="w-full">
                        <TabsTrigger value="select" className="flex-1">Select Item</TabsTrigger>
                        <TabsTrigger value="customize" className="flex-1">Set Discount</TabsTrigger>
                      </TabsList>
                      <TabsContent value="select" className="py-4">
                        <div className="grid gap-4">
                          <div>
                            <Label htmlFor="menu-item">Menu Item</Label>
                            <Select 
                              value={selectedItemId || undefined} 
                              onValueChange={setSelectedItemId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a menu item" />
                              </SelectTrigger>
                              <SelectContent>
                                {menuItems.map((item) => (
                                  <SelectItem key={item.id} value={item.id.toString()}>
                                    {item.name} - ${item.price.toFixed(2)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="border rounded-md p-4 mt-4">
                            <h3 className="font-medium mb-2">Preview Selected Item</h3>
                            {selectedItemId ? (
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-md overflow-hidden bg-muted">
                                  <img 
                                    src={menuItems.find(i => i.id.toString() === selectedItemId)?.image} 
                                    alt="Selected item"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {menuItems.find(i => i.id.toString() === selectedItemId)?.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    ${menuItems.find(i => i.id.toString() === selectedItemId)?.price.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-muted-foreground text-sm">No item selected</p>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="customize" className="py-4">
                        <div className="grid gap-4">
                          <div>
                            <Label htmlFor="discount-type">Discount Type</Label>
                            <Select 
                              value={discountType} 
                              onValueChange={setDiscountType}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage (%)</SelectItem>
                                <SelectItem value="amount">Fixed Amount ($)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="discount-value">
                              {discountType === "percentage" ? "Discount Percentage" : "Discount Amount"}
                            </Label>
                            <Input 
                              id="discount-value" 
                              type="number" 
                              value={discountValue}
                              onChange={e => setDiscountValue(e.target.value)}
                              min="0"
                              max={discountType === "percentage" ? "100" : undefined}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              {discountType === "percentage" 
                                ? "Enter a value between 1 and 100" 
                                : "Enter the dollar amount to discount"
                              }
                            </p>
                          </div>
                          
                          <div className="border rounded-md p-4 mt-4">
                            <h3 className="font-medium mb-2">Price Preview</h3>
                            {selectedItemId ? (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Original Price</p>
                                  <p className="font-medium line-through">
                                    ${menuItems.find(i => i.id.toString() === selectedItemId)?.price.toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Special Price</p>
                                  <p className="font-bold text-primary">
                                    ${calculateDiscountedPrice(
                                      Number(menuItems.find(i => i.id.toString() === selectedItemId)?.price || 0),
                                      discountType,
                                      Number(discountValue)
                                    ).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-muted-foreground text-sm">Select an item to preview pricing</p>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleUpdateSpecial}>Update Special</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Special Offer Performance</CardTitle>
          <CardDescription>Analytics for your current special offer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Orders Today</h3>
              <p className="text-3xl font-bold">24</p>
              <p className="text-sm text-muted-foreground">+12% from yesterday</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Revenue</h3>
              <p className="text-3xl font-bold">$359.76</p>
              <p className="text-sm text-muted-foreground">+8% from yesterday</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Promotion Effectiveness</h3>
              <p className="text-3xl font-bold">85%</p>
              <p className="text-sm text-muted-foreground">of customers order the special</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to calculate discounted price
function calculateDiscountedPrice(originalPrice: number, discountType: string, discountValue: number): number {
  if (discountType === "percentage") {
    const percentageDiscount = Math.min(discountValue, 100) / 100;
    return originalPrice * (1 - percentageDiscount);
  } else {
    // Fixed amount discount
    return Math.max(originalPrice - discountValue, 0);
  }
}