-- Fix archive_old_orders atomicity: replace INSERT+DELETE with a single CTE
-- that moves rows in one atomic statement. If the INSERT fails, the DELETE
-- never runs, so rows can never be lost from both tables simultaneously.
CREATE OR REPLACE FUNCTION public.archive_old_orders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  WITH moved AS (
    DELETE FROM public.orders
    WHERE status IN ('completed', 'cancelled', 'ready')
      AND created_at < NOW() - INTERVAL '90 days'
    RETURNING *
  )
  INSERT INTO public.orders_archive
  SELECT * FROM moved
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RAISE NOTICE 'Archived % old orders', archived_count;
  RETURN archived_count;
END;
$$;

REVOKE ALL ON FUNCTION public.archive_old_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.archive_old_orders() TO service_role;
