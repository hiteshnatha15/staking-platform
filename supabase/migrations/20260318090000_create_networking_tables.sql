-- Networking / MLM Tables for Team, Referrals, Level Income

-- Referral codes per wallet
CREATE TABLE IF NOT EXISTS referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  referral_code text UNIQUE NOT NULL,
  referred_by text,
  created_at timestamptz DEFAULT now()
);

-- Level commission structure (1-10 levels, percentage)
CREATE TABLE IF NOT EXISTS level_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level int NOT NULL UNIQUE CHECK (level >= 1 AND level <= 10),
  percentage numeric NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  created_at timestamptz DEFAULT now()
);

-- Commission earnings per user per level
CREATE TABLE IF NOT EXISTS commission_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  from_wallet text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  level int NOT NULL CHECK (level >= 1 AND level <= 10),
  stake_id uuid REFERENCES stakes(id),
  created_at timestamptz DEFAULT now()
);

-- Insert default level commissions (Level 1: 10%, L2: 5%, L3: 3%, etc.)
INSERT INTO level_commissions (level, percentage) VALUES
  (1, 10), (2, 5), (3, 3), (4, 2), (5, 1.5),
  (6, 1), (7, 0.8), (8, 0.5), (9, 0.3), (10, 0.2)
ON CONFLICT (level) DO NOTHING;

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view referral_codes" ON referral_codes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert referral_codes" ON referral_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update referral_codes" ON referral_codes FOR UPDATE USING (true);

CREATE POLICY "Anyone can view level_commissions" ON level_commissions FOR SELECT USING (true);

CREATE POLICY "Anyone can view commission_earnings" ON commission_earnings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert commission_earnings" ON commission_earnings FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_referral_codes_wallet ON referral_codes(wallet_address);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_referred_by ON referral_codes(referred_by);
CREATE INDEX IF NOT EXISTS idx_commission_earnings_wallet ON commission_earnings(wallet_address);
CREATE INDEX IF NOT EXISTS idx_commission_earnings_level ON commission_earnings(level);
