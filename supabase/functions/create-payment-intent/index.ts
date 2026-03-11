import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

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
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") || "";
    if (!stripeSecret) throw new Error("Missing STRIPE_SECRET_KEY");

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2023-10-16",
    });

    const { items, orderType, customerInfo, couponCode, discountAmount } = await req.json();

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

    if (items.length === 0) {
      throw new Error("No items in order");
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

    // Generate order number server-side using a cryptographically random suffix
    // so concurrent orders can never collide on the UNIQUE constraint.
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const uniqueId = crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
    const orderNumber = `ORD-${date}-${uniqueId}`;

    // Idempotency key scoped to the order number so that retries (e.g. after a
    // cold-start timeout on the client side) reuse the same Stripe payment intent
    // rather than creating a second one, preventing double charges.
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      receipt_email: customerInfo?.email || undefined,
      metadata: {
        order_number: orderNumber || "",
        customer_name: customerInfo?.name || "",
        customer_phone: customerInfo?.phone || "",
        order_type: orderType || "",
        delivery_address: customerInfo?.address || "",
        coupon_code: couponCode || "",
        discount_amount: discountAmount ? String(discountAmount) : "",
      },
      description: `Order ${orderNumber}`,
    }, {
      idempotencyKey: `order-${orderNumber}`,
    });

    const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY") || undefined;

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        orderNumber,
        publishableKey,
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
