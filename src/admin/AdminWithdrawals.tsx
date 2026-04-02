import { useState, useEffect, useCallback } from 'react';
import { getAdminWithdrawals, updateWithdrawal, AdminWithdrawal, Paginated } from './adminApi';

export const AdminWithdrawals = () => {
  const [data, setData] = useState<Paginated<AdminWithdrawal> | null>(null);
  const [page, setPage] = useState(1);
  const [wallet, setWallet] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminWithdrawals(page, wallet, status);
      setData(result);
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, wallet, status]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id: string, newStatus: string) => {
    setActionId(id);
    try {
      await updateWithdrawal(id, newStatus);
      load();
    } catch { /* ignore */ }
    setActionId(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Withdrawals</h2>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search wallet..."
          value={wallet}
          onChange={e => { setWallet(e.target.value); setPage(1); }}
          className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
        />
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : !data || data.data.length === 0 ? (
        <p className="text-slate-400 text-center py-12">No withdrawals found</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-700/60">
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
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">
                      {w.wallet_address.slice(0, 8)}...{w.wallet_address.slice(-4)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-100">{w.amount.toFixed(4)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700/60 text-slate-300 capitalize">{w.withdrawal_type}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        w.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        w.status === 'approved' ? 'bg-blue-500/20 text-blue-400' :
                        w.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        w.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>{w.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(w.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {w.status === 'pending' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            disabled={actionId === w.id}
                            onClick={() => handleAction(w.id, 'approved')}
                            className="px-2.5 py-1 rounded bg-emerald-600 text-xs text-white hover:bg-emerald-500 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            disabled={actionId === w.id}
                            onClick={() => handleAction(w.id, 'rejected')}
                            className="px-2.5 py-1 rounded bg-red-600 text-xs text-white hover:bg-red-500 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : w.status === 'approved' ? (
                        <button
                          disabled={actionId === w.id}
                          onClick={() => handleAction(w.id, 'completed')}
                          className="px-2.5 py-1 rounded bg-blue-600 text-xs text-white hover:bg-blue-500 disabled:opacity-50"
                        >
                          Complete
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">{data.total} total withdrawals</p>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs text-slate-300 hover:bg-slate-600 disabled:opacity-40">Previous</button>
              <span className="text-xs text-slate-400">Page {data.page} of {data.pages}</span>
              <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs text-slate-300 hover:bg-slate-600 disabled:opacity-40">Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
