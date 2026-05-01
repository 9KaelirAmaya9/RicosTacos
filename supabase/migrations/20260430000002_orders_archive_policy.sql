-- Archive table for completed orders older than 90 days.
-- Keeps the live orders table lean so kitchen/admin queries stay fast forever.
CREATE TABLE IF NOT EXISTS public.orders_archive (
  LIKE public.orders INCLUDING ALL
);

-- RLS: only admins can read the archive
ALTER TABLE public.orders_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read order archive"
  ON public.orders_archive FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function: move completed/cancelled orders older than 90 days to archive
CREATE OR REPLACE FUNCTION public.archive_old_orders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Insert old orders into archive
  INSERT INTO public.orders_archive
  SELECT * FROM public.orders
  WHERE status IN ('completed', 'cancelled', 'ready')
    AND created_at < NOW() - INTERVAL '90 days'
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS archived_count = ROW_COUNT;

  -- Delete them from the live table
  DELETE FROM public.orders
  WHERE status IN ('completed', 'cancelled', 'ready')
    AND created_at < NOW() - INTERVAL '90 days';

  RAISE NOTICE 'Archived % old orders', archived_count;
  RETURN archived_count;
END;
$$;

-- Grant execute to service role only
REVOKE ALL ON FUNCTION public.archive_old_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.archive_old_orders() TO service_role;
