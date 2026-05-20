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

const esc = (s: string): string =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

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
    .select('order_number, customer_name, customer_phone, customer_email, order_type, delivery_address, items, subtotal, tax, total, notes')
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
        const LOGO_URL = `${SITE_URL}/logo.png`;
        const HERO_URL = `${SITE_URL}/RicosTacos.png`;
        const SERAPE_STRIPE = `
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
  <tr>
    <td width="20%" height="6" style="background:#E31E24;font-size:0;line-height:0;">&nbsp;</td>
    <td width="20%" height="6" style="background:#F59E0B;font-size:0;line-height:0;">&nbsp;</td>
    <td width="20%" height="6" style="background:#16A34A;font-size:0;line-height:0;">&nbsp;</td>
    <td width="20%" height="6" style="background:#1D4ED8;font-size:0;line-height:0;">&nbsp;</td>
    <td width="20%" height="6" style="background:#E31E24;font-size:0;line-height:0;">&nbsp;</td>
  </tr>
</table>`;

        const itemsHtml = items
          .map((item: { name: string; quantity: number; price: number }, i: number) =>
            `<tr style="background:${i % 2 === 0 ? '#FFFFFF' : '#FFF9F5'};">
              <td style="padding:10px 12px;border-bottom:1px solid #F0EDE8;font-size:14px;color:#1A1A1A;">${esc(item.name)}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #F0EDE8;text-align:center;font-size:14px;color:#888;" width="48">${Number(item.quantity)}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #F0EDE8;text-align:right;font-weight:600;font-size:14px;color:#1A1A1A;" width="80">$${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
            </tr>`
          )
          .join('');

        // ── Personalized ETA ──────────────────────────────────────────────────
        const ETA_PREP = 15;
        const REST_LAT = 40.6501;
        const REST_LNG = -74.0060;
        const GMAPS_KEY = Deno.env.get('GOOGLE_MAPS_SERVER_API_KEY');

        let kitchenEtaBadge: string;

        if (order.order_type === 'delivery' && order.delivery_address) {
          let driveMinutes: number | null = null;

          const zipMatch = (order.delivery_address as string).match(/\b(\d{5})\b/);
          if (zipMatch?.[1]) {
            const { data: zone } = await supabase
              .from('delivery_zones')
              .select('estimated_minutes')
              .eq('zip_code', zipMatch[1])
              .eq('is_active', true)
              .maybeSingle();
            if (zone?.estimated_minutes) driveMinutes = zone.estimated_minutes;
          }

          if (!driveMinutes && GMAPS_KEY) {
            try {
              const gcRes = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(order.delivery_address)}&key=${GMAPS_KEY}`
              );
              const gcData = await gcRes.json();
              if (gcData.status === 'OK' && gcData.results?.[0]) {
                const { lat, lng } = gcData.results[0].geometry.location;
                const dmRes = await fetch(
                  `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${REST_LAT},${REST_LNG}&destinations=${lat},${lng}&mode=driving&departure_time=now&traffic_model=best_guess&key=${GMAPS_KEY}`
                );
                const dmData = await dmRes.json();
                const el = dmData?.rows?.[0]?.elements?.[0];
                if (el?.status === 'OK') {
                  driveMinutes = Math.ceil((el.duration_in_traffic?.value ?? el.duration?.value ?? 0) / 60);
                }
              }
            } catch (e) {
              console.warn('[WEBHOOK] Kitchen ETA calculation failed (non-critical):', e);
            }
          }

          if (driveMinutes) {
            const totalMinutes = ETA_PREP + driveMinutes;
            const etaDate = new Date(Date.now() + totalMinutes * 60 * 1000);
            const etaTime = etaDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
            kitchenEtaBadge = `🛵 Deliver by ${etaTime} (~${totalMinutes} min)`;
          } else {
            kitchenEtaBadge = '🛵 Target: 35–50 min delivery';
          }
        } else {
          const pickupMinutes = 20;
          const pickupDate = new Date(Date.now() + pickupMinutes * 60 * 1000);
          const pickupTime = pickupDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
          kitchenEtaBadge = `🏃 Ready by ${pickupTime} (~${pickupMinutes} min)`;
        }
        // ──────────────────────────────────────────────────────────────────────

        const deliveryRow = order.order_type === 'delivery' && order.delivery_address
          ? `<p style="margin:6px 0 0;font-size:13px;color:#666;">📍 ${esc(order.delivery_address)}</p>`
          : '';

        const notesRow = order.notes
          ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:12px;">
              <tr>
                <td style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;padding:10px 14px;font-size:13px;color:#555;">
                  📝 <strong>Note:</strong> ${esc(order.notes)}
                </td>
              </tr>
            </table>`
          : '';

        const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>New Order Alert — Ricos Tacos Kitchen</title>
</head>
<body style="margin:0;padding:0;background:#FFF5EE;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#FFF5EE;">
<tr><td align="center" style="padding:20px 12px;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
    style="max-width:520px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.09);">

    <!-- Hero illustration -->
    <tr>
      <td style="background:#C9D8AE;padding:22px 24px 18px;text-align:center;border-bottom:1px solid #B4C698;">
        <img src="${HERO_URL}" alt="Ricos Tacos" width="240" height="240"
          style="display:block;margin:0 auto 14px;width:240px;height:240px;border-radius:14px;box-shadow:0 4px 16px rgba(0,0,0,.14);">
        <p style="margin:0 0 4px;font-size:22px;color:#2D5016;font-weight:800;letter-spacing:.01em;font-family:Georgia,serif;">Ricos Tacos</p>
        <p style="margin:0 0 8px;font-size:11px;color:#4A5E2A;letter-spacing:.16em;text-transform:uppercase;font-weight:700;">Kitchen Alert</p>
        <p style="margin:0;display:inline-block;background:#2D5016;color:#fff;font-size:12px;font-weight:700;padding:4px 14px;border-radius:20px;">
          ${kitchenEtaBadge}
        </p>
      </td>
    </tr>

    <!-- Serape stripe -->
    <tr><td style="padding:0;">${SERAPE_STRIPE}</td></tr>

    <!-- Alert banner -->
    <tr>
      <td style="background:#E31E24;padding:22px 24px 18px;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,.75);letter-spacing:.12em;text-transform:uppercase;">New Order — Action Required</p>
        <h2 style="margin:0 0 10px;color:#fff;font-size:26px;font-weight:700;letter-spacing:-.3px;">🚨 #${esc(order.order_number)}</h2>
        <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 auto;">
          <tr>
            <td style="background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.35);border-radius:20px;padding:5px 16px;">
              <span style="font-size:13px;color:#fff;font-weight:600;">${order.order_type === 'delivery' ? '🚗 Delivery' : '🏪 Pickup'} &nbsp;·&nbsp; $${Number(order.total).toFixed(2)}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Customer info -->
    <tr>
      <td style="background:#FFF8F5;border-bottom:1px solid #FAE8E0;padding:16px 24px;">
        <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1A1A1A;">${esc(order.customer_name)}</p>
        <p style="margin:0;font-size:14px;">
          <a href="tel:${esc(order.customer_phone.replace(/\D/g,''))}"
            style="color:#E31E24;text-decoration:none;font-weight:600;font-size:15px;">${esc(order.customer_phone)}</a>
        </p>
        ${deliveryRow}
      </td>
    </tr>

    <!-- Items -->
    <tr>
      <td style="padding:20px 24px 0;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#AAA;letter-spacing:.12em;text-transform:uppercase;">Order Items</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
          style="border-radius:8px;overflow:hidden;border:1px solid #F0EDE8;">
          <tr style="background:#F5F1EB;">
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;letter-spacing:.08em;text-transform:uppercase;font-weight:600;">Item</th>
            <th style="padding:8px 12px;text-align:center;font-size:11px;color:#888;letter-spacing:.08em;text-transform:uppercase;font-weight:600;" width="48">Qty</th>
            <th style="padding:8px 12px;text-align:right;font-size:11px;color:#888;letter-spacing:.08em;text-transform:uppercase;font-weight:600;" width="80">Price</th>
          </tr>
          ${itemsHtml}
        </table>
        ${notesRow}
      </td>
    </tr>

    <!-- Total -->
    <tr>
      <td style="padding:0 24px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
          style="margin-top:8px;border-top:2px solid #F0EDE8;background:#FFF5EE;border-radius:0 0 8px 8px;">
          <tr>
            <td style="padding:14px 12px;font-size:18px;font-weight:700;color:#1A1A1A;">Total</td>
            <td style="padding:14px 12px;font-size:18px;font-weight:700;text-align:right;color:#E31E24;">$${Number(order.total).toFixed(2)}</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:20px 24px 24px;">
        <a href="${SITE_URL}/kitchen"
          style="display:block;background:#E31E24;color:#fff;text-align:center;padding:16px 20px;border-radius:7px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:.02em;">
          Open Kitchen Dashboard →
        </a>
      </td>
    </tr>

    <!-- Serape stripe -->
    <tr><td style="padding:0;">${SERAPE_STRIPE}</td></tr>

    <!-- Footer -->
    <tr>
      <td style="background:#E31E24;padding:18px 24px;text-align:center;">
        <p style="margin:0;font-size:12px;color:rgba(255,255,255,.7);">Ricos Tacos Brooklyn &nbsp;·&nbsp; 505 51st Street, Brooklyn NY 11220</p>
      </td>
    </tr>

  </table>
</td></tr>
</table>

</body>
</html>`;

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
async function handlePaidOrder(
  orderNumber: string,
  stripeEventId: string,
  eventType: string,
): Promise<void> {
  // 1. Idempotency gate — INSERT the event ID; unique constraint fires on retry.
  //    Stripe retries on timeout or 5xx; this prevents duplicate SMS/email/status
  //    flips when both payment_intent.succeeded and checkout.session.completed
  //    arrive for the same order, or when Stripe retries a slow delivery.
  const { error: dedupError } = await supabase
    .from('webhook_events')
    .insert({
      stripe_event_id: stripeEventId,
      event_type: eventType,
      order_number: orderNumber,
      success: false,
    });

  if (dedupError) {
    if (dedupError.code === '23505') {
      // Unique violation — this event was already processed successfully.
      console.log('[WEBHOOK] Duplicate event skipped:', stripeEventId);
      return;
    }
    // Any other error: log but continue so the order is never silently dropped.
    console.error('[WEBHOOK] webhook_events insert failed (continuing):', dedupError.message);
  }

  // 2. Update order status to 'paid' — only if still 'pending'.
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
  if (!updated || updated.length === 0) {
    console.log('[WEBHOOK] Order already paid, skipping notifications:', orderNumber);
    // Still mark the event record as success so it won't be retried.
    await supabase
      .from('webhook_events')
      .update({ success: true })
      .eq('stripe_event_id', stripeEventId);
    return;
  }

  console.log('[WEBHOOK] Order status set to paid:', orderNumber);

  // 2. Email + SMS the restaurant — primary reliable notification channel.
  //    Runs even if the kitchen browser tab is closed.
  await notifyRestaurant(orderNumber);

  // 3. Customer order confirmation email — server-side so it's auth-gated and deduped.
  try {
    const { error: confErr } = await supabase.functions.invoke('send-order-confirmation', {
      body: { orderNumber },
    });
    if (confErr) {
      console.warn('[WEBHOOK] Customer confirmation email failed (non-critical):', confErr);
    } else {
      console.log('[WEBHOOK] Customer confirmation email sent for order:', orderNumber);
    }
  } catch (confErr) {
    console.warn('[WEBHOOK] Customer confirmation email threw (non-critical):', confErr);
  }

  // 4. Web push to kitchen/admin staff — secondary channel (browser tab must be open).
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

  // 5. Mark event as fully processed — future duplicates will be skipped at step 1.
  await supabase
    .from('webhook_events')
    .update({ success: true })
    .eq('stripe_event_id', stripeEventId);

  console.log('[WEBHOOK] Event processed successfully:', stripeEventId);
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
        backgroundWork = handlePaidOrder(orderNumber, event.id, event.type);
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
      backgroundWork = handlePaidOrder(orderNumber, event.id, event.type);
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
