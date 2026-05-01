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

    const { orderNumber, orderType }: NotifyOrderReadyRequest = await req.json();

    if (!orderNumber || !orderType) {
      return new Response(
        JSON.stringify({ error: 'orderNumber and orderType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log('[notify-order-ready] Processing order:', orderNumber, 'type:', orderType);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: order, error } = await supabase
      .from('orders')
      .select('order_number, customer_name, customer_phone, order_type, customer_notified_at')
      .eq('order_number', orderNumber)
      .single();

    if (error || !order) {
      console.error('[notify-order-ready] Could not fetch order:', error?.message);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Idempotency guard — never send the customer two "ready" texts
    if (order.customer_notified_at) {
      console.log('[notify-order-ready] Already notified for order', orderNumber, 'at', order.customer_notified_at, '— skipping');
      return new Response(
        JSON.stringify({ success: true, message: 'Already notified — skipped duplicate' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

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

        // Stamp the order so duplicate calls are rejected
        await supabase
          .from('orders')
          .update({ customer_notified_at: new Date().toISOString() })
          .eq('order_number', orderNumber);

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
