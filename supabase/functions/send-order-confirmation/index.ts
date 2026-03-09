import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderConfirmationRequest {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderType: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  deliveryAddress?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured - email not sent (testing mode)");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Email service not configured. Set up RESEND_API_KEY to enable email notifications." 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resend = new Resend(resendApiKey);
    const orderData: OrderConfirmationRequest = await req.json();

    const itemsList = orderData.items
      .map(
        (item) =>
          `<tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
              <strong>${item.name}</strong><br>
              <span style="color: #666;">$${item.price.toFixed(2)} × ${item.quantity}</span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
              <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
            </td>
          </tr>`
      )
      .join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">¡Gracias! Order Confirmed</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your payment was successful</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #d97706;">
              <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">Order Number</p>
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #d97706; font-family: 'Courier New', monospace;">${orderData.orderNumber}</p>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
                ${orderData.orderType === "delivery" ? "🚗 Delivery Order" : "🏪 Pickup Order"}
              </p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #333;">Customer Information</h2>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${orderData.customerName}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${orderData.customerEmail}</p>
              ${orderData.deliveryAddress ? `<p style="margin: 5px 0;"><strong>Delivery Address:</strong> ${orderData.deliveryAddress}</p>` : ''}
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #333;">Order Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                ${itemsList}
                <tr>
                  <td style="padding: 12px; border-top: 2px solid #333;">Subtotal</td>
                  <td style="padding: 12px; text-align: right; border-top: 2px solid #333;">$${orderData.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px;">Tax</td>
                  <td style="padding: 12px; text-align: right;">$${orderData.tax.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border-top: 2px solid #333; font-size: 18px;"><strong>Total Paid</strong></td>
                  <td style="padding: 12px; text-align: right; border-top: 2px solid #333; font-size: 18px; color: #d97706;"><strong>$${orderData.total.toFixed(2)}</strong></td>
                </tr>
              </table>
            </div>

            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #d97706;">
              <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #333;">What's Next?</h3>
              <ul style="margin: 0; padding-left: 20px;">
                ${orderData.orderType === "delivery" 
                  ? `
                    <li>Your order is being prepared by our kitchen</li>
                    <li>We'll notify you when it's out for delivery</li>
                    <li>Estimated delivery: 45-60 minutes</li>
                  `
                  : `
                    <li>Your order is being prepared by our kitchen</li>
                    <li>We'll notify you when it's ready for pickup</li>
                    <li>Estimated pickup time: 20-30 minutes</li>
                  `
                }
              </ul>
              <p style="margin: 15px 0 0 0; font-size: 14px;">Need help? Call us at (718) 555-TACO</p>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                Thank you for choosing Ricos Tacos!<br>
                <a href="https://ricostacosny.com" style="color: #d97706; text-decoration: none;">Visit our website</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Ricos Tacos <onboarding@resend.dev>",
      to: [orderData.customerEmail],
      subject: `Order Confirmation - ${orderData.orderNumber}`,
      html: emailHtml,
    });

    console.log("Order confirmation email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Order confirmation email sent successfully"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending order confirmation email:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
