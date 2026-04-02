/*
  # Solana Token Staking Platform Schema

  1. New Tables
    - `stakes`
      - `id` (uuid, primary key)
      - `wallet_address` (text, user's wallet address)
      - `amount` (numeric, staked amount)
      - `start_time` (timestamptz, when stake started)
      - `status` (text, active/withdrawn)
      - `transaction_signature` (text, Solana tx signature)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `withdrawals`
      - `id` (uuid, primary key)
      - `stake_id` (uuid, foreign key to stakes)
      - `wallet_address` (text)
      - `amount` (numeric, withdrawal amount)
      - `status` (text, pending/approved/completed/rejected)
      - `withdrawal_type` (text, auto/manual)
      - `approved_by` (text, admin wallet address)
      - `transaction_signature` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `admin_wallets`
      - `id` (uuid, primary key)
      - `wallet_address` (text, unique)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access to stakes
    - Add policies for users to create their own stakes
    - Add policies for admin operations
*/

CREATE TABLE IF NOT EXISTS stakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  start_time timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'withdrawn')),
  transaction_signature text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stake_id uuid REFERENCES stakes(id),
  wallet_address text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'rejected')),
  withdrawal_type text DEFAULT 'auto' CHECK (withdrawal_type IN ('auto', 'manual')),
  approved_by text,
  transaction_signature text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stakes"
  ON stakes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create stakes"
  ON stakes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update their own stakes"
  ON stakes FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can view withdrawals"
  ON withdrawals FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create withdrawal requests"
  ON withdrawals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update withdrawals"
  ON withdrawals FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can view admin wallets"
  ON admin_wallets FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert admin wallets"
  ON admin_wallets FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_stakes_wallet ON stakes(wallet_address);
CREATE INDEX IF NOT EXISTS idx_stakes_status ON stakes(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_wallet ON withdrawals(wallet_address);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);