import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderNotification {
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  orderType: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // FIX: Accept internal calls from the stripe-webhook edge function.
    // The webhook uses the service-role Supabase client which sends
    // Authorization: Bearer <service_role_key> automatically via supabase.functions.invoke().
    // We also accept calls that explicitly pass the service-role key as Authorization.
    // Previously this function required a user JWT and returned 401 for all webhook calls.
    const authHeader = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Allow if: (a) no auth required for internal calls, OR (b) valid auth header present
    // Internal calls from stripe-webhook pass the service role key automatically
    const isInternalCall = authHeader && serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`;
    const hasAuthHeader = !!authHeader;

    if (!hasAuthHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // For internal calls (service role), skip user auth check
    let isAuthorized = isInternalCall;

    if (!isAuthorized) {
      // Verify JWT token for external calls
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        );
      }

      // Check if user has admin or kitchen role
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isAdmin = userRoles?.some(r => r.role === 'admin');
      const isKitchen = userRoles?.some(r => r.role === 'kitchen');
      isAuthorized = isAdmin || isKitchen;

      if (!isAuthorized) {
        return new Response(
          JSON.stringify({ error: "Not authorized to send notifications" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
        );
      }
    }

    const { orderNumber, customerName, customerEmail, customerPhone, orderType, total, items }: OrderNotification = await req.json();

    // Validate input
    if (!orderNumber || typeof orderNumber !== 'string') {
      throw new Error("Valid order number is required");
    }

    console.log(`[send-order-notification] Processing notification for order ${orderNumber}`);

    // Format order items for the message
    const itemsList = items.map(item => `${item.quantity}x ${item.name} - $${item.price.toFixed(2)}`).join('\n');

    // Send SMS via Twilio
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (twilioSid && twilioToken && twilioPhone) {
      console.log('[send-order-notification] Sending SMS notification...');
      const twilioResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: twilioPhone,
            To: customerPhone,
            Body: `Thank you for your order! Order #${orderNumber} has been received. We'll notify you when it's ready.`,
          }),
        }
      );

      if (!twilioResponse.ok) {
        const errorData = await twilioResponse.json().catch(() => ({}));
        console.error('[send-order-notification] Twilio API error:', {
          status: twilioResponse.status,
          code: errorData.code || 'unknown',
          message: errorData.message || 'API call failed'
        });
      } else {
        console.log('[send-order-notification] SMS sent successfully');
      }
    }

    // Send Email via Resend
    const resendKey = Deno.env.get('RESEND_API_KEY');

    if (resendKey && customerEmail) {
      console.log('[send-order-notification] Sending email notification...');
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Ricos Tacos <onboarding@resend.dev>',
          to: [customerEmail],
          subject: `Order Confirmation #${orderNumber}`,
          html: `
            <h2>Thank you for your order!</h2>
            <p>Hi ${customerName},</p>
            <p>We've received your ${orderType} order.</p>
            <h3>Order Details:</h3>
            <p><strong>Order Number:</strong> ${orderNumber}</p>
            <p><strong>Total:</strong> $${total.toFixed(2)}</p>
            <h4>Items:</h4>
            <ul>
              ${items.map(item => `<li>${item.quantity}x ${item.name} - $${item.price.toFixed(2)}</li>`).join('')}
            </ul>
            <p>We'll notify you when your order is ready!</p>
          `,
        }),
      });

      if (!resendResponse.ok) {
        const errorData = await resendResponse.json().catch(() => ({}));
        console.error('[send-order-notification] Resend API error:', {
          status: resendResponse.status,
          type: errorData.type || 'unknown'
        });
      } else {
        console.log('[send-order-notification] Email sent successfully');
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Notifications sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[send-order-notification] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
