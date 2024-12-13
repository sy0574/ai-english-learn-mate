-- Create usage_limits table
CREATE TABLE usage_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  sentence_analysis_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, date)
);

-- Add RLS policies
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own usage limits
CREATE POLICY "Users can view their own usage limits"
  ON usage_limits FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own usage limits
CREATE POLICY "Users can insert their own usage limits"
  ON usage_limits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own usage limits
CREATE POLICY "Users can update their own usage limits"
  ON usage_limits FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_usage_limits_updated_at
  BEFORE UPDATE ON usage_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 