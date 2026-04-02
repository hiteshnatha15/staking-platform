import { useState, useEffect, useCallback } from 'react';
import {
  getAdminReferrals, getReferralStats, getAdminCommissions, getAdminCommissionWithdrawals,
  AdminReferral, AdminCommission, AdminCommissionWithdrawal, ReferralStats, Paginated,
} from './adminApi';

type SubTab = 'overview' | 'network' | 'commissions' | 'payouts';

export const AdminReferrals = () => {
  const [subTab, setSubTab] = useState<SubTab>('overview');

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Referrals & Commissions</h2>

      <div className="flex gap-1 rounded-lg bg-slate-800/60 p-1 w-fit">
        {([
          { id: 'overview', label: 'Overview' },
          { id: 'network', label: 'Referral Network' },
          { id: 'commissions', label: 'Commission Earnings' },
          { id: 'payouts', label: 'Commission Payouts' },
        ] as { id: SubTab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`px-4 py-2 rounded-md text-xs font-medium transition-colors ${
              subTab === t.id ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'overview' && <OverviewTab />}
      {subTab === 'network' && <NetworkTab />}
      {subTab === 'commissions' && <CommissionsTab />}
      {subTab === 'payouts' && <PayoutsTab />}
    </div>
  );
};

// ═══════════════════════ Overview ═══════════════════════

const OverviewTab = () => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReferralStats().then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!stats) return <p className="text-slate-400 text-center py-12">Failed to load</p>;

  const summaryCards = [
    { label: 'Total Referrals', value: stats.totalReferrals.toString(), color: 'text-emerald-400' },
    { label: 'Users Who Referred', value: stats.usersWithReferrals.toString(), color: 'text-violet-400' },
    { label: 'Commissions Paid', value: stats.totalCommissionsPaid.toFixed(2), color: 'text-cyan-400' },
    { label: 'Commissions Withdrawn', value: stats.totalCommissionsWithdrawn.toFixed(2), color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(c => (
          <div key={c.label} className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-5">
            <p className="text-xs font-medium text-slate-400 mb-1">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {stats.commissionsByLevel.length > 0 && (
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-5">
          <h3 className="text-lg font-bold text-white mb-4">Commissions by Level</h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {stats.commissionsByLevel.map(l => (
              <div key={l.level} className="rounded-lg bg-slate-800/40 border border-slate-700/40 p-4 text-center">
                <p className="text-xs text-slate-500 mb-1">Level {l.level}</p>
                <p className="text-lg font-bold text-emerald-400">{l.total.toFixed(2)}</p>
                <p className="text-[11px] text-slate-500">{l.count} transactions</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.topReferrers.length > 0 && (
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-5">
          <h3 className="text-lg font-bold text-white mb-4">Top Referrers</h3>
          <div className="space-y-2">
            {stats.topReferrers.map((r, i) => (
              <div key={r.wallet} className="flex items-center justify-between rounded-lg bg-slate-800/40 px-4 py-3 border border-slate-700/40">
                <div className="flex items-center gap-3">
                  <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-amber-500/20 text-amber-400' :
                    i === 1 ? 'bg-slate-400/20 text-slate-300' :
                    i === 2 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-slate-700/40 text-slate-500'
                  }`}>{i + 1}</span>
                  <span className="font-mono text-xs text-slate-300">{r.wallet.slice(0, 8)}...{r.wallet.slice(-4)}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Earned</p>
                    <p className="font-mono text-sm font-semibold text-emerald-400">{r.totalEarned.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Referrals</p>
                    <p className="text-sm font-semibold text-slate-200">{r.referralCount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════ Referral Network ═══════════════════════

const NetworkTab = () => {
  const [data, setData] = useState<Paginated<AdminReferral> | null>(null);
  const [page, setPage] = useState(1);
  const [wallet, setWallet] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await getAdminReferrals(page, wallet)); } catch { /* ignore */ }
    setLoading(false);
  }, [page, wallet]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search by referrer or referred wallet..."
        value={wallet}
        onChange={e => { setWallet(e.target.value); setPage(1); }}
        className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-80"
      />

      {loading ? <Spinner /> : !data || data.data.length === 0 ? (
        <p className="text-slate-400 text-center py-12">No referrals found</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-700/60">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Referred User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Referral Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Referred By</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Commission Generated</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {data.data.map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">{r.wallet_address.slice(0, 8)}...{r.wallet_address.slice(-4)}</td>
                    <td className="px-4 py-3 text-xs text-emerald-400 font-medium">{r.referral_code}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{r.referred_by.slice(0, 8)}...{r.referred_by.slice(-4)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-100">{r.commission_generated.toFixed(4)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination data={data} page={page} setPage={setPage} label="referrals" />
        </>
      )}
    </div>
  );
};

// ═══════════════════════ Commission Earnings ═══════════════════════

const CommissionsTab = () => {
  const [data, setData] = useState<Paginated<AdminCommission> | null>(null);
  const [page, setPage] = useState(1);
  const [wallet, setWallet] = useState('');
  const [level, setLevel] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await getAdminCommissions(page, wallet, level)); } catch { /* ignore */ }
    setLoading(false);
  }, [page, wallet, level]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search earner or source wallet..."
          value={wallet}
          onChange={e => { setWallet(e.target.value); setPage(1); }}
          className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-80"
        />
        <select
          value={level}
          onChange={e => { setLevel(e.target.value); setPage(1); }}
          className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Levels</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(l => (
            <option key={l} value={l}>Level {l}</option>
          ))}
        </select>
      </div>

      {loading ? <Spinner /> : !data || data.data.length === 0 ? (
        <p className="text-slate-400 text-center py-12">No commission earnings found</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-700/60">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Earner</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">From Wallet</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Level</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {data.data.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">{c.wallet_address.slice(0, 8)}...{c.wallet_address.slice(-4)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{c.from_wallet.slice(0, 8)}...{c.from_wallet.slice(-4)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-violet-500/20 text-violet-400">L{c.level}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-400">{c.amount.toFixed(4)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination data={data} page={page} setPage={setPage} label="commissions" />
        </>
      )}
    </div>
  );
};

// ═══════════════════════ Commission Payouts ═══════════════════════

const PayoutsTab = () => {
  const [data, setData] = useState<Paginated<AdminCommissionWithdrawal> | null>(null);
  const [page, setPage] = useState(1);
  const [wallet, setWallet] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await getAdminCommissionWithdrawals(page, wallet)); } catch { /* ignore */ }
    setLoading(false);
  }, [page, wallet]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search wallet..."
        value={wallet}
        onChange={e => { setWallet(e.target.value); setPage(1); }}
        className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-80"
      />

      {loading ? <Spinner /> : !data || data.data.length === 0 ? (
        <p className="text-slate-400 text-center py-12">No commission payouts found</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-700/60">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Wallet</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Tx Signature</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {data.data.map(w => (
                  <tr key={w.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">{w.wallet_address.slice(0, 8)}...{w.wallet_address.slice(-4)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-100">{w.amount.toFixed(4)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        w.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        w.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>{w.status}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 max-w-[160px] truncate">
                      {w.transaction_signature ? `${w.transaction_signature.slice(0, 12)}...` : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(w.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination data={data} page={page} setPage={setPage} label="payouts" />
        </>
      )}
    </div>
  );
};

// ═══════════════════════ Shared Components ═══════════════════════

const Spinner = () => (
  <div className="flex justify-center py-12">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
  </div>
);

const Pagination = <T,>({ data, page, setPage, label }: {
  data: Paginated<T>; page: number; setPage: (fn: (p: number) => number) => void; label: string;
}) => (
  <div className="flex items-center justify-between">
    <p className="text-xs text-slate-500">{data.total} total {label}</p>
    <div className="flex items-center gap-2">
      <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs text-slate-300 hover:bg-slate-600 disabled:opacity-40">Previous</button>
      <span className="text-xs text-slate-400">Page {data.page} of {data.pages}</span>
      <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs text-slate-300 hover:bg-slate-600 disabled:opacity-40">Next</button>
    </div>
  </div>
);
