
-- Disable the redundant order number trigger
-- The client already generates unique order numbers in the format ORD-YYYYMMDD-XXXX
-- This trigger's COUNT(*) query slows down as the table grows
DROP TRIGGER IF EXISTS trigger_set_order_number ON public.orders;

-- Keep the update_updated_at trigger as it's still useful
-- (already exists, no changes needed)

-- Add an index to speed up has_role() lookups in RLS policies
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles(user_id, role);

-- Add an index for order status lookups (used by kitchen RLS policy)
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Add an index for user_id lookups (used by user RLS policies)
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id) WHERE user_id IS NOT NULL;
