-- Create referrals table for Supabase
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id TEXT NOT NULL,
  referrer_name TEXT,
  referrer_phone TEXT,
  referral_code TEXT NOT NULL,
  friend_name TEXT NOT NULL,
  friend_phone TEXT,
  order_id TEXT,
  order_number TEXT,
  order_total NUMERIC DEFAULT 0,
  reward_amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'paid', 'cancelled'
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for speedy queries
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- RLS policies
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read referrals" ON referrals FOR SELECT USING (true);
CREATE POLICY "Public insert referrals" ON referrals FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update referrals" ON referrals FOR UPDATE USING (true);
CREATE POLICY "Public delete referrals" ON referrals FOR DELETE USING (true);
