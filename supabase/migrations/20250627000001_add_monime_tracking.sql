-- Add Monime-specific tracking fields to transfers table
ALTER TABLE transfers 
ADD COLUMN IF NOT EXISTS monime_payout_id TEXT,
ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Add index for Monime payout ID
CREATE INDEX IF NOT EXISTS idx_transfers_monime_payout_id ON transfers(monime_payout_id);

-- Add comment for documentation
COMMENT ON COLUMN transfers.monime_payout_id IS 'Monime payout ID for tracking payout status';
COMMENT ON COLUMN transfers.failure_reason IS 'JSON string containing failure details if payout fails';
