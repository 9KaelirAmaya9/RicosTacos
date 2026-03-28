-- ─────────────────────────────────────────────────────────────────────────────
-- Fix: has_role() evaluated per-row in RLS policies → orders SELECT times out
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Root cause:  has_role(auth.uid(), 'admin') in a USING clause is a VOLATILE
-- function.  PostgreSQL re-evaluates it for every row it scans.  With 1 000+
-- orders that means 1 000+ round-trips into user_roles, blowing past our
-- 20 second client-side timeout and causing "Orders request timed out".
--
-- Fix: wrap every has_role() call in (SELECT ...) so PostgreSQL evaluates it
-- as a correlated-free init-plan — exactly once per statement, result cached
-- for all rows.  This is the standard Supabase RLS performance pattern.
--
-- Also adds explicit UPDATE policies for admin and kitchen (previously absent,
-- forcing the DB to fall through to no-match → silent update failure).
-- ─────────────────────────────────────────────────────────────────────────────

-- Ensure RLS is enabled (may have been disabled by a manual hotfix script)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ── orders: SELECT ────────────────────────────────────────────────────────────

-- Admin: see every order, evaluated ONCE per query (not per row)
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING ((SELECT public.has_role(auth.uid(), 'admin')));

-- Kitchen: see only actionable statuses, evaluated ONCE per query
DROP POLICY IF EXISTS "Kitchen can view active orders" ON public.orders;
CREATE POLICY "Kitchen can view active orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.has_role(auth.uid(), 'kitchen'))
    AND status IN ('pending', 'preparing', 'ready', 'paid', 'confirmed')
  );

-- ── orders: UPDATE ────────────────────────────────────────────────────────────
-- Without explicit UPDATE policies the admin/kitchen status-change calls were
-- silently rejected by RLS, causing fetchOrders() to be called again (showing
-- stale state) and creating the "orders not going through" symptom.

DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
CREATE POLICY "Admins can update all orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING     ((SELECT public.has_role(auth.uid(), 'admin')))
  WITH CHECK ((SELECT public.has_role(auth.uid(), 'admin')));

DROP POLICY IF EXISTS "Kitchen can update order status" ON public.orders;
CREATE POLICY "Kitchen can update order status"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING     ((SELECT public.has_role(auth.uid(), 'kitchen') OR public.has_role(auth.uid(), 'admin')))
  WITH CHECK ((SELECT public.has_role(auth.uid(), 'kitchen') OR public.has_role(auth.uid(), 'admin')));

-- ── user_roles: SELECT / ALL ──────────────────────────────────────────────────
-- Same per-row problem: "Admins can view all roles" called has_role() for each
-- row in user_roles, which itself queries user_roles — O(n²) + potential
-- recursion guard overhead.

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING ((SELECT public.has_role(auth.uid(), 'admin')));

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING     ((SELECT public.has_role(auth.uid(), 'admin')))
  WITH CHECK ((SELECT public.has_role(auth.uid(), 'admin')));

-- "Users can view their own roles" stays as-is — it uses auth.uid() = user_id
-- which is already a constant expression per query, so no change needed.
