import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";
import { MenuCategory } from "shared/schema";

interface TaxRateFieldsProps {
  control: Control<any>;
  categories: MenuCategory[];
  defaultCategoryId?: number;
  onFieldChange?: (field: 'base' | 'final') => void;
}

export function TaxRateFields({ control, categories, defaultCategoryId, onFieldChange }: TaxRateFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium mb-3">Pricing & Tax Information</h4>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="basePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Price (Before Tax)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="8.13" 
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      onFieldChange?.('base');
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Price before tax is applied
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Final Price (Tax Included)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="9.99" 
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      onFieldChange?.('final');
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Price customers see (includes tax)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <FormField
            control={control}
            name="taxRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Rate (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    type="text" 
                    placeholder="23%" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Leave empty to use category tax rate
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString() || defaultCategoryId?.toString() || ""}
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
      </div>
    </div>
  );
}
