-- Create user_roles table (only if not exists)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Kitchen staff can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Kitchen staff can update orders" ON public.orders;

-- RLS policy for users to view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Update orders table RLS for kitchen staff
CREATE POLICY "Kitchen staff can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'kitchen'));

CREATE POLICY "Kitchen staff can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'kitchen'));

-- Add location validation for delivery addresses
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zip_code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  estimated_minutes INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active delivery zones" ON public.delivery_zones;

CREATE POLICY "Anyone can view active delivery zones"
ON public.delivery_zones
FOR SELECT
USING (is_active = true);

-- Insert initial delivery zones (15 min radius from restaurant)
INSERT INTO public.delivery_zones (zip_code, estimated_minutes) VALUES
('11201', 10), ('11205', 12), ('11206', 15), ('11211', 12), ('11213', 15),
('11215', 10), ('11217', 8), ('11231', 12), ('11238', 15), ('10002', 15),
('10003', 12), ('10009', 10), ('10012', 12), ('10013', 15), ('10014', 15)
ON CONFLICT (zip_code) DO NOTHING;