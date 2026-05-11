-- Allow admin users to read ALL menu items (including inactive) and update
-- prices/availability from the frontend AdminMenu page.
--
-- The existing "Anyone can view active menu items" policy stays for public
-- menu reads (active = true only). Postgres OR's multiple SELECT policies,
-- so admins satisfy either policy and get all rows.

CREATE POLICY "Admins can view all menu items"
  ON public.menu_items
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update menu items"
  ON public.menu_items
  FOR UPDATE
  TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
