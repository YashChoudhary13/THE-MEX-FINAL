import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MenuCategory, InsertMenuItem, MenuItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DialogFooter } from "@/components/ui/dialog";
import ImageUpload from "@/components/ImageUpload";

const menuItemFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  price: z.coerce.number().positive("Price must be a positive number"),
  image: z.string().default(""),
  categoryId: z.coerce.number().positive("Please select a category"),
  featured: z.boolean().default(false),
  prepTime: z.coerce.number().int().min(1, "Prep time must be at least 1 minute").max(60, "Prep time should not exceed 60 minutes").default(15),
});

type MenuItemFormProps = {
  categories: MenuCategory[];
  menuItem?: MenuItem;
  onSubmit: (data: InsertMenuItem) => void;
  isSubmitting: boolean;
  onCancel?: () => void;
};

export default function MenuItemForm({ 
  categories, 
  menuItem, 
  onSubmit, 
  isSubmitting,
  onCancel 
}: MenuItemFormProps) {
  const form = useForm<z.infer<typeof menuItemFormSchema>>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: {
      name: menuItem?.name || "",
      description: menuItem?.description || "",
      price: menuItem?.price || 0,
      image: menuItem?.image || "",
      categoryId: menuItem?.categoryId || 0,
      featured: menuItem?.featured || false,
      prepTime: menuItem?.prepTime || 15,
    },
  });

  function handleSubmit(values: z.infer<typeof menuItemFormSchema>) {
    onSubmit(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name</FormLabel>
              <FormControl>
                <Input placeholder="Loaded Nachos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Crispy nachos topped with cheese, jalapeños, and guacamole" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="9.99" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value ? field.value.toString() : ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <ImageUpload
          value={form.watch("image") || ""}
          onChange={(value) => form.setValue("image", value)}
          label="Menu Item Image"
          placeholder="Upload an image or enter URL (optional)"
        />
        
        <FormField
          control={form.control}
          name="prepTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preparation Time (minutes)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="1" 
                  max="60" 
                  placeholder="15" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Average time to prepare this item in minutes
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="featured"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <Switch 
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>Featured Item</FormLabel>
              <FormDescription className="text-xs ml-auto">Display prominently on the menu</FormDescription>
            </FormItem>
          )}
        />
        
        <DialogFooter className="gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : menuItem ? "Update Item" : "Create Item"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}