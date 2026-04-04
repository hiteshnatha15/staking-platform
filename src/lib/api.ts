const BASE = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Interfaces (same as before, kept for component compatibility) ──

export interface Stake {
  id: string;
  wallet_address: string;
  amount: number;
  deposited_amount: number | null;
  start_time: string;
  status: 'active' | 'pending' | 'withdrawn';
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
  withdrawal_type: 'manual';
  approved_by: string | null;
  transaction_signature: string | null;
  created_at: string;
  updated_at: string;
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

export interface CommissionWithdrawal {
  id: string;
  wallet_address: string;
  amount: number;
  transaction_signature: string | null;
  status: 'pending' | 'completed' | 'rejected';
  approved_by: string | null;
  reject_reason: string | null;
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

// ── Stakes ──

export async function getTvl(): Promise<number> {
  const data = await get<{ total: number }>('/stakes/tvl');
  return data.total;
}

export async function getStakes(wallet: string, status = 'active,pending'): Promise<Stake[]> {
  return get<Stake[]>(`/stakes?wallet_address=${wallet}&status=${status}`);
}

export async function getActiveStakes(wallet: string): Promise<Stake[]> {
  return get<Stake[]>(`/stakes?wallet_address=${wallet}&status=active`);
}

export async function getStakeAmounts(wallets: string[]): Promise<{ amount: number }[]> {
  const results: { amount: number }[] = [];
  for (const w of wallets) {
    const stakes = await get<Stake[]>(`/stakes?wallet_address=${w}&status=active`);
    for (const s of stakes) results.push({ amount: s.amount });
  }
  return results;
}

export async function insertStake(data: {
  wallet_address: string;
  amount: number;
  deposited_amount: number;
  transaction_signature: string;
  status: string;
}): Promise<void> {
  await post('/stakes', data);
}

export async function updateStakeStatus(txSignature: string, status: string): Promise<void> {
  await patch(`/stakes/${encodeURIComponent(txSignature)}`, { status });
}

// ── Withdrawals ──

export interface AvailableStake {
  id: string;
  deposited: number;
  days: number;
  released: number;
  withdrawn: number;
  available: number;
  created_at: string;
}

export interface AvailableBalance {
  total: number;
  stakes: AvailableStake[];
}

export async function getAvailableBalance(wallet: string): Promise<AvailableBalance> {
  return get<AvailableBalance>(`/withdrawals/available?wallet_address=${wallet}`);
}

export async function getWithdrawals(wallet: string): Promise<Withdrawal[]> {
  return get<Withdrawal[]>(`/withdrawals?wallet_address=${wallet}`);
}

export async function requestWithdrawal(wallet: string, amount: number): Promise<void> {
  await post('/withdrawals', { wallet_address: wallet, amount });
}

// ── Referrals ──

export async function getReferralCount(): Promise<number> {
  const data = await get<{ count: number }>('/referrals/count');
  return data.count;
}

export async function lookupReferralCode(code: string): Promise<string | null> {
  const data = await get<{ wallet_address: string | null }>(`/referrals/lookup?referral_code=${encodeURIComponent(code)}`);
  return data.wallet_address;
}

export async function getReferrals(referredBy: string): Promise<{ wallet_address: string; created_at: string }[]> {
  return get<{ wallet_address: string; created_at: string }[]>(`/referrals?referred_by=${referredBy}`);
}

export async function getReferralCountBy(referredBy: string): Promise<number> {
  const data = await get<{ count: number }>(`/referrals/count-by?referred_by=${referredBy}`);
  return data.count;
}

export async function upsertReferral(data: {
  wallet_address: string;
  referral_code: string;
  referred_by: string | null;
}): Promise<void> {
  await post('/referrals', data);
}

// ── Commissions ──

export async function getCommissionEarnings(wallet: string): Promise<CommissionEarning[]> {
  return get<CommissionEarning[]>(`/commissions/earnings?wallet_address=${wallet}`);
}

export async function getCommissionWithdrawals(wallet: string): Promise<CommissionWithdrawal[]> {
  return get<CommissionWithdrawal[]>(`/commissions/withdrawals?wallet_address=${wallet}`);
}

export async function insertCommissionWithdrawal(data: {
  wallet_address: string;
  amount: number;
}): Promise<void> {
  await post('/commissions/withdrawals', data);
}

// ── Rewards ──

export async function getRewardClaims(wallet: string): Promise<RewardClaim[]> {
  return get<RewardClaim[]>(`/rewards?wallet_address=${wallet}`);
}

export async function insertRewardClaim(data: {
  wallet_address: string;
  stake_id: string;
  amount: number;
  transaction_signature: string;
}): Promise<void> {
  await post('/rewards', data);
}

// ── History ──

export interface TxItem {
  id: string;
  type: 'stake' | 'withdrawal' | 'commission' | 'reward';
  amount: number;
  status?: string;
  transaction_signature: string | null;
  created_at: string;
}

export async function getTransactionHistory(wallet: string): Promise<TxItem[]> {
  return get<TxItem[]>(`/history?wallet_address=${wallet}`);
}
