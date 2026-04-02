-- Commission withdrawals & Reward claims tables

CREATE TABLE IF NOT EXISTS commission_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  transaction_signature text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reward_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  stake_id uuid REFERENCES stakes(id),
  amount numeric NOT NULL CHECK (amount >= 0),
  transaction_signature text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE commission_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view commission_withdrawals" ON commission_withdrawals FOR SELECT USING (true);
CREATE POLICY "Anyone can insert commission_withdrawals" ON commission_withdrawals FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view reward_claims" ON reward_claims FOR SELECT USING (true);
CREATE POLICY "Anyone can insert reward_claims" ON reward_claims FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_commission_withdrawals_wallet ON commission_withdrawals(wallet_address);
CREATE INDEX IF NOT EXISTS idx_reward_claims_wallet ON reward_claims(wallet_address);
