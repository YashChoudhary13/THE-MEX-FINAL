import { useState } from "react";
import { MenuCategory, MenuItem } from "@shared/schema";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminMenuProps {
  categories: MenuCategory[];
  menuItems: MenuItem[];
  isLoading: boolean;
}

export default function AdminMenu({ categories, menuItems, isLoading }: AdminMenuProps) {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.slug || "");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  
  // Filter items by category
  const filteredItems = activeCategory
    ? menuItems.filter(item => {
        const category = categories.find(cat => cat.slug === activeCategory);
        return category && item.categoryId === category.id;
      })
    : menuItems;
    
  const handleAddItem = () => {
    // In a real app, we would send the data to the backend
    toast({
      title: "Item Added",
      description: "The new menu item was added successfully.",
    });
    setIsAddModalOpen(false);
  };
  
  const handleEditItem = (item: MenuItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };
  
  const handleUpdateItem = () => {
    // In a real app, we would send the updated data to the backend
    toast({
      title: "Item Updated",
      description: "The menu item was updated successfully.",
    });
    setIsEditModalOpen(false);
  };
  
  const handleDeleteItem = (itemId: number) => {
    // In a real app, we would send a delete request to the backend
    toast({
      title: "Item Deleted",
      description: "The menu item was removed from your menu.",
    });
  };
  
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <Tabs
            value={activeCategory}
            onValueChange={setActiveCategory}
            className="w-full"
          >
            <TabsList className="w-full sm:w-auto overflow-auto">
              <TabsTrigger value="">All Items</TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.slug}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Menu Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Menu Item</DialogTitle>
                <DialogDescription>
                  Fill in the details to add a new item to your menu.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input id="name" placeholder="Burger name..." />
                </div>
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input id="price" type="number" placeholder="9.99" />
                </div>
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe your menu item..." 
                    className="resize-none"
                    rows={3}
                  />
                </div>
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="image">Image URL</Label>
                  <Input id="image" placeholder="https://example.com/image.jpg" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAddItem}>Add Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Menu Item</DialogTitle>
                <DialogDescription>
                  Update the details of this menu item.
                </DialogDescription>
              </DialogHeader>
              {selectedItem && (
                <div className="grid gap-4 py-4">
                  <div className="grid w-full items-center gap-2">
                    <Label htmlFor="edit-name">Item Name</Label>
                    <Input id="edit-name" defaultValue={selectedItem.name} />
                  </div>
                  <div className="grid w-full items-center gap-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select defaultValue={selectedItem.categoryId.toString()}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid w-full items-center gap-2">
                    <Label htmlFor="edit-price">Price ($)</Label>
                    <Input 
                      id="edit-price" 
                      type="number" 
                      defaultValue={selectedItem.price.toString()} 
                    />
                  </div>
                  <div className="grid w-full items-center gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea 
                      id="edit-description" 
                      defaultValue={selectedItem.description} 
                      className="resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="grid w-full items-center gap-2">
                    <Label htmlFor="edit-image">Image URL</Label>
                    <Input id="edit-image" defaultValue={selectedItem.image || ""} />
                  </div>
                </div>
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleUpdateItem}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p>Loading menu items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center h-64 border rounded-md">
            <p className="text-muted-foreground">No menu items found in this category</p>
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableCaption>A list of your restaurant's menu items.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const category = categories.find(c => c.id === item.categoryId);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-muted">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{category?.name || "Unknown"}</TableCell>
                      <TableCell>${item.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleEditItem(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}