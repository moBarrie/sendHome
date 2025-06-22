-- Migration: Change user_id to text for Firebase Auth compatibility

-- 1. Drop the existing foreign key constraint (if it exists)
ALTER TABLE recipients DROP CONSTRAINT IF EXISTS recipients_user_id_fkey;

-- 2. Alter the user_id column to text
ALTER TABLE recipients ALTER COLUMN user_id TYPE text;

-- 3. (Optional) If you want to enforce NOT NULL
-- ALTER TABLE recipients ALTER COLUMN user_id SET NOT NULL;

-- 4. (Optional) You may want to update RLS policies if they reference auth.uid() as uuid
-- If so, change them to use text comparison

-- Now you can store Firebase UIDs as user_id
