import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export type PromoCodeFormProps = {
  promoCode?: any;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
};

export function PromoCodeForm({ promoCode, onSubmit, isSubmitting }: PromoCodeFormProps) {
  const promoCodeFormSchema = z.object({
    code: z.string().min(3, "Code must be at least 3 characters")
      .max(20, "Code must not exceed 20 characters")
      .regex(/^[A-Z0-9_]+$/, "Code must contain only uppercase letters, numbers, and underscores"),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.coerce.number().positive("Discount must be a positive number"),
    minOrderAmount: z.coerce.number().min(0, "Minimum order amount must be a positive number"),
    maxUses: z.coerce.number().min(0, "Maximum uses must be a positive number").nullable(),
    expiresAt: z.string().optional(),
    active: z.boolean().default(true),
  });
  
  const form = useForm<z.infer<typeof promoCodeFormSchema>>({
    resolver: zodResolver(promoCodeFormSchema),
    defaultValues: {
      code: promoCode?.code || "",
      discountType: promoCode?.discountType || "percentage",
      discountValue: promoCode?.discountValue || 0,
      minOrderAmount: promoCode?.minOrderAmount || 0,
      maxUses: promoCode?.maxUses === null ? null : (promoCode?.maxUses || 0),
      expiresAt: promoCode?.expiresAt ? new Date(promoCode.expiresAt).toISOString().split('T')[0] : undefined,
      active: promoCode?.active === false ? false : true,
    },
  });

  const discountType = form.watch("discountType");

  function handleSubmit(values: z.infer<typeof promoCodeFormSchema>) {
    onSubmit(values);
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
                <Input placeholder="WELCOME10" {...field} />
              </FormControl>
              <FormDescription>
                Case sensitive code customers will enter at checkout
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
                    <SelectValue placeholder="Select a discount type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
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
                  type="number" 
                  step={discountType === "percentage" ? "1" : "0.01"} 
                  placeholder={discountType === "percentage" ? "10" : "5.00"} 
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {discountType === "percentage" ? "Percentage discount (e.g. 10 for 10% off)" : "Fixed amount discount (in dollars)"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="minOrderAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Order Amount</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="20.00" {...field} />
              </FormControl>
              <FormDescription>
                Minimum subtotal required to use this code (0 for no minimum)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="maxUses"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum Uses</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="100" 
                  value={field.value === null ? "" : field.value}
                  onChange={(e) => {
                    const value = e.target.value === "" ? null : parseInt(e.target.value);
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormDescription>
                Maximum number of times this code can be used (leave empty for unlimited)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="expiresAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expiration Date</FormLabel>
              <FormControl>
                <Input 
                  type="date" 
                  placeholder="Select a date" 
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                When this code expires (leave empty for no expiration)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <Switch 
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>Active</FormLabel>
              <FormDescription className="text-xs ml-auto">Enable this promo code</FormDescription>
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (promoCode ? "Updating..." : "Creating...") : (promoCode ? "Update Promo Code" : "Create Promo Code")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export type SystemSettingsFormProps = {
  initialValues: {
    serviceFee: number;
    taxRate: number;
  };
  onSubmit: (data: { serviceFee: number; taxRate: number }) => void;
  isSubmitting: boolean;
};

export function SystemSettingsForm({ initialValues, onSubmit, isSubmitting }: SystemSettingsFormProps) {
  const settingsFormSchema = z.object({
    serviceFee: z.coerce.number().min(0, "Service fee must be a positive number or zero"),
    taxRate: z.coerce.number().min(0, "Tax rate must be a positive number or zero").max(100, "Tax rate cannot exceed 100%"),
  });
  
  const form = useForm<z.infer<typeof settingsFormSchema>>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      serviceFee: initialValues.serviceFee,
      taxRate: initialValues.taxRate,
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
                <Input type="number" step="0.01" placeholder="2.99" {...field} />
              </FormControl>
              <FormDescription>
                Fixed service fee applied to all orders
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
                <Input type="number" step="0.1" placeholder="8" {...field} />
              </FormControl>
              <FormDescription>
                Percentage tax rate applied to order subtotals
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Settings"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}