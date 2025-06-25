CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payout_id TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- Users can only see their own transfers
CREATE POLICY "Users can view own transfers"
  ON transfers FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only create their own transfers
CREATE POLICY "Users can create own transfers"
  ON transfers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER set_transfers_updated_at
  BEFORE UPDATE ON transfers
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime('updated_at');

-- Create index on user_id for faster queries
CREATE INDEX transfers_user_id_idx ON transfers(user_id);

-- Create index on payout_id for faster status lookups
CREATE INDEX transfers_payout_id_idx ON transfers(payout_id);
