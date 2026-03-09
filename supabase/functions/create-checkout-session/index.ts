import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Allow both authenticated and anonymous users for checkout
    // But validate the request data to prevent abuse
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    // If auth header exists, verify it (optional for guest checkout)
    if (authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const { items, orderType, customerInfo, orderNumber } = await req.json();

    // Validate input parameters (allows guest checkout)
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("No items provided");
    }
    if (!orderNumber || typeof orderNumber !== 'string') {
      throw new Error("Valid order number is required");
    }
    if (!orderType || !['pickup', 'delivery'].includes(orderType)) {
      throw new Error("Valid order type (pickup/delivery) is required");
    }
    if (!customerInfo || !customerInfo.name || !customerInfo.phone || !customerInfo.email) {
      throw new Error("Customer information is required (name, phone, email)");
    }

    // Validate items structure and reasonable limits to prevent abuse
    if (items.length > 50) {
      throw new Error("Too many items in order (max 50)");
    }

    for (const item of items) {
      if (!item.name || typeof item.price !== 'number' || item.price < 0 || item.price > 1000) {
        throw new Error("Invalid item data");
      }
      if (typeof item.quantity !== 'number' || item.quantity < 1 || item.quantity > 100) {
        throw new Error("Invalid item quantity");
      }
    }
    // Determine site origin for redirect URLs
    const origin = req.headers.get('origin') || 'https://1c5a3260-4d54-412b-b8f8-4af54564df01.lovableproject.com';

    // Create line items for Stripe (omit product images to avoid URL issues)
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add delivery fee if applicable
    if (orderType === 'delivery') {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Delivery Fee',
          },
          unit_amount: 500, // $5.00 delivery fee
        },
        quantity: 1,
      });
    }

    

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/cart?success=true&order_number=${orderNumber}`,
      cancel_url: `${origin}/cart?canceled=true`,
      customer_email: customerInfo.email,
      metadata: {
        order_number: orderNumber,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        order_type: orderType,
        delivery_address: customerInfo.address || '',
      },
    });

    return new Response(
      JSON.stringify({ url: session.url, id: session.id, publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY') || undefined }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});