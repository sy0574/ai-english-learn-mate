-- Create policies for articles
CREATE POLICY "Enable read for users based on user_id" ON articles FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for authenticated users only" ON articles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for users based on user_id" ON articles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable delete for users based on user_id" ON articles FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for word_bank
CREATE POLICY "Enable read for users based on user_id" ON word_bank FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for authenticated users only" ON word_bank FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for users based on user_id" ON word_bank FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable delete for users based on user_id" ON word_bank FOR DELETE
  USING (auth.uid() = user_id);