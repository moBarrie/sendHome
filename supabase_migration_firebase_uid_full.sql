-- Migration: Update recipients and transfers user_id for Firebase Auth compatibility

-- 1. Drop RLS policies on recipients
DROP POLICY IF EXISTS "Users can view their own recipients" ON recipients;
DROP POLICY IF EXISTS "Users can insert their own recipients" ON recipients;
DROP POLICY IF EXISTS "Users can update their own recipients" ON recipients;
DROP POLICY IF EXISTS "Users can delete their own recipients" ON recipients;

-- 2. Drop foreign key constraint on recipients.user_id
ALTER TABLE recipients DROP CONSTRAINT IF EXISTS recipients_user_id_fkey;

-- 3. Alter recipients.user_id to text
ALTER TABLE recipients ALTER COLUMN user_id TYPE text;

-- 4. Recreate RLS policies on recipients
CREATE POLICY "Users can view their own recipients" ON recipients
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recipients" ON recipients
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recipients" ON recipients
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recipients" ON recipients
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Drop RLS policies on transfers
DROP POLICY IF EXISTS "Users can view their own transfers" ON transfers;
DROP POLICY IF EXISTS "Users can insert their own transfers" ON transfers;
DROP POLICY IF EXISTS "Users can update their own transfers" ON transfers;
DROP POLICY IF EXISTS "Users can delete their own transfers" ON transfers;

-- 6. Drop foreign key constraint on transfers.user_id
ALTER TABLE transfers DROP CONSTRAINT IF EXISTS transfers_user_id_fkey;

-- 7. Alter transfers.user_id to text
ALTER TABLE transfers ALTER COLUMN user_id TYPE text;

-- 8. Recreate RLS policies on transfers
CREATE POLICY "Users can view their own transfers" ON transfers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transfers" ON transfers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transfers" ON transfers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transfers" ON transfers
  FOR DELETE USING (auth.uid() = user_id);
