-- Add CHECK constraints to orders table to prevent data corruption from
-- crafted API calls or edge-function bugs. These run at the DB level and
-- cannot be bypassed by any client.
--
-- NOT VALID: constraints are added without scanning existing rows, so the
-- migration never fails due to historical data. They immediately enforce on
-- new inserts/updates. Run VALIDATE CONSTRAINT separately after confirming
-- existing data is clean (safe to do post-deploy, non-blocking in PG 14+).
ALTER TABLE public.orders
  ADD CONSTRAINT orders_total_positive   CHECK (total > 0)           NOT VALID,
  ADD CONSTRAINT orders_subtotal_nonneg  CHECK (subtotal >= 0)       NOT VALID,
  ADD CONSTRAINT orders_tax_nonneg       CHECK (tax >= 0)            NOT VALID,
  ADD CONSTRAINT orders_order_number_nonempty CHECK (order_number <> '') NOT VALID,
  ADD CONSTRAINT orders_customer_name_nonempty CHECK (customer_name <> '') NOT VALID,
  ADD CONSTRAINT orders_customer_phone_nonempty CHECK (customer_phone <> '') NOT VALID;
