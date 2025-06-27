-- First clean up any existing transfers-related objects
DROP TRIGGER IF EXISTS update_transfers_updated_at ON transfers;
DROP TABLE IF EXISTS transfers CASCADE;
DROP TABLE IF EXISTS legacy_transfers CASCADE;
DROP TYPE IF EXISTS transfer_status CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Create fresh transfers table with all required columns
CREATE TABLE transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    recipient_id UUID,
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    -- Amounts and fees
    amount DECIMAL NOT NULL,
    amount_gbp DECIMAL NOT NULL,
    amount_sll DECIMAL NOT NULL,
    fee_gbp DECIMAL NOT NULL,
    sendhome_fee_gbp DECIMAL NOT NULL,
    total_gbp DECIMAL NOT NULL,
    -- Exchange rate
    gbp_to_sll_rate DECIMAL NOT NULL,
    -- Payment details
    currency TEXT NOT NULL DEFAULT 'GBP',
    payment_method TEXT NOT NULL,
    payment_intent_id TEXT,
    stripe_payment_intent_id TEXT,
    payout_id TEXT,
    -- Status and metadata
    status TEXT NOT NULL DEFAULT 'pending',
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add indexes for better performance
CREATE INDEX idx_transfers_user_id ON transfers(user_id);
CREATE INDEX idx_transfers_recipient_id ON transfers(recipient_id);
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_transfers_payment_intent_id ON transfers(payment_intent_id);
CREATE INDEX idx_transfers_stripe_payment_intent_id ON transfers(stripe_payment_intent_id);
CREATE INDEX idx_transfers_payout_id ON transfers(payout_id);
CREATE INDEX idx_transfers_created_at ON transfers(created_at DESC);

-- Add RLS policies
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- Users can view their own transfers
CREATE POLICY "Users can view own transfers" 
ON transfers FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create transfers
CREATE POLICY "Users can create transfers" 
ON transfers FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transfers_updated_at
    BEFORE UPDATE ON transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
