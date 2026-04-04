import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { IconArrowDownCircle, IconClock, IconCheckCircle, IconXCircle, IconWallet } from './icons/ProIcons';
import { getAvailableBalance, getWithdrawals, requestWithdrawal, AvailableBalance, Withdrawal } from '../lib/api';
import { TOKEN_CONFIG, formatTokenAmount } from '../lib/tokenConfig';
import { useToast } from '../contexts/ToastContext';

export const WithdrawalInterface = () => {
  const { publicKey } = useWallet();
  const toast = useToast();
  const [balance, setBalance] = useState<AvailableBalance | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const symbol = TOKEN_CONFIG.symbol;

  useEffect(() => {
    if (publicKey) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  const fetchData = async () => {
    if (!publicKey) return;
    const wallet = publicKey.toString();
    try {
      const [bal, wds] = await Promise.all([
        getAvailableBalance(wallet),
        getWithdrawals(wallet),
      ]);
      setBalance(bal);
      setWithdrawals(wds);
    } catch (err) {
      console.error('Failed to fetch withdrawal data:', err);
    }
  };

  const totalAvailable = balance?.total ?? 0;

  const handleWithdraw = async () => {
    if (!publicKey) return;
    const requested = Number(withdrawAmount);
    if (!requested || requested <= 0) {
      toast.error('Enter a valid withdrawal amount.');
      return;
    }
    if (requested > totalAvailable + 0.0001) {
      toast.error(`Maximum available is ${formatTokenAmount(totalAvailable)} ${symbol}`);
      return;
    }

    setIsWithdrawing(true);
    try {
      await requestWithdrawal(publicKey.toString(), Math.min(requested, totalAvailable));
      toast.info('Withdrawal request submitted. Admin will process it shortly.');
      setWithdrawAmount('');
      await fetchData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Withdrawal failed. Please try again.';
      toast.error(msg);
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 sm:py-16 px-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center">
          <IconWallet className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </div>
        <h2 className="text-xl sm:text-3xl font-bold text-slate-100 mb-3 sm:mb-4">Withdrawal Center</h2>
        <p className="text-sm sm:text-base text-slate-400">Connect your wallet to manage withdrawals</p>
      </div>
    );
  }

  const hasStakes = balance && balance.stakes.length > 0;
  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const completedCount = withdrawals.filter(w => w.status === 'completed').length;
  const totalWithdrawn = withdrawals.filter(w => w.status === 'completed').reduce((s, w) => s + Number(w.amount), 0);

  return (
    <div className="w-full space-y-5 sm:space-y-8">
      {/* ─── Withdrawal Form ─── */}
      <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-8">
        <h3 className="text-lg sm:text-2xl font-bold text-slate-100 mb-1">Withdraw {symbol}</h3>
        <p className="text-slate-400 text-xs sm:text-sm mb-4 sm:mb-6">
          1% of your remaining staked balance is released daily. Enter the amount and we'll handle the rest.
        </p>

        {!hasStakes ? (
          <div className="text-center py-10 sm:py-12">
            <IconArrowDownCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-slate-500" />
            <p className="text-sm sm:text-base text-slate-400">No active stakes to withdraw from</p>
          </div>
        ) : (
          <div className="space-y-5 sm:space-y-6">
            {/* Total Available Banner */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-6 text-center">
              <p className="text-xs sm:text-sm text-slate-400 mb-1">Total Available for Withdrawal</p>
              <p className="text-3xl sm:text-4xl font-bold text-emerald-400">
                {formatTokenAmount(totalAvailable)}
              </p>
              <p className="text-xs text-slate-500 mt-1">{symbol} across {balance!.stakes.length} stake{balance!.stakes.length > 1 ? 's' : ''}</p>
            </div>

            {/* Stake Breakdown */}
            <div className="space-y-2">
              <p className="text-xs sm:text-sm font-semibold text-slate-400">Stake Breakdown</p>
              {balance!.stakes.map((s, i) => {
                const releasedPercent = s.deposited > 0 ? (s.released / s.deposited) * 100 : 0;
                return (
                  <div key={s.id} className="rounded-xl p-3 sm:p-4 border border-slate-700/50 bg-slate-800/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Stake #{i + 1}</span>
                      <span className="text-[10px] sm:text-xs text-slate-500">{s.days} days</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs sm:text-sm">
                      <div>
                        <p className="text-[10px] text-slate-500">Deposited</p>
                        <p className="font-mono font-semibold text-slate-200">{formatTokenAmount(s.deposited)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500">Withdrawn</p>
                        <p className="font-mono font-semibold text-amber-400">{formatTokenAmount(s.withdrawn)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500">Available</p>
                        <p className="font-mono font-semibold text-green-400">{formatTokenAmount(s.available)}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                          style={{ width: `${Math.min(100, releasedPercent)}%` }}
                        />
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1 text-right">
                        {releasedPercent.toFixed(2)}% released
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Withdrawal Input */}
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
                  Withdrawal Amount
                </label>
                <div className="flex gap-2 sm:gap-3">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder={`0.00 ${symbol}`}
                    max={totalAvailable}
                    step="any"
                    className="flex-1 min-w-0 px-3 sm:px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-slate-100 font-semibold placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(totalAvailable.toFixed(TOKEN_CONFIG.decimals))}
                    className="px-3 sm:px-4 py-3 rounded-xl text-sm font-semibold text-violet-400 border border-violet-500/40 hover:bg-violet-500/10 active:bg-violet-500/20 transition-colors"
                  >
                    Max
                  </button>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1.5 sm:mt-2">
                  Available: <span className="text-green-400 font-medium">{formatTokenAmount(totalAvailable)} {symbol}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleWithdraw}
                disabled={isWithdrawing || !withdrawAmount || Number(withdrawAmount) <= 0}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 text-sm sm:text-base disabled:opacity-50"
              >
                {isWithdrawing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : 'Request Withdrawal'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Withdrawal History ─── */}
      {withdrawals.length > 0 && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            <div className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-5">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-slate-500 text-[10px] sm:text-xs font-medium">Total Withdrawn</span>
                <div className="p-1.5 sm:p-2 bg-green-500/10 rounded-lg">
                  <IconCheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
                </div>
              </div>
              <p className="text-base sm:text-xl font-bold text-green-400 truncate">{formatTokenAmount(totalWithdrawn)}</p>
              <p className="text-[10px] text-slate-500">{symbol}</p>
            </div>
            <div className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-5">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-slate-500 text-[10px] sm:text-xs font-medium">Pending</span>
                <div className="p-1.5 sm:p-2 bg-amber-500/10 rounded-lg">
                  <IconClock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                </div>
              </div>
              <p className="text-base sm:text-xl font-bold text-amber-400">{pendingCount}</p>
              <p className="text-[10px] text-slate-500">Requests</p>
            </div>
            <div className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-5">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-slate-500 text-[10px] sm:text-xs font-medium">Completed</span>
                <div className="p-1.5 sm:p-2 bg-emerald-500/10 rounded-lg">
                  <IconArrowDownCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                </div>
              </div>
              <p className="text-base sm:text-xl font-bold text-emerald-400">{completedCount}</p>
              <p className="text-[10px] text-slate-500">Transactions</p>
            </div>
          </div>

          {/* History List */}
          <div>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-100 mb-3 sm:mb-4">Withdrawal Requests</h3>
            <div className="space-y-2.5 sm:space-y-3">
              {withdrawals.map((w, index) => (
                <div
                  key={w.id}
                  className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-5 card-hover animate-slideUp"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                    {/* Amount */}
                    <div>
                      <p className="text-slate-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Amount</p>
                      <p className="text-base sm:text-xl font-bold text-slate-100 truncate">
                        {Number(w.amount).toFixed(4)}
                      </p>
                      <p className="text-[10px] text-slate-600">{symbol}</p>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-slate-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Status</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {w.status === 'pending' ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                            <span className="text-amber-400 text-[11px] sm:text-xs font-semibold">Pending</span>
                          </div>
                        ) : w.status === 'completed' ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                            <IconCheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 text-[11px] sm:text-xs font-semibold">Completed</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <IconXCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400" />
                            <span className="text-red-400 text-[11px] sm:text-xs font-semibold">Rejected</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Date */}
                    <div>
                      <p className="text-slate-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Requested</p>
                      <p className="text-base sm:text-xl font-bold text-slate-100">
                        {new Date(w.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-[10px] text-slate-600">
                        {new Date(w.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {/* Tx / Info */}
                    <div className="col-span-2 sm:col-span-1">
                      {w.transaction_signature ? (
                        <>
                          <p className="text-slate-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Transaction</p>
                          <p className="font-mono text-[10px] sm:text-[11px] text-emerald-400/70 break-all leading-relaxed select-all truncate">
                            {w.transaction_signature}
                          </p>
                        </>
                      ) : w.status === 'pending' ? (
                        <>
                          <p className="text-slate-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Info</p>
                          <p className="text-[11px] sm:text-xs text-slate-500 italic">
                            Awaiting admin processing
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-slate-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Info</p>
                          <p className="text-[11px] sm:text-xs text-slate-500">-</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
