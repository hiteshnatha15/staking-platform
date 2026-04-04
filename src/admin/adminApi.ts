const BASE = '/api/admin';
const TOKEN_KEY = 'rubix_admin_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

async function authFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
  if (res.status === 401) {
    clearToken();
    window.location.href = '/admin';
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Auth ──

export async function login(username: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(body.error || 'Invalid credentials');
  }
  const data: { token: string } = await res.json();
  setToken(data.token);
  return data.token;
}

// ── Stats ──

export interface DashboardStats {
  tvl: number;
  totalUsers: number;
  activeStakes: number;
  totalStakes: number;
  pendingWithdrawals: number;
  pendingWithdrawalAmount: number;
  stakes24h: number;
  totalRewardsClaimed: number;
  totalCommissions: number;
}

export async function getStats(): Promise<DashboardStats> {
  return authFetch<DashboardStats>('/stats');
}

// ── Activity ──

export interface ActivityItem {
  id: string;
  type: 'stake' | 'withdrawal' | 'reward';
  wallet: string;
  amount: number;
  status: string;
  date: string;
}

export async function getActivity(): Promise<ActivityItem[]> {
  return authFetch<ActivityItem[]>('/activity');
}

// ── Paginated response ──

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}

// ── Stakes ──

export interface AdminStake {
  id: string;
  wallet_address: string;
  amount: number;
  deposited_amount: number | null;
  status: string;
  transaction_signature: string | null;
  start_time: string;
  created_at: string;
}

export async function getAdminStakes(page = 1, wallet = '', status = 'all'): Promise<Paginated<AdminStake>> {
  const params = new URLSearchParams({ page: String(page) });
  if (wallet) params.set('wallet', wallet);
  if (status !== 'all') params.set('status', status);
  return authFetch<Paginated<AdminStake>>(`/stakes?${params}`);
}

export async function updateStake(id: string, updates: Record<string, unknown>): Promise<AdminStake> {
  return authFetch<AdminStake>(`/stakes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// ── Withdrawals ──

export interface AdminWithdrawal {
  id: string;
  stake_id: string | null;
  wallet_address: string;
  amount: number;
  status: string;
  withdrawal_type: string;
  approved_by: string | null;
  transaction_signature: string | null;
  created_at: string;
}

export async function getAdminWithdrawals(page = 1, wallet = '', status = 'all'): Promise<Paginated<AdminWithdrawal>> {
  const params = new URLSearchParams({ page: String(page) });
  if (wallet) params.set('wallet', wallet);
  if (status !== 'all') params.set('status', status);
  return authFetch<Paginated<AdminWithdrawal>>(`/withdrawals?${params}`);
}

export async function updateWithdrawal(
  id: string,
  status: string,
  extra?: { transaction_signature?: string; reject_reason?: string },
): Promise<AdminWithdrawal> {
  return authFetch<AdminWithdrawal>(`/withdrawals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, ...extra }),
  });
}

// ── Users ──

export interface AdminUser {
  id: string;
  wallet_address: string;
  referral_code: string;
  referred_by: string | null;
  total_staked: number;
  referral_count: number;
  created_at: string;
}

export async function getAdminUsers(page = 1, wallet = ''): Promise<Paginated<AdminUser>> {
  const params = new URLSearchParams({ page: String(page) });
  if (wallet) params.set('wallet', wallet);
  return authFetch<Paginated<AdminUser>>(`/users?${params}`);
}

export async function getAdminUserDetail(wallet: string) {
  return authFetch<{
    user: AdminUser;
    stakes: AdminStake[];
    withdrawals: AdminWithdrawal[];
    commissions: AdminCommission[];
    rewards: { id: string; amount: number; created_at: string }[];
    referrals: { wallet_address: string; referral_code: string; created_at: string }[];
  }>(`/users/${wallet}`);
}

// ── Referrals ──

export interface AdminReferral {
  id: string;
  wallet_address: string;
  referral_code: string;
  referred_by: string;
  commission_generated: number;
  created_at: string;
}

export async function getAdminReferrals(page = 1, wallet = ''): Promise<Paginated<AdminReferral>> {
  const params = new URLSearchParams({ page: String(page) });
  if (wallet) params.set('wallet', wallet);
  return authFetch<Paginated<AdminReferral>>(`/referrals?${params}`);
}

export interface ReferralStats {
  totalReferrals: number;
  usersWithReferrals: number;
  commissionsByLevel: { level: number; total: number; count: number }[];
  topReferrers: { wallet: string; totalEarned: number; referralCount: number }[];
  totalCommissionsPaid: number;
  totalCommissionsWithdrawn: number;
}

export async function getReferralStats(): Promise<ReferralStats> {
  return authFetch<ReferralStats>('/referral-stats');
}

// ── Commissions ──

export interface AdminCommission {
  id: string;
  wallet_address: string;
  from_wallet: string;
  amount: number;
  level: number;
  stake_id: string | null;
  created_at: string;
}

export async function getAdminCommissions(page = 1, wallet = '', level = ''): Promise<Paginated<AdminCommission>> {
  const params = new URLSearchParams({ page: String(page) });
  if (wallet) params.set('wallet', wallet);
  if (level) params.set('level', level);
  return authFetch<Paginated<AdminCommission>>(`/commissions?${params}`);
}

export interface AdminCommissionWithdrawal {
  id: string;
  wallet_address: string;
  amount: number;
  transaction_signature: string | null;
  status: string;
  approved_by: string | null;
  reject_reason: string | null;
  created_at: string;
}

export async function getAdminCommissionWithdrawals(page = 1, wallet = '', status = 'all'): Promise<Paginated<AdminCommissionWithdrawal>> {
  const params = new URLSearchParams({ page: String(page) });
  if (wallet) params.set('wallet', wallet);
  if (status !== 'all') params.set('status', status);
  return authFetch<Paginated<AdminCommissionWithdrawal>>(`/commission-withdrawals?${params}`);
}

export async function updateCommissionWithdrawal(
  id: string,
  status: string,
  extra?: { transaction_signature?: string; reject_reason?: string },
): Promise<AdminCommissionWithdrawal> {
  return authFetch<AdminCommissionWithdrawal>(`/commission-withdrawals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, ...extra }),
  });
}
