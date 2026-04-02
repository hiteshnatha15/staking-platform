import { useState, useEffect, useCallback } from 'react';
import { getAdminUsers, getAdminUserDetail, AdminUser, Paginated } from './adminApi';

export const AdminUsers = () => {
  const [data, setData] = useState<Paginated<AdminUser> | null>(null);
  const [page, setPage] = useState(1);
  const [wallet, setWallet] = useState('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getAdminUserDetail>> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminUsers(page, wallet);
      setData(result);
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, wallet]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (w: string) => {
    setDetailLoading(true);
    try {
      const d = await getAdminUserDetail(w);
      setDetail(d);
    } catch { /* ignore */ }
    setDetailLoading(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Users</h2>

      <input
        type="text"
        placeholder="Search wallet..."
        value={wallet}
        onChange={e => { setWallet(e.target.value); setPage(1); }}
        className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : !data || data.data.length === 0 ? (
        <p className="text-slate-400 text-center py-12">No users found</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-700/60">
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
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">
                      {u.wallet_address.slice(0, 8)}...{u.wallet_address.slice(-4)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-100">{u.total_staked.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{u.referral_count}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {u.referred_by ? `${u.referred_by.slice(0, 6)}...${u.referred_by.slice(-4)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openDetail(u.wallet_address)}
                        className="px-2.5 py-1 rounded bg-slate-700 text-xs text-slate-300 hover:bg-slate-600"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">{data.total} total users</p>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs text-slate-300 hover:bg-slate-600 disabled:opacity-40">Previous</button>
              <span className="text-xs text-slate-400">Page {data.page} of {data.pages}</span>
              <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs text-slate-300 hover:bg-slate-600 disabled:opacity-40">Next</button>
            </div>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setDetail(null)}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-slate-700/60 bg-[#0d1321] p-6 space-y-4" onClick={e => e.stopPropagation()}>
            {detailLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              </div>
            ) : detail ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">User Detail</h3>
                  <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-white text-xl">&times;</button>
                </div>

                <div className="rounded-lg bg-slate-800/40 p-4 space-y-1">
                  <p className="text-xs text-slate-400">Wallet</p>
                  <p className="font-mono text-sm text-slate-100 break-all">{detail.user.wallet_address}</p>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-slate-500">Referred By</p>
                      <p className="font-mono text-xs text-slate-300">{detail.user.referred_by || 'None'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Direct Referrals</p>
                      <p className="text-sm font-bold text-slate-100">{detail.referrals.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Joined</p>
                      <p className="text-xs text-slate-300">{new Date(detail.user.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-2">Stakes ({detail.stakes.length})</h4>
                  {detail.stakes.length === 0 ? <p className="text-xs text-slate-500">No stakes</p> : (
                    <div className="space-y-1">
                      {detail.stakes.map(s => (
                        <div key={s.id} className="flex items-center justify-between rounded-lg bg-slate-800/30 px-3 py-2">
                          <span className="font-mono text-xs text-slate-200">{s.amount.toFixed(4)} RUBIX</span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            s.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                          }`}>{s.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-2">Withdrawals ({detail.withdrawals.length})</h4>
                  {detail.withdrawals.length === 0 ? <p className="text-xs text-slate-500">No withdrawals</p> : (
                    <div className="space-y-1">
                      {detail.withdrawals.map(w => (
                        <div key={w.id} className="flex items-center justify-between rounded-lg bg-slate-800/30 px-3 py-2">
                          <span className="font-mono text-xs text-slate-200">{w.amount.toFixed(4)} RUBIX</span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            w.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            w.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>{w.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {detail.referrals.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">Direct Referrals</h4>
                    <div className="space-y-1">
                      {detail.referrals.map(r => (
                        <div key={r.wallet_address} className="flex items-center justify-between rounded-lg bg-slate-800/30 px-3 py-2">
                          <span className="font-mono text-xs text-slate-300">{r.wallet_address.slice(0, 8)}...{r.wallet_address.slice(-4)}</span>
                          <span className="text-[11px] text-slate-500">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
