import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyOrderReadyRequest {
  orderNumber: string;
  orderType: 'pickup' | 'delivery';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioFrom = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioSid || !twilioToken || !twilioFrom) {
      console.warn('[notify-order-ready] Twilio env vars not set — SMS skipped (non-fatal)');
      return new Response(
        JSON.stringify({ success: true, message: 'SMS skipped — Twilio not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Role enforcement: only kitchen and admin staff may trigger customer SMS ──
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Verify the caller's JWT and check their role
    const callerClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { data: roles } = await callerClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const allowedRoles = ['admin', 'kitchen'];
    const hasAccess = roles?.some((r: { role: string }) => allowedRoles.includes(r.role));
    if (!hasAccess) {
      console.warn('[notify-order-ready] Forbidden: user', user.id, 'has no kitchen/admin role');
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    // ─────────────────────────────────────────────────────────────────────────────

    const { orderNumber, orderType }: NotifyOrderReadyRequest = await req.json();

    if (!orderNumber || !orderType) {
      return new Response(
        JSON.stringify({ error: 'orderNumber and orderType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log('[notify-order-ready] Processing order:', orderNumber, 'type:', orderType);

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // ── Atomic idempotency: stamp customer_notified_at only if not yet set ──────
    // Using a conditional UPDATE prevents the TOCTOU race where two simultaneous
    // "ready" taps both read null and both send an SMS before either can write.
    const { data: stamped } = await supabase
      .from('orders')
      .update({ customer_notified_at: new Date().toISOString() })
      .eq('order_number', orderNumber)
      .is('customer_notified_at', null)
      .select('order_number, customer_name, customer_phone');

    if (!stamped || stamped.length === 0) {
      // Either the order doesn't exist or it was already notified — either way, skip
      console.log('[notify-order-ready] Already notified or order not found for', orderNumber, '— skipping');
      return new Response(
        JSON.stringify({ success: true, message: 'Already notified — skipped duplicate' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const order = stamped[0];

    if (!order.customer_phone) {
      console.warn('[notify-order-ready] No customer phone on order', orderNumber, '— SMS skipped');
      return new Response(
        JSON.stringify({ success: true, message: 'SMS skipped — no customer phone on file' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const customerName = order.customer_name ?? 'there';
    const restaurantPhone = Deno.env.get('RESTAURANT_PHONE_NUMBER') || '(718) 633-4816';

    const smsBody =
      orderType === 'pickup'
        ? `Hi ${customerName}! Your order #${orderNumber} from Ricos Tacos is ready for pickup! 🌮\nCome in anytime — we're at 349 Knickerbocker Ave, Brooklyn.\nQuestions? Call ${restaurantPhone}`
        : `Hi ${customerName}! Your order #${orderNumber} from Ricos Tacos is on its way! 🌮🚗\nEstimated arrival: 30-45 min.\nQuestions? Call ${restaurantPhone}`;

    try {
      const smsResp = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ From: twilioFrom, To: order.customer_phone, Body: smsBody }),
        },
      );

      if (smsResp.ok) {
        console.log('[notify-order-ready] SMS sent to customer:', order.customer_phone);
        return new Response(
          JSON.stringify({ success: true, message: 'SMS sent to customer' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      } else {
        const body = await smsResp.json().catch(() => ({}));
        console.error('[notify-order-ready] Twilio SMS error:', smsResp.status, JSON.stringify(body));
        return new Response(
          JSON.stringify({ error: 'Failed to send SMS', twilioStatus: smsResp.status }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    } catch (err) {
      console.error('[notify-order-ready] Twilio SMS exception:', err);
      return new Response(
        JSON.stringify({ error: 'SMS delivery exception' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[notify-order-ready] Unexpected error:', msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
