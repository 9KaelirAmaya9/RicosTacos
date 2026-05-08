import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://losricostacos.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

// ── Restaurant email notification ─────────────────────────────────────────────
// Sends an email to the restaurant owner/staff whenever a new paid order arrives.
// This is the primary "kitchen is open but tab is closed" safety net.
// Requires RESEND_API_KEY and RESTAURANT_NOTIFICATION_EMAIL in Supabase secrets.
async function notifyRestaurant(orderNumber: string): Promise<void> {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const restaurantEmail = Deno.env.get('RESTAURANT_NOTIFICATION_EMAIL');
  const restaurantPhone = Deno.env.get('RESTAURANT_NOTIFICATION_PHONE');
  const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioFrom = Deno.env.get('TWILIO_PHONE_NUMBER');

  // Fetch order details once — used by both email and SMS
  const { data: order, error } = await supabase
    .from('orders')
    .select('order_number, customer_name, customer_phone, order_type, delivery_address, items, subtotal, tax, total, notes')
    .eq('order_number', orderNumber)
    .single();

  if (error || !order) {
    console.error('[WEBHOOK] Could not fetch order for notifications:', error?.message);
    return;
  }

  const items = Array.isArray(order.items) ? order.items : [];

  // ── Build SMS promise (Twilio) ────────────────────────────────────────────────
  // Most reliable channel — works even if wifi is down on the tablet.
  const smsPromise: Promise<void> = (twilioSid && twilioToken && twilioFrom && restaurantPhone)
    ? (async () => {
        const itemSummary = items
          .map((i: { name: string; quantity: number }) => `${i.quantity}× ${i.name}`)
          .join(', ');
        const smsBody =
          `🚨 NEW ORDER #${order.order_number}\n` +
          `${order.order_type.toUpperCase()} — $${Number(order.total).toFixed(2)}\n` +
          `${order.customer_name} · ${order.customer_phone}\n` +
          `${itemSummary}\n` +
          (order.delivery_address ? `📍 ${order.delivery_address}\n` : '') +
          (order.notes ? `📝 ${order.notes}\n` : '') +
          `${SITE_URL}/kitchen`;

        const smsResp = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ From: twilioFrom, To: restaurantPhone, Body: smsBody }),
          }
        );
        if (smsResp.ok) {
          console.log('[WEBHOOK] SMS sent to restaurant:', restaurantPhone);
        } else {
          const body = await smsResp.json().catch(() => ({}));
          console.error('[WEBHOOK] Twilio SMS error:', smsResp.status, JSON.stringify(body));
        }
      })()
    : Promise.resolve().then(() => {
        console.warn('[WEBHOOK] SMS skipped — TWILIO_* or RESTAURANT_NOTIFICATION_PHONE not set');
      });

  // ── Build email promise (Resend) ──────────────────────────────────────────────
  const emailPromise: Promise<void> = (resendKey && restaurantEmail)
    ? (async () => {
        const itemsHtml = items
          .map((item: { name: string; quantity: number; price: number }) =>
            `<tr><td style="padding:4px 8px">${item.quantity}×</td><td style="padding:4px 8px">${item.name}</td><td style="padding:4px 8px;text-align:right">$${(item.price * item.quantity).toFixed(2)}</td></tr>`
          )
          .join('');

        const deliveryRow = order.order_type === 'delivery' && order.delivery_address
          ? `<p><strong>Deliver to:</strong> ${order.delivery_address}</p>`
          : `<p><strong>Type:</strong> Pickup</p>`;

        const notesRow = order.notes
          ? `<p><strong>Special instructions:</strong> ${order.notes}</p>`
          : '';

        const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="background:#E31E24;color:#fff;padding:16px;margin:0;border-radius:8px 8px 0 0">
        🚨 New Order — #${order.order_number}
      </h2>
      <div style="border:1px solid #eee;border-top:none;padding:16px;border-radius:0 0 8px 8px">
        <p><strong>Customer:</strong> ${order.customer_name} — ${order.customer_phone}</p>
        ${deliveryRow}
        ${notesRow}
        <table style="width:100%;border-collapse:collapse;margin:12px 0">
          <thead><tr style="background:#f5f5f5">
            <th style="padding:4px 8px;text-align:left">Qty</th>
            <th style="padding:4px 8px;text-align:left">Item</th>
            <th style="padding:4px 8px;text-align:right">Price</th>
          </tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <p style="text-align:right;font-size:1.1em"><strong>Total: $${Number(order.total).toFixed(2)}</strong></p>
        <p style="margin-top:16px">
          <a href="${SITE_URL}/kitchen" style="background:#E31E24;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold">
            Open Kitchen Dashboard →
          </a>
        </p>
      </div>
    </div>
  `;

        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Ricos Tacos Orders <orders@losricostacos.com>',
            to: [restaurantEmail],
            subject: `🚨 New ${order.order_type === 'delivery' ? 'Delivery' : 'Pickup'} Order #${order.order_number} — $${Number(order.total).toFixed(2)}`,
            html,
          }),
        });

        if (resp.ok) {
          console.log('[WEBHOOK] Restaurant notification email sent to', restaurantEmail);
        } else {
          const body = await resp.json().catch(() => ({}));
          console.error('[WEBHOOK] Resend error:', resp.status, JSON.stringify(body));
        }
      })()
    : Promise.resolve().then(() => {
        console.warn('[WEBHOOK] Restaurant email skipped — RESEND_API_KEY or RESTAURANT_NOTIFICATION_EMAIL not set');
      });

  // ── Fire both channels concurrently ──────────────────────────────────────────
  const [smsResult, emailResult] = await Promise.allSettled([smsPromise, emailPromise]);
  if (smsResult.status === 'rejected') console.error('[WEBHOOK] SMS channel threw:', smsResult.reason);
  if (emailResult.status === 'rejected') console.error('[WEBHOOK] Email channel threw:', emailResult.reason);
}

// ── Shared: handle a confirmed paid order ────────────────────────────────────
async function handlePaidOrder(orderNumber: string): Promise<void> {
  // 1. Update order status to 'paid' — only if still 'pending'.
  //    Returns the updated row so we know whether this event is the first to win.
  const { data: updated, error: updateError } = await supabase
    .from('orders')
    .update({ status: 'paid' })
    .eq('order_number', orderNumber)
    .eq('status', 'pending')
    .select('order_number');

  if (updateError) {
    console.error('[WEBHOOK] Failed to update order status:', updateError);
  }

  // If no rows were updated the order was already paid by a prior event — skip notifications.
  // This prevents duplicate SMS/email when both payment_intent.succeeded and
  // checkout.session.completed fire for the same order.
  if (!updated || updated.length === 0) {
    console.log('[WEBHOOK] Order already paid, skipping notifications:', orderNumber);
    return;
  }

  console.log('[WEBHOOK] Order status set to paid:', orderNumber);

  // 2. Email + SMS the restaurant — primary reliable notification channel.
  //    Runs even if the kitchen browser tab is closed.
  await notifyRestaurant(orderNumber);

  // 3. Web push to kitchen/admin staff — secondary channel (browser tab must be open).
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
}

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

    if (!webhookSecret) {
      console.error('[WEBHOOK] STRIPE_WEBHOOK_SECRET is not set — cannot verify signature');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    console.log('[WEBHOOK] Event type:', event.type);

    // Collect any background work to run after we return 200 to Stripe.
    // Returning quickly prevents Stripe from timing out and retrying.
    let backgroundWork: Promise<void> | null = null;

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderNumber = paymentIntent.metadata?.order_number;

      if (orderNumber) {
        console.log('[WEBHOOK] Payment succeeded for order:', orderNumber);
        backgroundWork = handlePaidOrder(orderNumber);
      } else {
        console.warn('[WEBHOOK] payment_intent.succeeded has no order_number in metadata');
      }
    }

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
      backgroundWork = handlePaidOrder(orderNumber);
    }

    // Build the 200 response FIRST, then start background work.
    // If the catch-path runs `await backgroundWork` before returning, Stripe
    // waits the full duration of SMS + email sends (2–5s). If Twilio or Resend
    // hangs, this can push past 30s and trigger Stripe retries → duplicate
    // notifications. Building the response object early avoids this entirely.
    const okResponse = new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: corsHeaders }
    );

    if (backgroundWork) {
      try {
        // @ts-ignore — available in Supabase Edge Runtime / Deno Deploy
        EdgeRuntime.waitUntil(backgroundWork);
      } catch {
        // Fallback: fire-and-forget — the 200 response is already built above.
        backgroundWork.catch((e: unknown) =>
          console.error('[WEBHOOK] Background work threw:', e)
        );
      }
    }

    return okResponse;

  } catch (error) {
    console.error('[WEBHOOK] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: corsHeaders }
    );
  }
});
