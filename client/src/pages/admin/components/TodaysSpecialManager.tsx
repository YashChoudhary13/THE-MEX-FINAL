import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MenuItem, InsertSpecialOffer } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
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
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, TrendingUp, DollarSign, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface TodaysSpecialManagerProps {
  menuItems: MenuItem[];
}

export default function TodaysSpecialManager({ menuItems }: TodaysSpecialManagerProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<string>("3.00");
  const [endDate, setEndDate] = useState<string>("");

  // Fetch current special offer
  const { data: specialOffer, refetch: refetchSpecial } = useQuery<{
    menuItem: MenuItem;
    discountValue?: number;
    discountAmount?: number;
    specialPrice?: number;
    endDate: string;
  } | null>({
    queryKey: ["/api/special-offer"],
    refetchInterval: 10000, // Refetch every 10 seconds for admin
  });

  // Fetch special offer statistics
  const { data: specialStats } = useQuery<{
    ordersToday: number;
    revenueToday: number;
    totalSavings: number;
  }>({
    queryKey: ["/api/admin/special-offer-stats"],
    enabled: !!specialOffer,
    refetchInterval: 30000, // Refetch stats every 30 seconds
  });

  // Set default end date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    setEndDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const updateSpecialMutation = useMutation({
    mutationFn: async (data: InsertSpecialOffer) => {
      // First deactivate all existing specials
      await apiRequest("POST", "/api/admin/special-offers/deactivate-all");
      // Then create the new special
      const response = await apiRequest("POST", "/api/admin/special-offers", data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries for immediate update
      queryClient.invalidateQueries({ queryKey: ["/api/special-offer"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/special-offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/special-offer-stats"] });
      
      // Force immediate refetch
      refetchSpecial();
      
      setIsDialogOpen(false);
      toast({
        title: "Special offer updated",
        description: "Today's special has been updated successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error updating special offer:", error);
      toast({
        title: "Failed to update special offer",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  });

  const handleUpdateSpecial = () => {
    if (!selectedItemId || !discountAmount || !endDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const selectedItem = menuItems.find(item => item.id === parseInt(selectedItemId));
    if (!selectedItem) {
      toast({
        title: "Invalid selection",
        description: "Please select a valid menu item",
        variant: "destructive",
      });
      return;
    }

    const discount = parseFloat(discountAmount);
    if (isNaN(discount) || discount <= 0 || discount >= selectedItem.price) {
      toast({
        title: "Invalid discount",
        description: "Discount must be a positive number less than the item price",
        variant: "destructive",
      });
      return;
    }

    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);

    updateSpecialMutation.mutate({
      menuItemId: parseInt(selectedItemId),
      discountValue: discount,
      originalPrice: selectedItem.price,
      specialPrice: selectedItem.price - discount,
      startDate: new Date(),
      endDate: endDateTime,
      active: true
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IE', {
      timeZone: 'Europe/Dublin',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Current Special Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Current Special Offer</CardTitle>
            <CardDescription>The currently active special on your menu</CardDescription>
          </div>
          <Button 
            onClick={() => refetchSpecial()}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {specialOffer && (specialOffer as any)?.menuItem ? (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="col-span-1">
                <div className="aspect-square rounded-xl border overflow-hidden bg-muted relative">
                  <img
                    src={(specialOffer as any).menuItem.image || "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800"}
                    alt={(specialOffer as any).menuItem.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-2 py-1 rounded-md">
                    SPECIAL OFFER
                  </div>
                </div>
              </div>
              
              <div className="col-span-2 space-y-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{(specialOffer as any).menuItem.name}</h3>
                  <p className="text-muted-foreground mb-4">{(specialOffer as any).menuItem.description}</p>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency((specialOffer as any).specialPrice || ((specialOffer as any).menuItem.price - (specialOffer as any).discountValue))}
                      </span>
                      <span className="text-lg line-through text-muted-foreground">
                        {formatCurrency((specialOffer as any).menuItem.price)}
                      </span>
                    </div>
                    <Badge variant="secondary">
                      Save {formatCurrency((specialOffer as any).discountValue || (specialOffer as any).discountAmount || 0)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Until {formatDate((specialOffer as any).endDate)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>23:59 Dublin time</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full md:w-auto" 
                  onClick={() => setIsDialogOpen(true)}
                >
                  Change Special
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No special offer active</h3>
              <p className="text-muted-foreground mb-4">Set up a special offer to attract more customers</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                Create Special Offer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Statistics */}
      {specialOffer && (
        <Card>
          <CardHeader>
            <CardTitle>Special Offer Performance</CardTitle>
            <CardDescription>Real-time analytics for your current special offer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground">Orders Today</h3>
                </div>
                <p className="text-3xl font-bold">{specialStats?.ordersToday || 0}</p>
                <p className="text-sm text-muted-foreground">
                  Since special was activated
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground">Revenue Generated</h3>
                </div>
                <p className="text-3xl font-bold">{formatCurrency(specialStats?.revenueToday || 0)}</p>
                <p className="text-sm text-muted-foreground">
                  From special offer sales
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="h-4 w-4" />
                  <h3 className="text-sm font-medium text-muted-foreground">Savings Provided</h3>
                </div>
                <p className="text-3xl font-bold">{formatCurrency(specialStats?.totalSavings || 0)}</p>
                <p className="text-sm text-muted-foreground">
                  Total customer savings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Update Special Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Today's Special</DialogTitle>
            <DialogDescription>
              Select a menu item and set a discount for today's special offer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="menu-item">Menu Item</Label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a menu item" />
                </SelectTrigger>
                <SelectContent>
                  {menuItems.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.name} - {formatCurrency(item.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="discount">Discount Amount (€)</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                min="0.01"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                placeholder="3.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateSpecial}
              disabled={updateSpecialMutation.isPending}
            >
              {updateSpecialMutation.isPending ? "Updating..." : "Update Special"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}