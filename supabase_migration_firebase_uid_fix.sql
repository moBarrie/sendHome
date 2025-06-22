-- Migration: Ensure user_id columns exist as text and RLS policies are correct for Firebase Auth compatibility

-- 1. Add user_id column as text if missing
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS user_id text;

-- 2. Drop RLS policies on recipients
DROP POLICY IF EXISTS "Users can view their own recipients" ON recipients;
DROP POLICY IF EXISTS "Users can insert their own recipients" ON recipients;
DROP POLICY IF EXISTS "Users can update their own recipients" ON recipients;
DROP POLICY IF EXISTS "Users can delete their own recipients" ON recipients;

-- 3. Recreate RLS policies on recipients
CREATE POLICY "Users can view their own recipients" ON recipients
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recipients" ON recipients
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recipients" ON recipients
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recipients" ON recipients
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Drop RLS policies on transfers
DROP POLICY IF EXISTS "Users can view their own transfers" ON transfers;
DROP POLICY IF EXISTS "Users can insert their own transfers" ON transfers;
DROP POLICY IF EXISTS "Users can update their own transfers" ON transfers;
DROP POLICY IF EXISTS "Users can delete their own transfers" ON transfers;

-- 5. Recreate RLS policies on transfers
CREATE POLICY "Users can view their own transfers" ON transfers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transfers" ON transfers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transfers" ON transfers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transfers" ON transfers
  FOR DELETE USING (auth.uid() = user_id);

const transferData = {
  user_id: user.uid, // This must be the Firebase UID string
  recipient_id: selectedRecipient, // This must be a valid recipient UUID
  amount_gbp: amountNum,
  amount_sll: sllAmount,
  gbp_to_sll_rate: gbpToSll,
  payment_method: paymentMethod,
  fee_gbp: fee,
  total_gbp: total,
  status: "in_progress",
};
await supabase.from("transfers").insert([transferData]);
