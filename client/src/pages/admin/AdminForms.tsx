import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { PromoCode } from "@shared/schema";

// PromoCode form
export const promoCodeFormSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").max(20, "Code cannot exceed 20 characters"),
  discountType: z.enum(["percentage", "amount"], {
    required_error: "Please select a discount type",
  }),
  discountValue: z.coerce.number()
    .min(0.01, "Discount value must be greater than 0")
    .refine(val => val <= 100, val => ({
      message: val > 100 && val.toString().includes('%') ? "Percentage cannot exceed 100%" : "Percentage cannot exceed 100"
    })),
  minOrderValue: z.coerce.number()
    .min(0, "Minimum order value must be at least 0"),
  usageLimit: z.coerce.number()
    .int("Usage limit must be a whole number")
    .min(1, "Usage limit must be at least 1"),
  endDate: z.string(),
  active: z.boolean().default(true),
});

export type PromoCodeFormValues = z.infer<typeof promoCodeFormSchema>;

export type PromoCodeFormProps = {
  promoCode?: PromoCode;
  onSubmit: (data: PromoCodeFormValues) => void;
  isSubmitting: boolean;
};

export function PromoCodeForm({ promoCode, onSubmit, isSubmitting }: PromoCodeFormProps) {
  const defaultValues = {
    code: "",
    discountType: "percentage" as const,
    discountValue: 10,
    minOrderValue: 0,
    usageLimit: 100,
    endDate: new Date().toISOString().split('T')[0],
    active: true,
  };

  const form = useForm<PromoCodeFormValues>({
    resolver: zodResolver(promoCodeFormSchema),
    defaultValues: promoCode ? {
      code: promoCode.code,
      discountType: promoCode.discountType as "percentage" | "amount",
      discountValue: promoCode.discountValue,
      minOrderValue: promoCode.minOrderValue || 0,
      usageLimit: promoCode.usageLimit || 100,
      endDate: promoCode.endDate ? new Date(promoCode.endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      active: promoCode.active,
    } : defaultValues,
  });

  // Reset form when promoCode prop changes
  React.useEffect(() => {
    if (promoCode) {
      // Editing mode - populate with existing data
      form.reset({
        code: promoCode.code,
        discountType: promoCode.discountType as "percentage" | "amount",
        discountValue: promoCode.discountValue,
        minOrderValue: promoCode.minOrderValue || 0,
        usageLimit: promoCode.usageLimit || 100,
        endDate: promoCode.endDate ? new Date(promoCode.endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        active: promoCode.active,
      });
    } else {
      // Add mode - reset to defaults
      form.reset(defaultValues);
    }
  }, [promoCode, form]);

  const discountType = form.watch("discountType");

  function handleSubmit(values: PromoCodeFormValues) {
    // Create end date at end of day in Cork/Dublin timezone 
    const endDateTime = new Date(values.endDate + 'T23:59:59');
    
    const formattedValues = {
      code: values.code,
      discountType: values.discountType,
      discountValue: Number(values.discountValue),
      minOrderValue: Number(values.minOrderValue) || 0,
      usageLimit: Number(values.usageLimit),
      endDate: values.endDate, // Keep as string for form submission
      active: values.active,
    };
    
    console.log("📝 Submitting promo code form with data:", formattedValues);
    onSubmit(formattedValues);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Promo Code</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter promo code (e.g., WELCOME10)" />
              </FormControl>
              <FormDescription>
                This is the code customers will enter at checkout
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="discountType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discount Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="amount">Fixed Amount ($)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                How the discount will be calculated
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="discountValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discount Value</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="number" 
                  step={discountType === "percentage" ? "1" : "0.01"}
                  placeholder={discountType === "percentage" ? "e.g., 10 (for 10%)" : "e.g., 5.99 (for $5.99)"}
                />
              </FormControl>
              <FormDescription>
                {discountType === "percentage" 
                  ? "Enter percentage without the % symbol (e.g., 10 for 10%)" 
                  : "Enter dollar amount (e.g., 5.99 for $5.99)"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="minOrderValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Order Value</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.01" placeholder="e.g., 25.00" />
              </FormControl>
              <FormDescription>
                Minimum order subtotal required to use this promo code
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="usageLimit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usage Limit</FormLabel>
              <FormControl>
                <Input {...field} type="number" placeholder="e.g., 100" />
              </FormControl>
              <FormDescription>
                Maximum number of times this code can be used
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expiration Date</FormLabel>
              <FormControl>
                <Input {...field} type="date" />
              </FormControl>
              <FormDescription>
                When this promo code expires
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  Whether this promo code is currently active
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {promoCode ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{promoCode ? "Update" : "Create"} Promo Code</>
          )}
        </Button>
      </form>
    </Form>
  );
}

// System Settings form
export const settingsFormSchema = z.object({
  serviceFee: z.coerce.number()
    .min(0, "Service fee must be at least 0")
    .max(100, "Service fee too high"),
  taxRate: z.coerce.number()
    .min(0, "Tax rate must be at least 0")
    .max(100, "Tax rate cannot exceed 100%"),
});

export type SystemSettingsFormProps = {
  initialValues: {
    serviceFee: number;
    taxRate: number;
  };
  onSubmit: (data: { serviceFee: number; taxRate: number }) => void;
  isSubmitting: boolean;
};

export function SystemSettingsForm({ initialValues, onSubmit, isSubmitting }: SystemSettingsFormProps) {
  const form = useForm<z.infer<typeof settingsFormSchema>>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      serviceFee: initialValues.serviceFee || 2.99,
      taxRate: initialValues.taxRate || 8,
    },
  });

  function handleSubmit(values: z.infer<typeof settingsFormSchema>) {
    onSubmit(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="serviceFee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Fee ($)</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.01" placeholder="e.g., 2.99" />
              </FormControl>
              <FormDescription>
                Service fee applied to all orders
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="taxRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax Rate (%)</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.1" placeholder="e.g., 8.5" />
              </FormControl>
              <FormDescription>
                Tax rate applied to all orders (percentage)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Update Settings"
          )}
        </Button>
      </form>
    </Form>
  );
}