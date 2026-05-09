import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const esc = (s: string): string =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

const RED       = '#E31E24';
const CREAM_BG  = '#F9F5EC'; // matches logo background
const WARM_BG   = '#FFF5EE'; // page background
const GOLD      = '#C8920A';

// Email-safe serape stripe — table cells instead of CSS gradient (Outlook compat)
const SERAPE = `
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
  <tr>
    <td width="20%" height="6" style="background:#E31E24;font-size:0;line-height:0;">&nbsp;</td>
    <td width="20%" height="6" style="background:#F59E0B;font-size:0;line-height:0;">&nbsp;</td>
    <td width="20%" height="6" style="background:#16A34A;font-size:0;line-height:0;">&nbsp;</td>
    <td width="20%" height="6" style="background:#1D4ED8;font-size:0;line-height:0;">&nbsp;</td>
    <td width="20%" height="6" style="background:#E31E24;font-size:0;line-height:0;">&nbsp;</td>
  </tr>
</table>`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://losricostacos.com';
  const LOGO_URL = `${SITE_URL}/logo.png`;

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("[confirmation] RESEND_API_KEY not set — skipping");
      return new Response(JSON.stringify({ success: false, message: "Email service not configured" }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[confirmation] Missing runtime env vars");
      return new Response(JSON.stringify({ success: false, message: "Service misconfigured" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { orderNumber } = await req.json();
    if (!orderNumber) {
      return new Response(JSON.stringify({ success: false, message: "orderNumber required" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: order, error } = await adminClient
      .from("orders")
      .select("order_number, customer_name, customer_email, customer_phone, order_type, delivery_address, items, subtotal, tax, total, notes")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (error || !order) {
      console.warn("[confirmation] Order not found:", orderNumber);
      return new Response(JSON.stringify({ success: false, message: "Order not found" }), {
        status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!order.customer_email) {
      console.warn("[confirmation] No email on file for order:", orderNumber);
      return new Response(JSON.stringify({ success: false, message: "No customer email on file" }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const items: Array<{ name: string; price: number; quantity: number }> =
      Array.isArray(order.items) ? order.items : [];
    const isDelivery = order.order_type === 'delivery';
    const subtotal   = Number(order.subtotal);
    const tax        = Number(order.tax);
    const total      = Number(order.total);
    const deliveryFee = total - subtotal - tax;

    // Item rows — alternating warm tint for readability
    const itemRows = items.map((item, i) =>
      `<tr style="background:${i % 2 === 0 ? '#FFFFFF' : '#FFF9F5'};">
        <td style="padding:10px 12px;border-bottom:1px solid #F0EDE8;font-size:14px;color:#1A1A1A;">${esc(item.name)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F0EDE8;text-align:center;font-size:14px;color:#888;">${Number(item.quantity)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F0EDE8;text-align:right;font-size:14px;font-weight:600;color:#1A1A1A;">$${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
      </tr>`
    ).join('');

    const deliveryFeeRow = isDelivery && deliveryFee > 0.005
      ? `<tr>
          <td style="padding:6px 12px;font-size:14px;color:#666;" colspan="2">Delivery Fee</td>
          <td style="padding:6px 12px;font-size:14px;text-align:right;">$${deliveryFee.toFixed(2)}</td>
        </tr>`
      : '';

    const notesBlock = order.notes
      ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:10px;">
          <tr>
            <td style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;padding:10px 14px;font-size:13px;color:#555;">
              📝 <strong>Special instructions:</strong> ${esc(order.notes)}
            </td>
          </tr>
        </table>`
      : '';

    const whatNextContent = isDelivery
      ? `<p style="margin:0 0 7px;font-size:14px;color:#333;">🍳 Our kitchen is preparing your order now.</p>
         <p style="margin:0 0 7px;font-size:14px;color:#333;">🚗 Estimated delivery time: <strong>45–60 minutes</strong></p>
         <p style="margin:0;font-size:14px;color:#333;">📍 Delivering to: ${order.delivery_address ? esc(order.delivery_address) : 'your address'}</p>`
      : `<p style="margin:0 0 7px;font-size:14px;color:#333;">🍳 Our kitchen is preparing your order now.</p>
         <p style="margin:0 0 7px;font-size:14px;color:#333;">⏱ Ready for pickup in about <strong>20–30 minutes</strong></p>
         <p style="margin:0;font-size:14px;color:#333;">📍 Pick up at: <strong>505 51st Street, Brooklyn NY 11220</strong></p>`;

    const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Order Confirmed — Ricos Tacos</title>
</head>
<body style="margin:0;padding:0;background:${WARM_BG};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center"><![endif]-->
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:${WARM_BG};">
<tr><td align="center" style="padding:24px 12px;">

  <!-- Email card -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
    style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.09);">

    <!-- ── Logo header (cream bg to match logo) ── -->
    <tr>
      <td style="background:${CREAM_BG};padding:28px 24px 20px;text-align:center;border-bottom:1px solid #EDE8DC;">
        <img src="${LOGO_URL}" alt="Ricos Tacos" width="120" height="120"
          style="display:block;margin:0 auto 12px;width:120px;height:120px;object-fit:contain;border-radius:8px;">
        <p style="margin:0;font-size:11px;color:${GOLD};letter-spacing:.14em;text-transform:uppercase;font-weight:600;">Auténtica Comida Mexicana</p>
      </td>
    </tr>

    <!-- ── Serape stripe ── -->
    <tr><td style="padding:0;">${SERAPE}</td></tr>

    <!-- ── Order confirmed banner ── -->
    <tr>
      <td style="background:${RED};padding:26px 24px 22px;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,.75);letter-spacing:.12em;text-transform:uppercase;">Payment Successful</p>
        <h1 style="margin:0 0 12px;color:#fff;font-size:28px;font-weight:700;letter-spacing:-.4px;">Order Confirmed ✓</h1>
        <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 auto;">
          <tr>
            <td style="background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.35);border-radius:20px;padding:6px 18px;">
              <span style="font-size:13px;color:#fff;font-weight:600;">${isDelivery ? '🚗 Delivery' : '🏪 Pickup'} &nbsp;·&nbsp; ${esc(order.customer_name)}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ── Order number ── -->
    <tr>
      <td style="background:#FFF8F5;border-bottom:1px solid #FAE8E0;padding:20px 24px;text-align:center;">
        <p style="margin:0 0 6px;font-size:11px;color:#AAA;letter-spacing:.12em;text-transform:uppercase;">Your Order Number</p>
        <p style="margin:0;font-size:32px;font-weight:700;color:${RED};font-family:'Courier New',Courier,monospace;letter-spacing:.05em;">${esc(order.order_number)}</p>
      </td>
    </tr>

    <!-- ── Items ── -->
    <tr>
      <td style="padding:24px 24px 0;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#AAA;letter-spacing:.12em;text-transform:uppercase;">Your Order</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
          style="border-radius:8px;overflow:hidden;border:1px solid #F0EDE8;">
          <tr style="background:#F5F1EB;">
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;letter-spacing:.08em;text-transform:uppercase;font-weight:600;">Item</th>
            <th style="padding:8px 12px;text-align:center;font-size:11px;color:#888;letter-spacing:.08em;text-transform:uppercase;font-weight:600;" width="48">Qty</th>
            <th style="padding:8px 12px;text-align:right;font-size:11px;color:#888;letter-spacing:.08em;text-transform:uppercase;font-weight:600;" width="80">Price</th>
          </tr>
          ${itemRows}
        </table>
        ${notesBlock}
      </td>
    </tr>

    <!-- ── Totals ── -->
    <tr>
      <td style="padding:16px 24px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
          style="border-top:2px solid #F0EDE8;">
          <tr>
            <td style="padding:10px 12px 4px;font-size:14px;color:#666;" colspan="2">Subtotal</td>
            <td style="padding:10px 12px 4px;font-size:14px;text-align:right;">$${subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:4px 12px;font-size:14px;color:#666;" colspan="2">Tax (NYC 8.875%)</td>
            <td style="padding:4px 12px;font-size:14px;text-align:right;">$${tax.toFixed(2)}</td>
          </tr>
          ${deliveryFeeRow}
          <tr style="background:#FFF5EE;border-top:2px solid #F0EDE8;">
            <td style="padding:14px 12px;font-size:18px;font-weight:700;color:#1A1A1A;" colspan="2">Total Paid</td>
            <td style="padding:14px 12px;font-size:18px;font-weight:700;text-align:right;color:${RED};">$${total.toFixed(2)}</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ── What's next ── -->
    <tr>
      <td style="padding:20px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
          <tr>
            <td style="background:#FFF5EE;border-left:4px solid ${RED};border-radius:0 8px 8px 0;padding:16px 20px;">
              <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:${RED};letter-spacing:.1em;text-transform:uppercase;">What Happens Next?</p>
              ${whatNextContent}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ── CTA ── -->
    <tr>
      <td style="padding:0 24px 28px;text-align:center;">
        <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 auto;">
          <tr>
            <td style="background:${RED};border-radius:7px;">
              <a href="${esc(SITE_URL)}/order"
                style="display:inline-block;background:${RED};color:#fff;font-weight:700;font-size:14px;padding:14px 40px;border-radius:7px;text-decoration:none;letter-spacing:.03em;">
                Order Again →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ── Serape stripe ── -->
    <tr><td style="padding:0;">${SERAPE}</td></tr>

    <!-- ── Footer ── -->
    <tr>
      <td style="background:${RED};padding:24px;text-align:center;">
        <img src="${LOGO_URL}" alt="Ricos Tacos" width="56" height="56"
          style="display:block;margin:0 auto 12px;width:56px;height:56px;object-fit:contain;border-radius:6px;opacity:.92;">
        <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#fff;">Ricos Tacos Brooklyn</p>
        <p style="margin:0 0 3px;font-size:12px;color:rgba(255,255,255,.75);">505 51st Street, Brooklyn NY 11220</p>
        <p style="margin:0 0 10px;font-size:12px;">
          <a href="tel:7186334816" style="color:rgba(255,255,255,.9);text-decoration:none;">(718) 633-4816</a>
          <span style="color:rgba(255,255,255,.4);">&nbsp;·&nbsp;</span>
          <span style="color:rgba(255,255,255,.7);">Open 9 AM – 2 AM daily</span>
        </p>
        <p style="margin:0;font-size:10px;color:rgba(255,255,255,.5);letter-spacing:.12em;text-transform:uppercase;">From Puebla. For Brooklyn.</p>
      </td>
    </tr>

  </table>
  <!-- End email card -->

</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->

</body>
</html>`;

    const resend = new Resend(resendApiKey);
    const { error: sendErr } = await resend.emails.send({
      from: "Ricos Tacos <orders@losricostacos.com>",
      to: [order.customer_email],
      subject: `Order Confirmed ✓ — #${esc(order.order_number)} | Ricos Tacos Brooklyn`,
      html,
    });

    if (sendErr) {
      console.error("[confirmation] Resend error:", sendErr);
      return new Response(JSON.stringify({ success: false, error: String(sendErr) }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("[confirmation] Sent to:", order.customer_email, "for order:", orderNumber);
    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("[confirmation] Unhandled error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
