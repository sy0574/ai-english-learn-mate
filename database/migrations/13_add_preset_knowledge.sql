-- Create preset_knowledge table
CREATE TABLE IF NOT EXISTS preset_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  description TEXT NOT NULL,
  relevance TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create user_knowledge table to store user's knowledge base
CREATE TABLE IF NOT EXISTS user_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  description TEXT NOT NULL,
  relevance TEXT NOT NULL,
  category TEXT NOT NULL,
  source UUID REFERENCES preset_knowledge(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS user_knowledge_user_id_idx ON user_knowledge(user_id);
CREATE INDEX IF NOT EXISTS preset_knowledge_category_idx ON preset_knowledge(category);

-- Enable RLS
ALTER TABLE preset_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_knowledge ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON preset_knowledge
  FOR SELECT USING (true);

CREATE POLICY "Enable read for users based on user_id" ON user_knowledge
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for users based on user_id" ON user_knowledge
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON user_knowledge
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON user_knowledge
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to initialize user knowledge
CREATE OR REPLACE FUNCTION initialize_user_knowledge()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_knowledge (user_id, topic, description, relevance, category, source)
  SELECT NEW.id, topic, description, relevance, category, id
  FROM preset_knowledge;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically initialize knowledge for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_knowledge();

-- Insert some sample preset knowledge
INSERT INTO preset_knowledge (topic, description, relevance, category) VALUES
('Basic Grammar', 'Understanding of English sentence structure and basic grammar rules', 'Essential for building a strong foundation in English', 'grammar'),
('Common Idioms', 'Collection of frequently used English idioms and their meanings', 'Important for natural communication', 'vocabulary'),
('Academic Writing', 'Key concepts and structures in academic writing', 'Crucial for academic success', 'writing'),
('Business English', 'Essential business vocabulary and communication patterns', 'Valuable for professional development', 'business');
