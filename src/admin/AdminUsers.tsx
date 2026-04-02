import { useState, useEffect, useCallback } from 'react';
import { getAdminUsers, getAdminUserDetail, AdminUser, Paginated } from './adminApi';

const Wallet = ({ address }: { address: string }) => (
  <span className="font-mono text-[11px] text-slate-300 break-all select-all">{address}</span>
);

export const AdminUsers = () => {
  const [data, setData] = useState<Paginated<AdminUser> | null>(null);
  const [page, setPage] = useState(1);
  const [wallet, setWallet] = useState('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getAdminUserDetail>> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await getAdminUsers(page, wallet)); } catch { /* */ }
    setLoading(false);
  }, [page, wallet]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (w: string) => {
    setDetailLoading(true);
    try { setDetail(await getAdminUserDetail(w)); } catch { /* */ }
    setDetailLoading(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-bold text-white">Users</h2>

      <input type="text" placeholder="Search wallet..." value={wallet}
        onChange={e => { setWallet(e.target.value); setPage(1); }}
        className="w-full sm:w-64 px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" /></div>
      ) : !data || data.data.length === 0 ? (
        <p className="text-slate-400 text-center py-12">No users found</p>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {data.data.map(u => (
              <div key={u.id} className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 space-y-3">
                <Wallet address={u.wallet_address} />
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div><p className="text-slate-500 mb-0.5">Total Staked</p><p className="font-mono text-slate-100">{u.total_staked.toFixed(2)}</p></div>
                  <div><p className="text-slate-500 mb-0.5">Referrals</p><p className="text-slate-300">{u.referral_count}</p></div>
                  <div><p className="text-slate-500 mb-0.5">Joined</p><p className="text-slate-400">{new Date(u.created_at).toLocaleDateString()}</p></div>
                </div>
                {u.referred_by && (
                  <div className="text-xs">
                    <p className="text-slate-500 mb-0.5">Referred By</p>
                    <Wallet address={u.referred_by} />
                  </div>
                )}
                <button onClick={() => openDetail(u.wallet_address)} className="w-full py-2 rounded-lg bg-slate-700 text-xs text-slate-300 font-medium">View Details</button>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-700/60">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Wallet</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Total Staked</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Referrals</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Referred By</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Joined</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {data.data.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 max-w-[260px]"><Wallet address={u.wallet_address} /></td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-slate-100">{u.total_staked.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{u.referral_count}</td>
                    <td className="px-4 py-3 max-w-[260px]">{u.referred_by ? <Wallet address={u.referred_by} /> : <span className="text-xs text-slate-500">-</span>}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => openDetail(u.wallet_address)} className="px-2.5 py-1 rounded bg-slate-700 text-xs text-slate-300 hover:bg-slate-600">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">{data.total} total</p>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs text-slate-300 hover:bg-slate-600 disabled:opacity-40">Prev</button>
              <span className="text-xs text-slate-400">{data.page}/{data.pages}</span>
              <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs text-slate-300 hover:bg-slate-600 disabled:opacity-40">Next</button>
            </div>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={() => setDetail(null)}>
          <div className="w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-slate-700/60 bg-[#0d1321] p-4 sm:p-6 space-y-4" onClick={e => e.stopPropagation()}>
            {detailLoading ? (
              <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" /></div>
            ) : detail ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">User Detail</h3>
                  <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-white text-xl leading-none">&times;</button>
                </div>

                <div className="rounded-lg bg-slate-800/40 p-4 space-y-2">
                  <p className="text-xs text-slate-400">Wallet</p>
                  <p className="font-mono text-xs sm:text-sm text-slate-100 break-all select-all">{detail.user.wallet_address}</p>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div><p className="text-xs text-slate-500">Referral Code</p><p className="font-mono text-xs text-emerald-400 font-medium">{detail.user.referral_code}</p></div>
                    <div>
                      <p className="text-xs text-slate-500">Referred By</p>
                      {detail.user.referred_by
                        ? <p className="font-mono text-xs text-slate-300 break-all select-all">{detail.user.referred_by}</p>
                        : <p className="text-xs text-slate-500">None</p>}
                    </div>
                    <div><p className="text-xs text-slate-500">Direct Referrals</p><p className="text-sm font-bold text-slate-100">{detail.referrals.length}</p></div>
                    <div><p className="text-xs text-slate-500">Joined</p><p className="text-xs text-slate-300">{new Date(detail.user.created_at).toLocaleDateString()}</p></div>
                  </div>
                </div>

                <DetailSection title={`Stakes (${detail.stakes.length})`} empty="No stakes">
                  {detail.stakes.map(s => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg bg-slate-800/30 px-3 py-2">
                      <span className="font-mono text-xs text-slate-200">{s.amount.toFixed(4)} RUBIX</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${s.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>{s.status}</span>
                    </div>
                  ))}
                </DetailSection>

                <DetailSection title={`Withdrawals (${detail.withdrawals.length})`} empty="No withdrawals">
                  {detail.withdrawals.map(w => (
                    <div key={w.id} className="flex items-center justify-between rounded-lg bg-slate-800/30 px-3 py-2">
                      <span className="font-mono text-xs text-slate-200">{w.amount.toFixed(4)} RUBIX</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        w.status === 'completed' ? 'bg-green-500/20 text-green-400' : w.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'
                      }`}>{w.status}</span>
                    </div>
                  ))}
                </DetailSection>

                {detail.commissions.length > 0 && (
                  <DetailSection title={`Commission Earnings (${detail.commissions.length})`}>
                    {detail.commissions.map((c: { id: string; from_wallet: string; amount: number; level: number; created_at: string }) => (
                      <div key={c.id} className="rounded-lg bg-slate-800/30 px-3 py-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-500/20 text-violet-400">L{c.level}</span>
                          <span className="font-mono text-xs text-emerald-400">{c.amount.toFixed(4)}</span>
                        </div>
                        <p className="text-[10px] text-slate-500">From: <span className="font-mono text-slate-400 break-all select-all">{c.from_wallet}</span></p>
                        <p className="text-[10px] text-slate-500">{new Date(c.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </DetailSection>
                )}

                {detail.rewards.length > 0 && (
                  <DetailSection title={`Reward Claims (${detail.rewards.length})`}>
                    {detail.rewards.map((r: { id: string; amount: number; created_at: string }) => (
                      <div key={r.id} className="flex items-center justify-between rounded-lg bg-slate-800/30 px-3 py-2">
                        <span className="font-mono text-xs text-cyan-400">{r.amount.toFixed(4)} RUBIX</span>
                        <span className="text-[11px] text-slate-500">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </DetailSection>
                )}

                {detail.referrals.length > 0 && (
                  <DetailSection title={`Direct Referrals (${detail.referrals.length})`}>
                    {detail.referrals.map(r => (
                      <div key={r.wallet_address} className="rounded-lg bg-slate-800/30 px-3 py-2 space-y-1">
                        <span className="font-mono text-[11px] text-slate-300 break-all select-all">{r.wallet_address}</span>
                        <div className="flex items-center justify-between">
                          {r.referral_code && <span className="text-[10px] text-emerald-500/60">{r.referral_code}</span>}
                          <span className="text-[10px] text-slate-500">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </DetailSection>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

const DetailSection = ({ title, empty, children }: { title: string; empty?: string; children?: React.ReactNode }) => {
  const childArr = Array.isArray(children) ? children : children ? [children] : [];
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-300 mb-2">{title}</h4>
      {childArr.length === 0 && empty ? <p className="text-xs text-slate-500">{empty}</p> : <div className="space-y-1">{children}</div>}
    </div>
  );
};
