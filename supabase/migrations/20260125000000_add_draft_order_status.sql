-- Add 'draft' status to orders table for 2-phase commit pattern
-- This prevents orphaned orders when payments fail

-- Drop existing constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new constraint with 'draft' status
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('draft', 'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'));

-- Create index on draft orders for efficient cleanup
CREATE INDEX IF NOT EXISTS idx_orders_draft_status ON public.orders(status, created_at)
  WHERE status = 'draft';

-- Add comment explaining the draft status
COMMENT ON COLUMN public.orders.status IS
  'Order status: draft (payment not completed), pending (payment processing), confirmed (payment succeeded), preparing (kitchen started), ready (ready for pickup/delivery), completed (delivered/picked up), cancelled (order cancelled)';

-- Create function to auto-cleanup old draft orders (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_draft_orders()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete draft orders older than 1 hour
  DELETE FROM public.orders
  WHERE status = 'draft'
    AND created_at < NOW() - INTERVAL '1 hour';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (for manual cleanup if needed)
GRANT EXECUTE ON FUNCTION cleanup_old_draft_orders TO authenticated;

-- Add comment
COMMENT ON FUNCTION cleanup_old_draft_orders IS
  'Automatically deletes draft orders older than 1 hour to prevent database pollution from failed checkouts';
