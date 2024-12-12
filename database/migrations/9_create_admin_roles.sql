-- Create admin_roles table
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Add RLS policies
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view admin roles
CREATE POLICY "Allow viewing admin roles"
  ON public.admin_roles FOR SELECT
  USING (true);

-- Only super_admins can manage admin roles
CREATE POLICY "Super admins can manage admin roles"
  ON public.admin_roles FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.admin_roles 
      WHERE role = 'super_admin'
    )
  );

-- Update user_subscriptions policies to allow admin access
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.user_subscriptions;

CREATE POLICY "Users and admins can view subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (
    auth.uid() = user_id 
    OR 
    auth.uid() IN (
      SELECT user_id FROM public.admin_roles 
      WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users and admins can update subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (
    auth.uid() = user_id 
    OR 
    auth.uid() IN (
      SELECT user_id FROM public.admin_roles 
      WHERE role IN ('admin', 'super_admin')
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_admin_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for admin_roles
CREATE TRIGGER update_admin_roles_updated_at
  BEFORE UPDATE ON public.admin_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_admin_roles_updated_at(); 