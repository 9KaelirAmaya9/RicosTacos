import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Rate Limiter ─────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, number[]>();
function isRateLimited(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) ?? []).filter(t => now - t < windowMs);
  if (timestamps.length >= maxRequests) return true;
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return false;
}
// ─────────────────────────────────────────────────────────────────────────────

const MAX_REQUESTS = 5;
const WINDOW_MS = 60_000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (isRateLimited(clientIp, MAX_REQUESTS, WINDOW_MS)) {
    return new Response(JSON.stringify({ error: "Too many requests. Please wait and try again." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
    });
  }

  try {
    const { code, orderAmount } = await req.json();

    if (!code || typeof code !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Coupon code is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // orderAmount must be a real positive number — without this check a crafted
    // request can pass undefined/null (coerces to 0) and bypass any minimum order
    // amount requirement, making coupons apply to $0 orders.
    const orderTotal = Number(orderAmount);
    if (!orderAmount || isNaN(orderTotal) || orderTotal <= 0) {
      return new Response(
        JSON.stringify({ error: 'A valid order amount is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find active coupon
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .single();

    if (error || !coupon) {
      return new Response(
        JSON.stringify({ 
          valid: false,
          error: 'Invalid or expired coupon code'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Check validity dates
    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return new Response(
        JSON.stringify({ 
          valid: false,
          error: 'Coupon is not yet valid'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return new Response(
        JSON.stringify({ 
          valid: false,
          error: 'Coupon has expired'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Check minimum order amount
    if (coupon.min_order_amount && orderTotal < coupon.min_order_amount) {
      return new Response(
        JSON.stringify({ 
          valid: false,
          error: `Minimum order amount of $${coupon.min_order_amount} required`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return new Response(
        JSON.stringify({ 
          valid: false,
          error: 'Coupon has reached its usage limit'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (orderTotal * coupon.discount_value) / 100;
      if (coupon.max_discount_amount) {
        discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
      }
    } else {
      discountAmount = coupon.discount_value;
    }

    // Ensure discount doesn't exceed order total
    discountAmount = Math.min(discountAmount, orderTotal);

    return new Response(
      JSON.stringify({
        valid: true,
        coupon: {
          code: coupon.code,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value,
          discount_amount: discountAmount,
          description: coupon.description,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error validating coupon:', error);
    return new Response(
      JSON.stringify({ 
        valid: false,
        error: 'Failed to validate coupon code'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

