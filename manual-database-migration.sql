-- Run this SQL in your Supabase SQL Editor to add the missing fields
-- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new

-- Add missing columns to transfers table
ALTER TABLE transfers 
ADD COLUMN IF NOT EXISTS monime_payout_id TEXT,
ADD COLUMN IF NOT EXISTS transaction_reference TEXT,
ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transfers_monime_payout_id ON transfers(monime_payout_id);
CREATE INDEX IF NOT EXISTS idx_transfers_transaction_reference ON transfers(transaction_reference);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'transfers' 
AND table_schema = 'public'
ORDER BY ordinal_position;
