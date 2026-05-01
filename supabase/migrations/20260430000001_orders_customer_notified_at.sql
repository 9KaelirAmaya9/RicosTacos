-- Add customer_notified_at to track when the "order ready" SMS was sent.
-- notify-order-ready checks this before sending so a kitchen retry or
-- double-tap never sends the customer a duplicate text message.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_notified_at TIMESTAMPTZ DEFAULT NULL;

-- Index so the check in notify-order-ready (IS NULL filter) is instant.
-- Note: cannot use CONCURRENTLY inside a migration transaction.
CREATE INDEX IF NOT EXISTS idx_orders_customer_notified_at
  ON public.orders (customer_notified_at)
  WHERE customer_notified_at IS NULL;
