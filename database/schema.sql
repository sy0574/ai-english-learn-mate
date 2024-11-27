-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[] DEFAULT '{}',
  reading_time INTEGER,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS articles_user_id_idx ON articles(user_id);
CREATE INDEX IF NOT EXISTS word_bank_user_id_idx ON word_bank(user_id);
CREATE INDEX IF NOT EXISTS articles_created_at_idx ON articles(created_at);
CREATE INDEX IF NOT EXISTS word_bank_word_idx ON word_bank(word);

-- Enable RLS and create policies
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for users based on user_id" ON articles FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for authenticated users only" ON articles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for users based on user_id" ON articles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable delete for users based on user_id" ON articles FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE word_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for users based on user_id" ON word_bank FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for authenticated users only" ON word_bank FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for users based on user_id" ON word_bank FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable delete for users based on user_id" ON word_bank FOR DELETE
  USING (auth.uid() = user_id);