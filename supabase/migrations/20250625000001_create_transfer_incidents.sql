CREATE TABLE transfer_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_id UUID REFERENCES transfers(id) NOT NULL,
  payment_intent_id TEXT NOT NULL,
  type TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'open',
  details JSONB,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE transfer_incidents ENABLE ROW LEVEL SECURITY;

-- Only admins can view incidents
CREATE POLICY "Admins can view all incidents"
  ON transfer_incidents FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Only admins can insert incidents
CREATE POLICY "Admins can create incidents"
  ON transfer_incidents FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Only admins can update incidents
CREATE POLICY "Admins can update incidents"
  ON transfer_incidents FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create indexes
CREATE INDEX transfer_incidents_transfer_id_idx ON transfer_incidents(transfer_id);
CREATE INDEX transfer_incidents_status_idx ON transfer_incidents(status);
CREATE INDEX transfer_incidents_priority_idx ON transfer_incidents(priority);

-- Create updated_at trigger
CREATE TRIGGER set_transfer_incidents_updated_at
  BEFORE UPDATE ON transfer_incidents
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime('updated_at');
