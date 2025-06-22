-- Migration: Change user_id to text for Firebase Auth compatibility in transfers table

-- 1. Drop the existing foreign key constraint (if it exists)
ALTER TABLE transfers DROP CONSTRAINT IF EXISTS transfers_user_id_fkey;

-- 2. Alter the user_id column to text
ALTER TABLE transfers ALTER COLUMN user_id TYPE text;

-- 3. (Optional) If you want to enforce NOT NULL
-- ALTER TABLE transfers ALTER COLUMN user_id SET NOT NULL;

-- 4. Update RLS policies if they reference auth.uid() as uuid
-- (Change to text comparison if needed)
-- Example: already uses auth.uid() = user_id, so no change needed if user_id is text

-- Now you can store Firebase UIDs as user_id in transfers
