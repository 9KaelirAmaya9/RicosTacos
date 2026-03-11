-- Add stripe_payment_intent_id to orders table.
-- This allows us to:
--   1. Detect and block duplicate charges (UNIQUE constraint)
--   2. Correlate Stripe events to DB orders in the webhook handler
--   3. Track payment intent status independently of order status

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- UNIQUE constraint prevents two orders from being linked to the same
-- payment intent, which would indicate a double-charge scenario.
ALTER TABLE public.orders
  ADD CONSTRAINT orders_stripe_payment_intent_id_unique
  UNIQUE (stripe_payment_intent_id);
