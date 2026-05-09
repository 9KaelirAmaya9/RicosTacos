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

const RED = '#E31E24';

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://losricostacos.com';

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
    const subtotal = Number(order.subtotal);
    const tax = Number(order.tax);
    const total = Number(order.total);
    const deliveryFee = total - subtotal - tax;

    const itemRows = items.map(item =>
      `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;">${esc(item.name)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:center;color:#888;font-size:14px;">${Number(item.quantity)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;font-size:14px;">$${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
      </tr>`
    ).join('');

    const deliveryFeeRow = isDelivery && deliveryFee > 0.005
      ? `<tr>
          <td style="padding:5px 12px;color:#666;font-size:14px;" colspan="2">Delivery Fee</td>
          <td style="padding:5px 12px;text-align:right;font-size:14px;">$${deliveryFee.toFixed(2)}</td>
        </tr>`
      : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Order Confirmed — Ricos Tacos</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#333;">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.07);">

  <!-- Header -->
  <div style="background:${RED};padding:32px 24px 28px;text-align:center;">
    <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,.75);letter-spacing:.1em;text-transform:uppercase;">Ricos Tacos Brooklyn</p>
    <h1 style="margin:0 0 8px;color:#fff;font-size:28px;font-weight:700;letter-spacing:-.3px;">Order Confirmed ✓</h1>
    <p style="margin:0;color:rgba(255,255,255,.9);font-size:15px;">
      ${isDelivery ? '🚗 Delivery' : '🏪 Pickup'} &nbsp;·&nbsp; ${esc(order.customer_name)}
    </p>
  </div>

  <!-- Order number -->
  <div style="background:#fff8f8;border-bottom:1px solid #fde0e0;padding:18px 24px;text-align:center;">
    <p style="margin:0 0 5px;font-size:11px;color:#aaa;letter-spacing:.1em;text-transform:uppercase;">Your Order Number</p>
    <p style="margin:0;font-size:30px;font-weight:700;color:${RED};font-family:'Courier New',Courier,monospace;letter-spacing:.05em;">${esc(order.order_number)}</p>
  </div>

  <!-- Items -->
  <div style="padding:20px 24px 0;">
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#f8f8f8;">
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#aaa;letter-spacing:.08em;text-transform:uppercase;font-weight:600;border-bottom:1px solid #eee;">Item</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;color:#aaa;letter-spacing:.08em;text-transform:uppercase;font-weight:600;border-bottom:1px solid #eee;">Qty</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;color:#aaa;letter-spacing:.08em;text-transform:uppercase;font-weight:600;border-bottom:1px solid #eee;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>
  </div>

  ${order.notes ? `
  <div style="margin:12px 24px 0;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:10px 14px;font-size:13px;color:#555;">
    <strong>Special instructions:</strong> ${esc(order.notes)}
  </div>` : ''}

  <!-- Totals -->
  <div style="padding:4px 24px 20px;">
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr>
        <td style="padding:10px 12px 4px;color:#666;" colspan="2">Subtotal</td>
        <td style="padding:10px 12px 4px;text-align:right;">$${subtotal.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding:4px 12px;color:#666;" colspan="2">Tax (NYC 8.875%)</td>
        <td style="padding:4px 12px;text-align:right;">$${tax.toFixed(2)}</td>
      </tr>
      ${deliveryFeeRow}
      <tr style="border-top:2px solid #f0f0f0;">
        <td style="padding:12px 12px 0;font-weight:700;font-size:17px;" colspan="2">Total Paid</td>
        <td style="padding:12px 12px 0;text-align:right;font-weight:700;font-size:17px;color:${RED};">$${total.toFixed(2)}</td>
      </tr>
    </table>
  </div>

  <!-- What's next -->
  <div style="margin:4px 24px 24px;background:#fff8f8;border:1px solid #fde0e0;border-radius:8px;padding:20px;">
    <h3 style="margin:0 0 12px;font-size:15px;font-weight:600;color:#333;">What happens next?</h3>
    ${isDelivery ? `
    <p style="margin:0 0 8px;font-size:14px;color:#555;">🍳 Our kitchen is preparing your order now.</p>
    <p style="margin:0 0 8px;font-size:14px;color:#555;">🚗 Estimated delivery: <strong>45–60 minutes</strong></p>
    <p style="margin:0;font-size:14px;color:#555;">📍 Delivering to: ${order.delivery_address ? esc(order.delivery_address) : 'your address'}</p>
    ` : `
    <p style="margin:0 0 8px;font-size:14px;color:#555;">🍳 Our kitchen is preparing your order now.</p>
    <p style="margin:0 0 8px;font-size:14px;color:#555;">⏱ Ready for pickup in about <strong>20–30 minutes</strong></p>
    <p style="margin:0;font-size:14px;color:#555;">📍 Pick up at: <strong>505 51st Street, Brooklyn NY 11220</strong></p>
    `}
  </div>

  <!-- CTA -->
  <div style="text-align:center;padding:0 24px 28px;">
    <a href="${esc(SITE_URL)}/order" style="display:inline-block;background:${RED};color:#fff;font-weight:600;font-size:14px;padding:13px 32px;border-radius:7px;text-decoration:none;letter-spacing:.01em;">Order Again</a>
  </div>

  <!-- Footer -->
  <div style="background:#f8f8f8;border-top:1px solid #eee;padding:18px 24px;text-align:center;">
    <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#555;">Ricos Tacos Brooklyn</p>
    <p style="margin:0 0 4px;font-size:13px;color:#888;">505 51st Street, Brooklyn NY 11220</p>
    <p style="margin:0;font-size:13px;color:#888;">
      <a href="tel:7186334816" style="color:${RED};text-decoration:none;">(718) 633-4816</a>
      &nbsp;·&nbsp; Open 9 AM – 2 AM daily
    </p>
  </div>

</div>
</body>
</html>`;

    const resend = new Resend(resendApiKey);
    const { error: sendErr } = await resend.emails.send({
      from: "Ricos Tacos <orders@losricostacos.com>",
      to: [order.customer_email],
      subject: `Order Confirmed — #${esc(order.order_number)} | Ricos Tacos Brooklyn`,
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
