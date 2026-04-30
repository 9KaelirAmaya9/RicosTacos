-- Add unique constraint on endpoint so upsert patterns work correctly
-- and duplicate subscriptions can't accumulate in the table.
-- Uses IF NOT EXISTS guard so it's safe to re-run.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'push_subscriptions'::regclass
    AND contype = 'u'
    AND conname = 'push_subscriptions_endpoint_key'
  ) THEN
    ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);
    RAISE NOTICE 'Added unique constraint on push_subscriptions.endpoint';
  ELSE
    RAISE NOTICE 'Unique constraint already exists';
  END IF;
END $$;
