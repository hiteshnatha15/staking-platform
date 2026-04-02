import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase: Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env (in project folder)');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Stake {
  id: string;
  wallet_address: string;
  amount: number; // effective = deposited + 30% bonus (for display & rewards)
  deposited_amount: number | null; // actual tokens in vault (for withdrawal)
  start_time: string;
  status: 'active' | 'withdrawn';
  transaction_signature: string | null;
  created_at: string;
  updated_at: string;
}

export interface Withdrawal {
  id: string;
  stake_id: string | null;
  wallet_address: string;
  amount: number;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  withdrawal_type: 'auto' | 'manual';
  approved_by: string | null;
  transaction_signature: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminWallet {
  id: string;
  wallet_address: string;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_wallet: string;
  referred_wallet: string;
  referral_code: string;
  created_at: string;
}

export interface LevelConfig {
  id: string;
  level: number;
  commission_percent: number;
  created_at: string;
}

export interface CommissionEarning {
  id: string;
  wallet_address: string;
  amount: number;
  level: number;
  from_wallet: string;
  stake_id: string | null;
  created_at: string;
}

export interface UserReferral {
  wallet_address: string;
  referral_code: string;
  referred_by: string | null;
  created_at: string;
}

export interface CommissionWithdrawal {
  id: string;
  wallet_address: string;
  amount: number;
  transaction_signature: string | null;
  status: 'pending' | 'completed';
  created_at: string;
}

export interface RewardClaim {
  id: string;
  stake_id: string;
  wallet_address: string;
  amount: number;
  transaction_signature: string | null;
  created_at: string;
}
