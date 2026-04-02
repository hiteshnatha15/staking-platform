import { useState, useEffect, useCallback } from 'react';
import { getAdminWithdrawals, updateWithdrawal, AdminWithdrawal, Paginated } from './adminApi';

const Wallet = ({ address }: { address: string }) => (
  <span className="font-mono text-[11px] text-slate-300 break-all select-all">{address}</span>
);

const StatusBadge = ({ s }: { s: string }) => (
  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
    s === 'completed' ? 'bg-green-500/20 text-green-400' :
    s === 'approved' ? 'bg-blue-500/20 text-blue-400' :
    s === 'pending' ? 'bg-amber-500/20 text-amber-400' :
    s === 'rejected' ? 'bg-red-500/20 text-red-400' :
    'bg-slate-500/20 text-slate-400'
  }`}>{s}</span>
);

export const AdminWithdrawals = () => {
  const [data, setData] = useState<Paginated<AdminWithdrawal> | null>(null);
  const [page, setPage] = useState(1);
  const [wallet, setWallet] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await getAdminWithdrawals(page, wallet, status)); } catch { /* */ }
    setLoading(false);
  }, [page, wallet, status]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id: string, newStatus: string) => {
    setActionId(id);
    try { await updateWithdrawal(id, newStatus); load(); } catch { /* */ }
    setActionId(null);
  };

  const ActionButtons = ({ w }: { w: AdminWithdrawal }) => {
    if (w.status === 'pending') return (
      <div className="flex gap-2">
        <button disabled={actionId === w.id} onClick={() => handleAction(w.id, 'approved')} className="flex-1 py-2 sm:py-1 sm:px-2.5 rounded-lg sm:rounded bg-emerald-600 text-xs text-white font-medium disabled:opacity-50">Approve</button>
        <button disabled={actionId === w.id} onClick={() => handleAction(w.id, 'rejected')} className="flex-1 py-2 sm:py-1 sm:px-2.5 rounded-lg sm:rounded bg-red-600 text-xs text-white font-medium disabled:opacity-50">Reject</button>
      </div>
    );
    if (w.status === 'approved') return (
      <button disabled={actionId === w.id} onClick={() => handleAction(w.id, 'completed')} className="w-full sm:w-auto py-2 sm:py-1 sm:px-2.5 rounded-lg sm:rounded bg-blue-600 text-xs text-white font-medium disabled:opacity-50">Complete</button>
    );
    return <span className="text-xs text-slate-500">-</span>;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-bold text-white">Withdrawals</h2>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <input type="text" placeholder="Search wallet..." value={wallet}
          onChange={e => { setWallet(e.target.value); setPage(1); }}
          className="w-full sm:w-64 px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" /></div>
      ) : !data || data.data.length === 0 ? (
        <p className="text-slate-400 text-center py-12">No withdrawals found</p>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {data.data.map(w => (
              <div key={w.id} className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Wallet address={w.wallet_address} />
                  <StatusBadge s={w.status} />
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div><p className="text-slate-500 mb-0.5">Amount</p><p className="font-mono text-slate-100">{w.amount.toFixed(4)}</p></div>
                  <div><p className="text-slate-500 mb-0.5">Type</p><p className="text-slate-300 capitalize">{w.withdrawal_type}</p></div>
                  <div><p className="text-slate-500 mb-0.5">Date</p><p className="text-slate-400">{new Date(w.created_at).toLocaleDateString()}</p></div>
                </div>
                <ActionButtons w={w} />
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-700/60">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Wallet</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {data.data.map(w => (
                  <tr key={w.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 max-w-[260px]"><Wallet address={w.wallet_address} /></td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-slate-100">{w.amount.toFixed(4)}</td>
                    <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700/60 text-slate-300 capitalize">{w.withdrawal_type}</span></td>
                    <td className="px-4 py-3 text-center"><StatusBadge s={w.status} /></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(w.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-center"><ActionButtons w={w} /></td>
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
    </div>
  );
};
