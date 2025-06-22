import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { MenuCategory } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, Save } from "lucide-react";

export default function CategoryOrderManager() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: categoriesData, isLoading } = useQuery<MenuCategory[]>({
    queryKey: ["/api/categories"],
  });

  const saveOrderMutation = useMutation({
    mutationFn: async (categoryOrders: { id: number; order: number }[]) => {
        const response = await fetch("/api/categories/reorder", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify({ categoryOrders }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update category order");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Category order updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update category order",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (categoriesData) {
      setCategories([...categoriesData].sort((a, b) => a.order - b.order));
    }
  }, [categoriesData]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update the order values
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    setCategories(updatedItems);
    setHasChanges(true);
  };

  const handleSaveOrder = () => {
    const categoryOrders = categories.map((category, index) => ({
      id: category.id,
      order: index + 1,
    }));

    saveOrderMutation.mutate(categoryOrders);
  };

  if (isLoading) {
    return <div className="animate-pulse p-4">Loading categories...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Category Order</CardTitle>
        {hasChanges && (
          <Button
            onClick={handleSaveOrder}
            disabled={saveOrderMutation.isPending}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Order
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Drag and drop to reorder menu categories. Changes will appear immediately on the customer menu.
          </p>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="categories">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {categories.map((category, index) => (
                    <Draggable
                      key={category.id}
                      draggableId={category.id.toString()}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-3 p-3 bg-card border rounded-lg transition-colors ${
                            snapshot.isDragging ? "shadow-lg bg-accent" : ""
                          }`}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{category.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {category.slug}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Order: {index + 1}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </CardContent>
    </Card>
  );
}