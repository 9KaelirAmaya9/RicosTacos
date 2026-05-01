-- Index on order_number for fast lookups.
-- Queried by: stripe-webhook, notify-order-ready, OrderSuccess page (fetchOrderWithRetry).
-- Without this, every webhook event does a full table scan — gets slower as orders accumulate.
-- CONCURRENTLY builds without locking the table.
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_order_number
  ON public.orders (order_number);
