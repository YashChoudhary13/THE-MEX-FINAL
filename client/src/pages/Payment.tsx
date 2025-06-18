import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useCart } from "@/context/CartContext";
import { Loader2, CreditCard, Lock } from "lucide-react";

// Load Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface PaymentFormProps {
  orderData: any;
  onSuccess: () => void;
}

function PaymentForm({ orderData, onSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/checkout",
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message || "Payment could not be processed.",
        variant: "destructive",
      });
      setIsProcessing(false);
    } else {
      // Payment successful - now create the order
      try {
        const pendingOrderData = sessionStorage.getItem('pendingOrder');
        if (pendingOrderData) {
          const orderData = JSON.parse(pendingOrderData);
          
          // Create order in backend with confirmed status
          const response = await apiRequest("POST", "/api/orders", {
            ...orderData,
            status: "confirmed",
          });
          
          const order = await response.json();
          
          // Clear pending order data
          sessionStorage.removeItem('pendingOrder');
          
          // Store order data for success page
          sessionStorage.setItem('completedOrder', JSON.stringify(order));
          
          toast({
            title: "Payment Successful!",
            description: `Your order #${order.id} has been placed successfully.`,
          });
          
          // Navigate to order confirmation page with order ID
          window.location.href = `/order-confirmation/${order.id}`;
          
          onSuccess();
        }
      } catch (orderError) {
        console.error("Failed to create order after payment:", orderError);
        toast({
          title: "Payment Successful",
          description: "Payment completed but there was an issue creating your order. Please contact support.",
          variant: "destructive",
        });
      }
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </CardTitle>
        <CardDescription>
          Enter your payment information to complete your order
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <PaymentElement
              options={{
                layout: {
                  type: 'tabs',
                  defaultCollapsed: false,
                  radios: false,
                  spacedAccordionItems: false
                }
              }}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Lock className="h-4 w-4" />
              Secure payment
            </span>
            <span>Total: ${orderData?.total?.toFixed(2) || '0.00'}</span>
          </div>

          <Button
            type="submit"
            disabled={!stripe || !elements || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              `Pay $${orderData.total.toFixed(2)}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface PaymentPageProps {
  orderData: any;
  onSuccess: () => void;
}

export default function PaymentPage({ orderData, onSuccess }: PaymentPageProps) {
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!orderData?.total) return;

      try {
        const response = await apiRequest("POST", "/api/create-payment-intent", {
          amount: orderData.total,
          currency: "usd",
        });
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error("Failed to create payment intent:", error);
      }
    };

    createPaymentIntent();
  }, [orderData?.total]);

  if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Payment processing is not configured. Please contact support.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Setting up payment...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#0570de',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'Ideal Sans, system-ui, sans-serif',
        spacingUnit: '2px',
        borderRadius: '4px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm orderData={orderData} onSuccess={onSuccess} />
    </Elements>
  );
}