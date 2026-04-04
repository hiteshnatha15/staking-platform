import { useState, useEffect, useCallback } from 'react';
import { getAdminWithdrawals, updateWithdrawal, AdminWithdrawal, Paginated } from './adminApi';

const Wallet = ({ address }: { address: string }) => (
  <span className="font-mono text-[11px] text-slate-300 break-all select-all">{address}</span>
);

const StatusBadge = ({ s }: { s: string }) => (
  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
    s === 'completed' ? 'bg-green-500/20 text-green-400' :
    s === 'pending' ? 'bg-amber-500/20 text-amber-400' :
    s === 'rejected' ? 'bg-red-500/20 text-red-400' :
    'bg-slate-500/20 text-slate-400'
  }`}>{s}</span>
);

type ModalState =
  | null
  | { type: 'complete'; withdrawal: AdminWithdrawal }
  | { type: 'reject'; withdrawal: AdminWithdrawal };

export const AdminWithdrawals = () => {
  const [data, setData] = useState<Paginated<AdminWithdrawal> | null>(null);
  const [page, setPage] = useState(1);
  const [wallet, setWallet] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [txSig, setTxSig] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await getAdminWithdrawals(page, wallet, status)); } catch { /* */ }
    setLoading(false);
  }, [page, wallet, status]);

  useEffect(() => { load(); }, [load]);

  const openComplete = (w: AdminWithdrawal) => {
    setModal({ type: 'complete', withdrawal: w });
    setTxSig('');
    setError('');
  };

  const openReject = (w: AdminWithdrawal) => {
    setModal({ type: 'reject', withdrawal: w });
    setRejectReason('');
    setError('');
  };

  const handleComplete = async () => {
    if (!modal || modal.type !== 'complete') return;
    if (!txSig.trim() || txSig.trim().length < 10) {
      setError('Enter a valid transaction signature.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await updateWithdrawal(modal.withdrawal.id, 'completed', { transaction_signature: txSig.trim() });
      setModal(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete withdrawal');
    }
    setSubmitting(false);
  };

  const handleReject = async () => {
    if (!modal || modal.type !== 'reject') return;
    setSubmitting(true);
    setError('');
    try {
      await updateWithdrawal(modal.withdrawal.id, 'rejected', { reject_reason: rejectReason.trim() || undefined });
      setModal(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject withdrawal');
    }
    setSubmitting(false);
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
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><p className="text-slate-500 mb-0.5">Amount</p><p className="font-mono text-slate-100">{w.amount.toFixed(4)}</p></div>
                  <div><p className="text-slate-500 mb-0.5">Date</p><p className="text-slate-400">{new Date(w.created_at).toLocaleDateString()}</p></div>
                </div>
                {w.transaction_signature && (
                  <div className="text-xs">
                    <p className="text-slate-500 mb-0.5">Tx Signature</p>
                    <p className="font-mono text-[10px] text-emerald-400/80 break-all select-all">{w.transaction_signature}</p>
                  </div>
                )}
                {(w as Record<string, unknown>).reject_reason && (
                  <div className="text-xs">
                    <p className="text-slate-500 mb-0.5">Rejection Reason</p>
                    <p className="text-red-400/80 text-[11px]">{String((w as Record<string, unknown>).reject_reason)}</p>
                  </div>
                )}
                {w.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => openComplete(w)} className="flex-1 py-2 rounded-lg bg-emerald-600 text-xs text-white font-medium">Complete</button>
                    <button onClick={() => openReject(w)} className="flex-1 py-2 rounded-lg bg-red-600 text-xs text-white font-medium">Reject</button>
                  </div>
                )}
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
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Tx / Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {data.data.map(w => (
                  <tr key={w.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 max-w-[260px]"><Wallet address={w.wallet_address} /></td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-slate-100">{w.amount.toFixed(4)}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge s={w.status} /></td>
                    <td className="px-4 py-3 max-w-[220px]">
                      {w.transaction_signature ? (
                        <span className="font-mono text-[11px] text-emerald-400/80 break-all select-all">{w.transaction_signature}</span>
                      ) : (w as Record<string, unknown>).reject_reason ? (
                        <span className="text-[11px] text-red-400/80">{String((w as Record<string, unknown>).reject_reason)}</span>
                      ) : (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(w.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-center">
                      {w.status === 'pending' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openComplete(w)} className="px-2.5 py-1 rounded bg-emerald-600 text-xs text-white hover:bg-emerald-500">Complete</button>
                          <button onClick={() => openReject(w)} className="px-2.5 py-1 rounded bg-red-600 text-xs text-white hover:bg-red-500">Reject</button>
                        </div>
                      ) : <span className="text-xs text-slate-500">-</span>}
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

      {/* Complete Modal */}
      {modal?.type === 'complete' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={() => setModal(null)}>
          <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-slate-700/60 bg-[#0d1321] p-5 sm:p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Complete Withdrawal</h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-white text-xl leading-none">&times;</button>
            </div>

            <div className="rounded-lg bg-slate-800/40 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Wallet</span>
                <span className="font-mono text-[11px] text-slate-200 break-all text-right max-w-[60%] select-all">{modal.withdrawal.wallet_address}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Amount</span>
                <span className="font-mono text-slate-100 font-semibold">{modal.withdrawal.amount.toFixed(4)} RUBIX</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Transaction Signature <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={txSig}
                onChange={e => setTxSig(e.target.value)}
                placeholder="Paste Solana transaction signature..."
                className="w-full px-3 py-3 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">The on-chain transaction hash after sending tokens to the user.</p>
            </div>

            {error && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={handleComplete}
                disabled={submitting || !txSig.trim()}
                className="flex-1 py-3 rounded-lg bg-emerald-600 text-sm text-white font-semibold hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Processing...' : 'Confirm & Complete'}
              </button>
              <button onClick={() => setModal(null)} className="px-5 py-3 rounded-lg bg-slate-700 text-sm text-slate-300 font-medium hover:bg-slate-600 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {modal?.type === 'reject' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={() => setModal(null)}>
          <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-slate-700/60 bg-[#0d1321] p-5 sm:p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Reject Withdrawal</h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-white text-xl leading-none">&times;</button>
            </div>

            <div className="rounded-lg bg-slate-800/40 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Wallet</span>
                <span className="font-mono text-[11px] text-slate-200 break-all text-right max-w-[60%] select-all">{modal.withdrawal.wallet_address}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Amount</span>
                <span className="font-mono text-slate-100 font-semibold">{modal.withdrawal.amount.toFixed(4)} RUBIX</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Rejection Reason (optional)</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Why is this withdrawal being rejected?"
                rows={3}
                className="w-full px-3 py-3 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            {error && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={submitting}
                className="flex-1 py-3 rounded-lg bg-red-600 text-sm text-white font-semibold hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Processing...' : 'Confirm Rejection'}
              </button>
              <button onClick={() => setModal(null)} className="px-5 py-3 rounded-lg bg-slate-700 text-sm text-slate-300 font-medium hover:bg-slate-600 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
