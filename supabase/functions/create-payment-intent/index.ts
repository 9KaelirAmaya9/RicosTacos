import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Allow both authenticated and anonymous users for checkout
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    // If auth header exists, verify it (optional for guest checkout)
    if (authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") || "";
    if (!stripeSecret) throw new Error("Missing STRIPE_SECRET_KEY");

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2023-10-16",
    });

    // Accept both old flow (client sends orderNumber) and new flow (server generates it).
    // checkoutSessionId is used as the Stripe idempotency key so retries reuse the same PI.
    const { items, orderType, customerInfo, orderNumber: clientOrderNumber, couponCode, discountAmount, checkoutSessionId } = await req.json();

    // Generate a human-readable order number server-side.
    // Format: RT-YYYYMMDD-XXXXXX  (e.g. RT-20260324-4F2A9C)
    //   RT       = Ricos Tacos brand prefix
    //   YYYYMMDD = UTC date — helps staff identify which day an order is from
    //   XXXXXX   = 6 random uppercase hex chars (16.7M combos/day — collision-safe)
    //
    // Falls back to a client-supplied orderNumber only if one was explicitly passed
    // (legacy path — no current callers send one, but kept for safety).
    function generateOrderNumber(): string {
      const now = new Date();
      const date = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
      const rand = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
      return `RT-${date}-${rand}`;
    }

    const orderNumber: string = (clientOrderNumber && typeof clientOrderNumber === 'string')
      ? clientOrderNumber
      : generateOrderNumber();

    // Validate input parameters (allows guest checkout)
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("No items provided");
    }
    if (!orderType || !['pickup', 'delivery'].includes(orderType)) {
      throw new Error("Valid order type (pickup/delivery) is required");
    }
    if (!customerInfo || !customerInfo.name || !customerInfo.phone || !customerInfo.email) {
      throw new Error("Customer information is required (name, phone, email)");
    }

    // Validate items structure and reasonable limits to prevent abuse
    if (items.length > 50) {
      throw new Error("Too many items in order (max 50)");
    }

    for (const item of items) {
      if (!item || typeof item !== 'object') {
        throw new Error(`Invalid item format: ${JSON.stringify(item)}`);
      }
      if (!item.name || typeof item.name !== 'string' || item.name.trim().length === 0) {
        throw new Error(`Invalid item name: ${JSON.stringify(item)}`);
      }
      if (typeof item.price !== 'number' || isNaN(item.price) || item.price < 0 || item.price > 1000) {
        throw new Error(`Invalid item price for ${item.name}: ${item.price}. Price must be between 0 and 1000.`);
      }
      if (typeof item.quantity !== 'number' || isNaN(item.quantity) || item.quantity < 1 || item.quantity > 100) {
        throw new Error(`Invalid item quantity for ${item.name}: ${item.quantity}. Quantity must be between 1 and 100.`);
      }
    }

    // Calculate totals in cents
    const subtotalCents = items.reduce((sum: number, item: any) => {
      const price = Math.round(Number(item.price) * 100);
      const qty = Number(item.quantity) || 0;
      return sum + price * qty;
    }, 0);

    // Apply discount if provided
    const discountCents = Math.round((Number(discountAmount) || 0) * 100);
    const subtotalAfterDiscount = Math.max(0, subtotalCents - discountCents);

    const taxCents = Math.round(subtotalAfterDiscount * 0.08875); // NYC 8.875%
    const deliveryFeeCents = orderType === "delivery" ? 500 : 0; // $5 delivery fee
    const amount = subtotalAfterDiscount + taxCents + deliveryFeeCents;

    if (amount <= 0) throw new Error("Calculated amount must be greater than 0");

    // Use checkoutSessionId as idempotency key so retries reuse the same payment intent
    const idempotencyKey = checkoutSessionId ? `pi-${checkoutSessionId}` : undefined;

    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      receipt_email: customerInfo?.email || undefined,
      metadata: {
        order_number: orderNumber,
        customer_name: customerInfo?.name || "",
        customer_phone: customerInfo?.phone || "",
        order_type: orderType || "",
        delivery_address: customerInfo?.address || "",
        coupon_code: couponCode || "",
        discount_amount: discountAmount ? String(discountAmount) : "",
      },
      description: `Order ${orderNumber}`,
    };

    const paymentIntent = idempotencyKey
      ? await stripe.paymentIntents.create(paymentIntentParams, { idempotencyKey })
      : await stripe.paymentIntents.create(paymentIntentParams);

    const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY") || undefined;

    // Return server-generated order number and amounts so the client uses the
    // exact same values that were charged to Stripe.
    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        publishableKey,
        orderNumber,
        amounts: {
          subtotal: subtotalAfterDiscount / 100,
          tax: taxCents / 100,
          deliveryFee: deliveryFeeCents / 100,
          total: amount / 100,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating payment intent:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
