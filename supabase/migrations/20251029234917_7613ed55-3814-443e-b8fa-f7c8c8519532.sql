-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for proper role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Drop old problematic admin_users policies
DROP POLICY IF EXISTS "Admin users can view themselves" ON public.admin_users;

-- Update orders table policies to use security definer function
DROP POLICY IF EXISTS "Admin users can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admin users can update orders" ON public.orders;

CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add database constraints for input validation
ALTER TABLE public.orders
ADD CONSTRAINT customer_name_length CHECK (char_length(customer_name) >= 2 AND char_length(customer_name) <= 100),
ADD CONSTRAINT customer_phone_length CHECK (char_length(customer_phone) >= 10 AND char_length(customer_phone) <= 20),
ADD CONSTRAINT customer_email_length CHECK (customer_email IS NULL OR char_length(customer_email) <= 255),
ADD CONSTRAINT delivery_address_length CHECK (delivery_address IS NULL OR char_length(delivery_address) <= 500),
ADD CONSTRAINT notes_length CHECK (notes IS NULL OR char_length(notes) <= 1000);

-- Migrate existing admin_users to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::public.app_role
FROM public.admin_users
ON CONFLICT (user_id, role) DO NOTHING;