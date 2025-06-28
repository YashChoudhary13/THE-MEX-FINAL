import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { TaxRateFields } from "@/components/admin/TaxRateFields";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MenuCategory, InsertMenuItem, MenuItem } from "@shared/schema";
import { calculateTaxInclusivePrice, DEFAULT_TAX_RATE } from "@shared/tax-utils";
import { useEffect, useState } from "react";

type AddMenuItemFormProps = {
  categories: MenuCategory[];
  onSubmit: (data: InsertMenuItem) => void;
  isSubmitting: boolean;
  defaultCategoryId?: number;
  menuItem?: MenuItem; // For editing existing items
};

export function AddMenuItemForm({ categories, onSubmit, isSubmitting, defaultCategoryId, menuItem }: AddMenuItemFormProps) {
  const menuItemFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().min(5, "Description must be at least 5 characters"),
    price: z.coerce.number().positive("Price must be a positive number"),
    basePrice: z.coerce.number().positive("Base price must be a positive number"),
    taxRate: z.string().optional(),
    image: z.string().optional().refine((val) => {
      if (!val || val === "") return true; // Allow empty
      if (val.startsWith("data:")) return true; // Allow data URLs from file uploads
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    }, "Please enter a valid URL or upload an image file"),
    categoryId: z.coerce.number().positive("Please select a category"),
    featured: z.boolean().default(false),
    soldOut: z.boolean().default(false),
    isHot: z.boolean().default(false),
    isBestSeller: z.boolean().default(false),
    prepTime: z.coerce.number().int().min(1, "Prep time must be at least 1 minute").max(60, "Prep time should not exceed 60 minutes").default(15),
  });

  const form = useForm<z.infer<typeof menuItemFormSchema>>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: {
      name: menuItem?.name || "",
      description: menuItem?.description || "",
      price: menuItem?.price || 0,
      basePrice: menuItem?.basePrice || 0,
      taxRate: menuItem?.taxRate ? (parseFloat(menuItem.taxRate) * 100).toString() : "13.5",
      image: menuItem?.image || "",
      categoryId: menuItem?.categoryId || defaultCategoryId || 0,
      featured: menuItem?.featured ?? false,
      soldOut: menuItem?.soldOut ?? false,
      isHot: menuItem?.isHot ?? false,
      isBestSeller: menuItem?.isBestSeller ?? false,
      prepTime: menuItem?.prepTime || 15,
    },
  });

  // Watch for changes in prices and tax rate for bidirectional calculation
  const watchedBasePrice = form.watch("basePrice");
  const watchedFinalPrice = form.watch("price");
  const watchedTaxRate = form.watch("taxRate");
  const watchedCategoryId = form.watch("categoryId");
  
  // Track which field was last modified to avoid infinite loops
  const [lastModified, setLastModified] = useState<'base' | 'final' | null>(null);

  // Calculate final price when base price or tax rate changes
  useEffect(() => {
    if (lastModified === 'base' && watchedBasePrice > 0) {
      const selectedCategory = categories.find(cat => cat.id === watchedCategoryId);
      const itemTaxRate = watchedTaxRate ? parseFloat(watchedTaxRate) / 100 : null;
      const categoryTaxRate = selectedCategory?.taxRate ? parseFloat(selectedCategory.taxRate) / 100 : null;
      
      // Determine effective tax rate: item rate > category rate > default rate
      let effectiveTaxRate = DEFAULT_TAX_RATE;
      if (itemTaxRate !== null) {
        effectiveTaxRate = itemTaxRate;
      } else if (categoryTaxRate !== null) {
        effectiveTaxRate = categoryTaxRate;
      }
      
      const finalPrice = calculateTaxInclusivePrice(watchedBasePrice, effectiveTaxRate);
      form.setValue("price", Math.round(finalPrice * 100) / 100);
    }
  }, [watchedBasePrice, watchedTaxRate, watchedCategoryId, categories, form, lastModified]);

  // Calculate base price when final price or tax rate changes
  useEffect(() => {
    if (lastModified === 'final' && watchedFinalPrice > 0) {
      const selectedCategory = categories.find(cat => cat.id === watchedCategoryId);
      const itemTaxRate = watchedTaxRate ? parseFloat(watchedTaxRate) / 100 : null;
      const categoryTaxRate = selectedCategory?.taxRate ? parseFloat(selectedCategory.taxRate) / 100 : null;
      
      // Determine effective tax rate: item rate > category rate > default rate
      let effectiveTaxRate = DEFAULT_TAX_RATE;
      if (itemTaxRate !== null) {
        effectiveTaxRate = itemTaxRate;
      } else if (categoryTaxRate !== null) {
        effectiveTaxRate = categoryTaxRate;
      }
      
      // Calculate base price from final price: basePrice = finalPrice / (1 + taxRate)
      const basePrice = watchedFinalPrice / (1 + effectiveTaxRate);
      form.setValue("basePrice", Math.round(basePrice * 100) / 100);
    }
  }, [watchedFinalPrice, watchedTaxRate, watchedCategoryId, categories, form, lastModified]);

  function handleSubmit(values: z.infer<typeof menuItemFormSchema>) {
    // Convert tax rate from percentage to decimal for database storage
    const processedValues = {
      ...values,
      taxRate: values.taxRate && values.taxRate !== "" ? (parseFloat(values.taxRate) / 100).toString() : undefined
    };
    onSubmit(processedValues);
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
        
        <TaxRateFields 
          control={form.control} 
          categories={categories} 
          defaultCategoryId={defaultCategoryId}
          onFieldChange={setLastModified}
        />
        
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/image.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
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
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Item Status & Tags</h4>
          <div className="grid grid-cols-2 gap-4">
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
                  <FormLabel>Featured</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="soldOut"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Switch 
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Sold Out</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isHot"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Switch 
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Hot 🌶️</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isBestSeller"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Switch 
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Best Seller</FormLabel>
                </FormItem>
              )}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (menuItem ? "Updating..." : "Creating...") : (menuItem ? "Update Item" : "Create Item")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
