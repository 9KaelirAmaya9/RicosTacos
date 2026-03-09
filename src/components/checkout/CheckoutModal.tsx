import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { toast } from "sonner";

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientSecret: string;
  publishableKey: string;
  orderNumber: string;
  onSuccess: () => void;
}

function CheckoutForm({ orderNumber, onSuccess }: { orderNumber: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/cart?success=true&order_number=${encodeURIComponent(orderNumber)}`,
        },
        redirect: "if_required",
      });

      if (result.error) {
        toast.error(result.error.message || "Payment failed");
        setSubmitting(false);
        return;
      }

      const pi = result.paymentIntent;
      if (pi && (pi.status === "succeeded" || pi.status === "processing")) {
        onSuccess();
      } else {
        toast.message("Payment processing", { description: "We'll update your order once it completes." });
      }
    } catch (e: any) {
      toast.error(e?.message || "Payment error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement 
        options={{ layout: "tabs" }} 
        onReady={() => setIsReady(true)}
      />
      <Button onClick={handleSubmit} className="w-full" disabled={submitting || !stripe || !isReady}>
        {submitting ? "Processing..." : isReady ? "Pay now" : "Loading..."}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Secure payment powered by Stripe
      </p>
    </div>
  );
}

export default function CheckoutModal({ open, onOpenChange, clientSecret, publishableKey, orderNumber, onSuccess }: CheckoutModalProps) {
  const stripePromise = useMemo<Promise<Stripe | null>>(() => loadStripe(publishableKey), [publishableKey]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Payment</DialogTitle>
          <DialogDescription>Enter your payment details to finalize order {orderNumber}.</DialogDescription>
        </DialogHeader>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm orderNumber={orderNumber} onSuccess={onSuccess} />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}
