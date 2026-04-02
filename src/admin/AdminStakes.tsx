import { useState, useEffect, useCallback } from 'react';
import { getAdminStakes, updateStake, AdminStake, Paginated } from './adminApi';

export const AdminStakes = () => {
  const [data, setData] = useState<Paginated<AdminStake> | null>(null);
  const [page, setPage] = useState(1);
  const [wallet, setWallet] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminStakes(page, wallet, status);
      setData(result);
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, wallet, status]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (id: string) => {
    try {
      await updateStake(id, { status: editStatus });
      setEditingId(null);
      load();
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Stakes</h2>

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
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : !data || data.data.length === 0 ? (
        <p className="text-slate-400 text-center py-12">No stakes found</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-700/60">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Wallet</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Deposited</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {data.data.map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">
                      {s.wallet_address.slice(0, 8)}...{s.wallet_address.slice(-4)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-100">{s.amount.toFixed(4)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">{s.deposited_amount?.toFixed(4) ?? '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {editingId === s.id ? (
                        <select
                          value={editStatus}
                          onChange={e => setEditStatus(e.target.value)}
                          className="px-2 py-1 rounded bg-slate-700 border border-slate-600 text-xs text-slate-100"
                        >
                          <option value="active">active</option>
                          <option value="pending">pending</option>
                          <option value="withdrawn">withdrawn</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          s.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          s.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>{s.status}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingId === s.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleSave(s.id)} className="px-2.5 py-1 rounded bg-emerald-600 text-xs text-white hover:bg-emerald-500">Save</button>
                          <button onClick={() => setEditingId(null)} className="px-2.5 py-1 rounded bg-slate-600 text-xs text-white hover:bg-slate-500">Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingId(s.id); setEditStatus(s.status); }}
                          className="px-2.5 py-1 rounded bg-slate-700 text-xs text-slate-300 hover:bg-slate-600"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">{data.total} total stakes</p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs text-slate-300 hover:bg-slate-600 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-slate-400">Page {data.page} of {data.pages}</span>
              <button
                disabled={page >= data.pages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs text-slate-300 hover:bg-slate-600 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
