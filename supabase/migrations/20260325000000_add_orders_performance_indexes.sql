-- Performance indexes for the orders table
-- These dramatically speed up the most common queries:
--   - Admin dashboard: orders sorted by created_at DESC
--   - Kitchen display: orders filtered by status
--   - AdminOrders: orders filtered by status + sorted by created_at
--   - Pending count: orders filtered by status IN (pending, paid, confirmed)
--
-- CONCURRENTLY means the index is built without locking the table,
-- so existing queries continue to work during the build.
-- Note: CONCURRENTLY cannot run inside a transaction block.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at
  ON public.orders (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status
  ON public.orders (status);

-- Composite index for the kitchen query: status filter + created_at sort
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_created_at
  ON public.orders (status, created_at ASC);
