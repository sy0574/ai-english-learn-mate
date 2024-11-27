-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS articles_user_id_idx ON articles(user_id);
CREATE INDEX IF NOT EXISTS word_bank_user_id_idx ON word_bank(user_id);
CREATE INDEX IF NOT EXISTS articles_created_at_idx ON articles(created_at);
CREATE INDEX IF NOT EXISTS word_bank_word_idx ON word_bank(word);