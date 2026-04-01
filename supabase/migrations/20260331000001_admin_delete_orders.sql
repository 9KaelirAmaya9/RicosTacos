-- Allow admins to delete orders (needed for "Delete All Orders" in Admin dashboard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders'
    AND cmd = 'DELETE'
    AND policyname = 'Admins can delete orders'
  ) THEN
    CREATE POLICY "Admins can delete orders"
      ON orders FOR DELETE
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'::app_role));
    RAISE NOTICE 'Created admin DELETE policy for orders';
  ELSE
    RAISE NOTICE 'Admin DELETE policy for orders already exists';
  END IF;
END $$;
