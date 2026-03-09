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
    
    // Verify webhook signature using async method
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret || ''
    );

    console.log('Webhook event type:', event.type);

    // Handle payment_intent.succeeded (for PaymentIntent flow)
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderNumber = paymentIntent.metadata?.order_number;

      if (orderNumber) {
        // Order is already created with status 'pending', keep it as pending for kitchen workflow
        // The order will be processed by kitchen staff
        console.log('Payment succeeded for order:', orderNumber);
        
        // Get order details for notification
        const { data: order } = await supabase
          .from('orders')
          .select('*')
          .eq('order_number', orderNumber)
          .single();

        if (order) {
          // Send notification to kitchen (internal call - no auth needed)
          try {
            await supabase.functions.invoke('send-order-notification', {
              body: {
                orderNumber: order.order_number,
                customerName: order.customer_name,
                customerEmail: order.customer_email,
                customerPhone: order.customer_phone,
                orderType: order.order_type,
                total: order.total,
                items: order.items,
              },
              headers: {
                'x-internal-call': 'true'
              }
            });
            console.log('Notification sent for order:', orderNumber);
          } catch (notifError) {
            console.error('Failed to send notification:', notifError);
          }
        }
      }
    }

    // Handle the checkout.session.completed event (for Checkout Session flow)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderNumber = session.metadata?.order_number;

      if (!orderNumber) {
        console.error('No order number in session metadata');
        return new Response(
          JSON.stringify({ error: 'No order number found' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Order is already created with status 'pending', keep it as pending for kitchen workflow
      // The order will be processed by kitchen staff
      console.log('Checkout session completed for order:', orderNumber);

      // Get order details for notification
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();

      if (order) {
        // Send notification (internal call - no auth needed)
        try {
          await supabase.functions.invoke('send-order-notification', {
            body: {
              orderNumber: order.order_number,
              customerName: order.customer_name,
              customerEmail: order.customer_email,
              customerPhone: order.customer_phone,
              orderType: order.order_type,
              total: order.total,
              items: order.items,
            },
            headers: {
              'x-internal-call': 'true'
            }
          });
          console.log('Notification sent for order:', orderNumber);
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
        }
      }

      console.log('Order updated successfully:', orderNumber);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: corsHeaders }
    );
  }
});