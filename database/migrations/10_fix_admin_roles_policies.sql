-- First disable RLS temporarily to allow the initial setup
ALTER TABLE public.admin_roles DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow viewing admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Super admins can manage admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Users can view their own admin role" ON public.admin_roles;
DROP POLICY IF EXISTS "Service role can manage admin roles" ON public.admin_roles;

-- Insert initial super admin (replace with your admin user ID)
INSERT INTO public.admin_roles (user_id, role)
VALUES ('05dc7e34-b493-4b4c-bb79-8f01e9386f59', 'super_admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

-- Re-enable RLS
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Create simplified policies that don't cause recursion
CREATE POLICY "Enable read access to own role"
  ON public.admin_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Enable service role full access"
  ON public.admin_roles FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Update user_subscriptions policies
DROP POLICY IF EXISTS "Users and admins can view subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users and admins can update subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.user_subscriptions;

-- Create simplified subscription policies
CREATE POLICY "Enable read access to own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Enable service role full access to subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role'); 