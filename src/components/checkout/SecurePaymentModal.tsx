import { useState, useEffect } from 'react';
import type React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { AlertCircle, CreditCard, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address?: string;
  notes?: string;
}

interface OrderAmounts {
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
}

interface SecurePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientSecret: string;
  publishableKey: string;
  orderNumber: string;
  customerInfo: CustomerInfo;
  orderType: 'pickup' | 'delivery';
  amounts: OrderAmounts;
  cart: Array<{ name: string; price: number; quantity: number }>;
  onSuccess: () => void;
}

function PaymentForm({
  orderNumber,
  customerInfo,
  orderType,
  amounts,
  cart,
  onSuccess,
  onProcessingChange,
}: {
  orderNumber: string;
  customerInfo: CustomerInfo;
  orderType: string;
  amounts: OrderAmounts;
  cart: Array<{ name: string; price: number; quantity: number }>;
  onSuccess: () => void;
  onProcessingChange: (v: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  // Keep parent in sync so modal close can be blocked during payment
  const setProcessing = (v: boolean) => {
    setIsProcessing(v);
    onProcessingChange(v);
  };
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Add timeout for PaymentElement loading
  useEffect(() => {
    console.log('PaymentForm mounted, waiting for PaymentElement to load...');
    const timer = setTimeout(() => {
      if (!isReady) {
        console.error('PaymentElement failed to load within 15 seconds');
        setLoadingTimeout(true);
        setErrorMessage('Payment form is taking too long to load. Please check your internet connection and try again.');
        toast.error('Payment form timed out. Please refresh and try again.');
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timer);
  }, [isReady]);


  const { subtotal, tax, deliveryFee, total } = amounts;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔵 Payment form submitted');
    
    if (!stripe || !elements) {
      console.error('❌ Stripe not initialized');
      toast.error('Payment system not ready. Please try again.');
      return;
    }

    if (!isReady) {
      console.error('❌ Payment form not ready');
      toast.error('Please wait for the payment form to load.');
      return;
    }

    console.log('🟡 Starting payment processing...');
    setProcessing(true);
    setErrorMessage(null);

    try {
      // Validate the payment element
      console.log('🔵 Submitting payment details for validation...');
      const { error: submitError } = await elements.submit();
      if (submitError) {
        console.error('❌ Payment validation failed:', submitError);
        setErrorMessage(submitError.message || 'Please check your payment details.');
        toast.error(submitError.message || 'Please check your payment details.');
        setProcessing(false);
        return;
      }
      console.log('✅ Payment details validated');

      // Confirm the payment
      console.log('🔵 Confirming payment with Stripe...');
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/cart?success=true&order_number=${encodeURIComponent(orderNumber)}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('❌ Payment confirmation failed:', error);
        setErrorMessage(error.message || 'Payment failed. Please try again.');
        toast.error(error.message || 'Payment failed. Please try again.');
        setProcessing(false);
        return;
      }

      console.log('🟢 Payment intent result:', {
        status: paymentIntent?.status,
        id: paymentIntent?.id,
      });

      if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
        // Use raw fetch() to avoid GoTrueClient JWT refresh (same pattern as Cart.tsx).
        const _SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '';
        const _SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.SUPABASE_PUBLISHABLE_KEY || '';

        // ── Fix: Client-side status update to 'paid' ─────────────────────────
        // The Stripe webhook also sets this, but webhook delivery can lag 5-30s.
        // Updating here means the kitchen sees "PAID — New" the instant Stripe
        // confirms, not after an indeterminate webhook delay.
        // The webhook's update is idempotent (.eq('status','pending')) so this
        // client write and the webhook write don't conflict.
        fetch(`${_SUPABASE_URL}/rest/v1/orders?order_number=eq.${encodeURIComponent(orderNumber)}`, {
          method: 'PATCH',
          headers: {
            'apikey': _SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ status: 'paid' }),
        }).catch((e: any) => console.warn('Client-side status update failed (webhook will cover this):', e));

        // Notify kitchen now that payment is confirmed — fire-and-forget.
        fetch(`${_SUPABASE_URL}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            'apikey': _SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '🚨 New Order Received',
            body: `Order #${orderNumber} • ${cart.length} item${cart.length !== 1 ? 's' : ''} • $${total.toFixed(2)}`,
            data: { orderId: orderNumber, orderNumber, url: '/kitchen' },
            targetRoles: ['admin', 'kitchen']
          }),
        }).catch((e: any) => console.warn('Push notification failed (non-critical):', e));

        // Send confirmation email (with timeout to prevent blocking)
        const emailPromise = fetch(`${_SUPABASE_URL}/functions/v1/send-order-confirmation`, {
          method: 'POST',
          headers: {
            'apikey': _SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderNumber,
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
            orderType,
            items: cart,
            subtotal,
            tax,
            total,
            deliveryAddress: orderType === 'delivery' ? customerInfo.address : undefined
          }),
        });

        // Add 5-second timeout to email confirmation
        const emailTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email confirmation timeout')), 5000)
        );

        try {
          await Promise.race([emailPromise, emailTimeout]);
        } catch (emailError: any) {
          console.error('Failed to send confirmation email (non-blocking):', emailError);
          // Don't fail the transaction if email fails or times out
        }
        
        toast.success('Payment successful!');
        onSuccess();
      } else {
        setErrorMessage('Payment status unclear. Please check your order status.');
        toast.warning('Payment status unclear. Please check your order status.');
        setProcessing(false);
      }
    } catch (err: any) {
      console.error('❌ Payment error:', err);
      const message = err?.message || 'An unexpected error occurred.';
      setErrorMessage(message);
      toast.error(message);
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Summary */}
      <Card className="p-4 bg-muted/50">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Order Summary
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order Number:</span>
            <span className="font-medium">{orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type:</span>
            <span className="font-medium capitalize">{orderType}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax (8.875%):</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          {orderType === 'delivery' && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Fee:</span>
              <span>$5.00</span>
            </div>
          )}
          <Separator className="my-2" />
          <div className="flex justify-between font-semibold text-base">
            <span>Total:</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* Customer Info Review */}
      <Card className="p-4 bg-muted/50">
        <h3 className="font-semibold mb-3">Customer Information</h3>
        <div className="space-y-1 text-sm">
          <p><span className="text-muted-foreground">Name:</span> {customerInfo.name}</p>
          <p><span className="text-muted-foreground">Email:</span> {customerInfo.email}</p>
          <p><span className="text-muted-foreground">Phone:</span> {customerInfo.phone}</p>
          {customerInfo.address && (
            <p><span className="text-muted-foreground">Address:</span> {customerInfo.address}</p>
          )}
        </div>
      </Card>

      {/* Stripe Payment Element */}
      <div className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Payment Details
        </h3>
        <p className="text-xs text-muted-foreground">
          Enter your card number, expiration date, CVC, and billing address below. All payment information is securely processed by Stripe.
        </p>
        <div className="border rounded-lg p-4 bg-background">
          <PaymentElement 
            options={{
              layout: 'tabs',
              business: { name: 'Ricos Tacos' },
              wallets: {
                applePay: 'auto',
                googlePay: 'auto',
              }
            }}
            onReady={() => {
              console.log('✅ PaymentElement loaded successfully');
              setIsReady(true);
            }}
            onLoadError={(error: any) => {
              console.error('❌ PaymentElement failed to load:', error);
              setErrorMessage(error?.error?.message || 'Failed to load payment form');
              toast.error('Payment form failed to load. Please try again.');
            }}
          />
        </div>
      </div>

      {/* Error Message */}
      {(errorMessage || loadingTimeout) && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-destructive font-medium mb-1">
              {loadingTimeout ? 'Payment Form Timeout' : 'Payment Error'}
            </p>
            <p className="text-destructive text-xs">
              {errorMessage || 'The payment form is taking too long to load. Please refresh the page and try again.'}
            </p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button 
        type="submit"
        className="w-full" 
        size="lg"
        disabled={!stripe || !elements || !isReady || isProcessing || loadingTimeout}
      >
        {isProcessing ? (
          'Processing Payment...'
        ) : loadingTimeout ? (
          'Payment Form Failed'
        ) : !isReady ? (
          'Loading Payment Form...'
        ) : (
          `Pay $${total.toFixed(2)}`
        )}
      </Button>
      
      {loadingTimeout && (
        <Button 
          variant="outline"
          className="w-full" 
          size="lg"
          onClick={() => window.location.reload()}
        >
          Refresh Page & Try Again
        </Button>
      )}

      <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
        <Lock className="h-3 w-3" />
        Secure payment powered by Stripe • PCI-DSS compliant
      </p>
    </form>
  );
}

export default function SecurePaymentModal({
  open,
  onOpenChange,
  clientSecret,
  publishableKey,
  orderNumber,
  customerInfo,
  orderType,
  amounts,
  cart,
  onSuccess,
}: SecurePaymentModalProps) {
  const [stripeInstance, setStripeInstance] = useState<Stripe | null | undefined>(undefined);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;
    console.log('Initializing Stripe with publishable key:', publishableKey?.substring(0, 20) + '...');
    (async () => {
      try {
        const inst = await loadStripe(publishableKey);
        if (mounted) {
          setStripeInstance(inst);
          if (!inst) {
            console.error('Stripe instance is null - key may be invalid');
            toast.error('Stripe initialization failed. Please verify your publishable key.');
          } else {
            console.log('✅ Stripe initialized successfully');
          }
        }
      } catch (e: any) {
        console.error('Stripe initialization error:', e);
        if (mounted) {
          setStripeInstance(null);
          toast.error(e?.message || 'Failed to initialize payment.');
        }
      }
    })();
    return () => { mounted = false; };
  }, [publishableKey]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Block closing the dialog while a payment is in-flight.
        // Accidental dismiss (Escape key, backdrop click) during Stripe processing
        // would leave the customer on the cart page while the charge still completes,
        // causing "Order Not Found" on the success page.
        if (!next && isPaymentProcessing) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Complete Your Payment</DialogTitle>
          <DialogDescription className="text-sm">
            Review your order details and enter your payment information below.
          </DialogDescription>
        </DialogHeader>
        
        {clientSecret && stripeInstance === undefined && (
          <div className="p-4 text-sm text-muted-foreground">Initializing secure payment form…</div>
        )}
        {clientSecret && stripeInstance === null && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-destructive">Unable to initialize Stripe. Please refresh the page or contact support.</p>
          </div>
        )}
        {clientSecret && stripeInstance && (
          <Elements stripe={stripeInstance} options={{ clientSecret }}>
            <PaymentForm
              orderNumber={orderNumber}
              customerInfo={customerInfo}
              orderType={orderType}
              amounts={amounts}
              cart={cart}
              onSuccess={onSuccess}
              onProcessingChange={setIsPaymentProcessing}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}
