-- Add missing fields for better transfer tracking
ALTER TABLE transfers 
ADD COLUMN IF NOT EXISTS monime_payout_id TEXT,
ADD COLUMN IF NOT EXISTS transaction_reference TEXT,
ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Add indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_transfers_monime_payout_id ON transfers(monime_payout_id);
CREATE INDEX IF NOT EXISTS idx_transfers_transaction_reference ON transfers(transaction_reference);
