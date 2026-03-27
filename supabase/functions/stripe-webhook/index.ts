import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response(
      JSON.stringify({ error: 'No signature provided' }),
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    // FIX: Fail fast if STRIPE_WEBHOOK_SECRET is not configured.
    // Previously this passed '' to constructEventAsync which throws a
    // "No signatures found" error on EVERY webhook call — silently returning
    // HTTP 400 and never processing any payment event.
    if (!webhookSecret) {
      console.error('[WEBHOOK] STRIPE_WEBHOOK_SECRET is not set — cannot verify signature');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Verify webhook signature using async method
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    console.log('Webhook event type:', event.type);

    // Handle payment_intent.succeeded (for PaymentIntent flow)
    // This is the primary flow used by the app (SecurePaymentModal / create-payment-intent)
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderNumber = paymentIntent.metadata?.order_number;

      if (orderNumber) {
        console.log('[WEBHOOK] Payment succeeded for order:', orderNumber);

        // Update order status to 'paid' — this is the authoritative
        // server-side confirmation that payment has been collected.
        // Kitchen dashboard queries for "pending", "preparing", and "paid" statuses.
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: 'paid' })
          .eq('order_number', orderNumber)
          .eq('status', 'pending'); // only update if still pending (idempotent)

        if (updateError) {
          console.error('[WEBHOOK] Failed to update order status:', updateError);
        } else {
          console.log('[WEBHOOK] Order status set to paid:', orderNumber);
        }

        // Fire push notification to kitchen/admin staff
        try {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              title: '🚨 New Order Received',
              body: `Order #${orderNumber} — payment confirmed`,
              data: { url: '/kitchen' },
              targetRoles: ['admin', 'kitchen'],
            },
          });
        } catch (pushErr) {
          console.warn('[WEBHOOK] Push notification failed (non-critical):', pushErr);
        }
      } else {
        console.warn('[WEBHOOK] payment_intent.succeeded has no order_number in metadata');
      }
    }

    // Handle the checkout.session.completed event (for Checkout Session flow)
    // FIX: Also update order status to 'paid' here — previously this handler
    // only tried to send a notification but never updated the order status.
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderNumber = session.metadata?.order_number;

      if (!orderNumber) {
        console.error('[WEBHOOK] No order number in session metadata');
        return new Response(
          JSON.stringify({ error: 'No order number found' }),
          { status: 400, headers: corsHeaders }
        );
      }

      console.log('[WEBHOOK] Checkout session completed for order:', orderNumber);

      // Update order status to 'paid' (idempotent — only if still pending)
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('order_number', orderNumber)
        .eq('status', 'pending');

      if (updateError) {
        console.error('[WEBHOOK] Failed to update order status:', updateError);
      } else {
        console.log('[WEBHOOK] Order status set to paid:', orderNumber);
      }

      // Fire push notification to kitchen/admin staff
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            title: '🚨 New Order Received',
            body: `Order #${orderNumber} — payment confirmed`,
            data: { url: '/kitchen' },
            targetRoles: ['admin', 'kitchen'],
          },
        });
      } catch (pushErr) {
        console.warn('[WEBHOOK] Push notification failed (non-critical):', pushErr);
      }

      console.log('[WEBHOOK] Order pipeline complete for:', orderNumber);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('[WEBHOOK] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: corsHeaders }
    );
  }
});
