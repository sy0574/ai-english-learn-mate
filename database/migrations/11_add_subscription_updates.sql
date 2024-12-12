-- Create subscription_updates table for real-time updates
CREATE TABLE IF NOT EXISTS public.subscription_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.subscription_updates ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own updates
CREATE POLICY "Users can view their own subscription updates"
  ON public.subscription_updates FOR SELECT
  USING (auth.uid() = user_id);

-- Allow service role full access
CREATE POLICY "Service role can manage subscription updates"
  ON public.subscription_updates FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_subscription_updates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for subscription_updates
CREATE TRIGGER update_subscription_updates_updated_at
  BEFORE UPDATE ON public.subscription_updates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_updates_updated_at(); 