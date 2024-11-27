-- Create word_bank table
CREATE TABLE IF NOT EXISTS word_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  translation TEXT NOT NULL,
  part_of_speech TEXT[] DEFAULT '{}',
  level TEXT CHECK (level IN ('junior', 'senior', 'cet4', 'cet6', 'advanced')),
  tags TEXT[] DEFAULT '{}',
  examples TEXT[] DEFAULT '{}',
  variations TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);