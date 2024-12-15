-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- First, disable RLS temporarily to allow initial setup
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Allow service role full access (this should be first)
CREATE POLICY "Service role has full access"
  ON public.profiles FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Allow users to read their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow any authenticated user to insert their profile
CREATE POLICY "Allow profile creation during signup"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- Create trigger to handle profile creation after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_user RECORD;
BEGIN
  -- Get the new user's information
  new_user := NEW;
  
  -- Insert the profile
  INSERT INTO public.profiles (id, email, subscription_tier, created_at, updated_at)
  VALUES (
    new_user.id,
    new_user.email,
    'free',
    NOW(),
    NOW()
  );
  
  RETURN new_user;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error (you might want to use a proper logging mechanism)
    RAISE NOTICE 'Error creating profile for user %: %', new_user.id, SQLERRM;
    RETURN new_user;
END;
$$ language 'plpgsql' SECURITY DEFINER SET search_path = public;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user(); 