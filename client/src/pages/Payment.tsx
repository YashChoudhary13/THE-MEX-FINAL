import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
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
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      if (!orderData?.total) {
        toast({
          title: "Order Error",
          description: "No order data found. Please go back and complete your order.",
          variant: "destructive",
        });
        return;
      }

      try {
        const response = await apiRequest("POST", "/api/create-payment-intent", {
          amount: orderData.total,
          currency: "usd",
        });
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        toast({
          title: "Payment Setup Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
      }
    };

    createPaymentIntent();
  }, [orderData?.total, toast]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setIsProcessing(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: orderData.customerName,
          email: orderData.customerEmail,
        },
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message || "Payment could not be processed.",
        variant: "destructive",
      });
      setIsProcessing(false);
    } else if (paymentIntent.status === "succeeded") {
      // Payment successful - now create the order
      try {
        const pendingOrderData = sessionStorage.getItem('pendingOrder');
        if (pendingOrderData) {
          const orderData = JSON.parse(pendingOrderData);
          
          // Create order in backend with confirmed status
          const response = await apiRequest("POST", "/api/orders", {
            ...orderData,
            status: "confirmed",
            paymentIntentId: paymentIntent.id,
          });
          
          const order = await response.json();
          
          // Clear pending order data
          sessionStorage.removeItem('pendingOrder');
          
          // Store order data for success page
          sessionStorage.setItem('completedOrder', JSON.stringify(order));
          
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
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
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
          <div className="p-4 border rounded-lg">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#424770",
                    "::placeholder": {
                      color: "#aab7c4",
                    },
                  },
                },
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
            disabled={!stripe || isProcessing || !clientSecret}
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

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm orderData={orderData} onSuccess={onSuccess} />
    </Elements>
  );
}