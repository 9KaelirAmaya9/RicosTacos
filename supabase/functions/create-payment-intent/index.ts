import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Rate Limiter ─────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, number[]>();
function isRateLimited(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) ?? []).filter(t => now - t < windowMs);
  if (timestamps.length >= maxRequests) return true;
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return false;
}

const MAX_REQUESTS = 10;
const WINDOW_MS = 60_000;

function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
  return `RT-${date}-${rand}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS" || req.method === "HEAD") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (isRateLimited(clientIp, MAX_REQUESTS, WINDOW_MS)) {
    return new Response(JSON.stringify({ error: "Too many requests. Please wait and try again." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Service-role client for price lookups and order insertion (bypasses RLS)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Resolve user ID from JWT if provided (optional for guest checkout)
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await anonClient.auth.getUser();
      if (user) userId = user.id;
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecret) throw new Error("Missing STRIPE_SECRET_KEY");

    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

    const {
      items,
      orderType,
      customerInfo,
      deliveryAddress,
      userId: clientUserId,
      checkoutSessionId,
    } = await req.json();

    // Prefer server-resolved userId; fall back to client-supplied (for guest resume flows)
    const resolvedUserId = userId ?? clientUserId ?? null;

    // ── Input validation ──────────────────────────────────────────────────────
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("No items provided");
    }
    if (items.length > 50) throw new Error("Too many items in order (max 50)");
    if (!orderType || !['pickup', 'delivery'].includes(orderType)) {
      throw new Error("Valid order type (pickup/delivery) is required");
    }
    if (!customerInfo?.name || !customerInfo?.phone || !customerInfo?.email) {
      throw new Error("Customer information is required (name, phone, email)");
    }

    for (const item of items) {
      if (!item?.id || typeof item.id !== 'string' || item.id.trim().length === 0) {
        throw new Error(`Invalid item id: ${JSON.stringify(item)}`);
      }
      if (!item?.name || typeof item.name !== 'string') {
        throw new Error(`Invalid item name: ${JSON.stringify(item)}`);
      }
      if (typeof item.quantity !== 'number' || item.quantity < 1 || item.quantity > 100) {
        throw new Error(`Invalid quantity for ${item.name}: must be 1–100`);
      }
    }

    // ── Server-side price lookup ──────────────────────────────────────────────
    // Fetch canonical prices from the DB. Client-supplied prices are IGNORED.
    const itemIds = items.map((i: any) => i.id);
    const { data: menuRows, error: menuError } = await serviceClient
      .from('menu_items')
      .select('id, name, price')
      .in('id', itemIds)
      .eq('active', true);

    if (menuError) throw new Error(`Price lookup failed: ${menuError.message}`);

    // Verify every item in the cart exists in the menu
    const priceMap = new Map<string, number>(
      (menuRows ?? []).map((row: any) => [row.id, Number(row.price)])
    );
    const unknownItems = itemIds.filter((id: string) => !priceMap.has(id));
    if (unknownItems.length > 0) {
      throw new Error(`Unknown menu item(s): ${unknownItems.join(', ')}`);
    }

    // Build items array with server-authoritative prices for DB storage
    const verifiedItems = items.map((item: any) => ({
      name: item.name,
      price: priceMap.get(item.id)!,
      quantity: Number(item.quantity),
    }));

    // ── Amount calculation (all server-side) ──────────────────────────────────
    const subtotalCents = verifiedItems.reduce(
      (sum: number, item: any) => sum + Math.round(item.price * 100) * item.quantity,
      0
    );
    const taxCents = Math.round(subtotalCents * 0.08875); // NYC 8.875%
    const deliveryFeeCents = orderType === "delivery" ? 500 : 0; // $5 delivery fee
    const amount = subtotalCents + taxCents + deliveryFeeCents;

    if (amount <= 0) throw new Error("Calculated amount must be greater than 0");

    // ── Stripe payment intent ─────────────────────────────────────────────────
    const orderNumber: string = generateOrderNumber();
    const idempotencyKey = checkoutSessionId ? `pi-${checkoutSessionId}` : undefined;

    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      receipt_email: customerInfo.email || undefined,
      metadata: {
        order_number: orderNumber,
        customer_name: customerInfo.name ?? "",
        customer_phone: customerInfo.phone ?? "",
        order_type: orderType,
        delivery_address: deliveryAddress ?? customerInfo.address ?? "",
      },
      description: `Order ${orderNumber}`,
    };

    const paymentIntent = idempotencyKey
      ? await stripe.paymentIntents.create(paymentIntentParams, { idempotencyKey })
      : await stripe.paymentIntents.create(paymentIntentParams);

    // When Stripe returns a cached PI (idempotency hit), use the order_number
    // from its metadata so we're consistent with any previously created order.
    const finalOrderNumber: string =
      (paymentIntent.metadata?.order_number as string) || orderNumber;

    // ── Atomic DB insert ──────────────────────────────────────────────────────
    // Check if this PI already has an order (retry / network-error recovery).
    const { data: existing } = await serviceClient
      .from('orders')
      .select('order_number')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .maybeSingle();

    if (!existing) {
      const finalAddress =
        orderType === "delivery" ? (deliveryAddress ?? customerInfo.address ?? null) : null;

      const { error: insertError } = await serviceClient
        .from('orders')
        .insert({
          order_number: finalOrderNumber,
          stripe_payment_intent_id: paymentIntent.id,
          user_id: resolvedUserId,
          customer_name: customerInfo.name,
          customer_email: customerInfo.email ?? null,
          customer_phone: customerInfo.phone,
          order_type: orderType,
          delivery_address: finalAddress,
          items: verifiedItems,
          subtotal: subtotalCents / 100,
          tax: taxCents / 100,
          total: amount / 100,
          notes: customerInfo.notes ?? null,
          status: 'pending',
        });

      if (insertError) {
        // 23505 = unique violation on order_number or stripe_payment_intent_id.
        // Another request beat us to the insert — this is safe to ignore.
        if (insertError.code !== '23505') {
          console.error('[create-payment-intent] DB insert failed:', insertError.message);
          throw new Error(`Order record could not be created: ${insertError.message}`);
        }
      }
    }

    const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY") || undefined;

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        publishableKey,
        orderNumber: finalOrderNumber,
        amounts: {
          subtotal: subtotalCents / 100,
          tax: taxCents / 100,
          deliveryFee: deliveryFeeCents / 100,
          total: amount / 100,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("[create-payment-intent] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
