import { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { IconArrowDownCircle, IconClock, IconCheckCircle, IconXCircle, IconAlert, IconWallet } from './icons/ProIcons';
import { getActiveStakes, getWithdrawals, insertWithdrawal, Stake, Withdrawal } from '../lib/api';
import { TOKEN_CONFIG, formatTokenAmount } from '../lib/tokenConfig';
import { useToast } from '../contexts/ToastContext';
import { calcTotalReleased, getDaysElapsed } from '../lib/stakeCalc';

export const WithdrawalInterface = () => {
  const { publicKey } = useWallet();
  const toast = useToast();
  const [userStakes, setUserStakes] = useState<Stake[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [selectedStake, setSelectedStake] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const symbol = TOKEN_CONFIG.symbol;

  useEffect(() => {
    if (publicKey) {
      fetchUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchUserData depends on publicKey
  }, [publicKey]);

  const fetchUserData = async () => {
    if (!publicKey) return;
    try {
      const wallet = publicKey.toString();
      const [stakes, withdrawalData] = await Promise.all([
        getActiveStakes(wallet),
        getWithdrawals(wallet),
      ]);
      setUserStakes(stakes);
      setWithdrawals(withdrawalData);
    } catch (err) {
      console.error('Failed to fetch user data:', err);
    }
  };

  const withdrawnByStake = useMemo(() => {
    const map: Record<string, number> = {};
    for (const w of withdrawals) {
      if (w.stake_id && (w.status === 'completed' || w.status === 'pending' || w.status === 'approved')) {
        map[w.stake_id] = (map[w.stake_id] || 0) + Number(w.amount);
      }
    }
    return map;
  }, [withdrawals]);

  const getAvailableForStake = (stake: Stake) => {
    const principal = stake.deposited_amount != null ? Number(stake.deposited_amount) : Number(stake.amount);
    const stakeDate = stake.start_time ?? stake.created_at;
    const totalReleased = calcTotalReleased(principal, stakeDate);
    const alreadyWithdrawn = withdrawnByStake[stake.id] || 0;
    return Math.max(0, totalReleased - alreadyWithdrawn);
  };

  const selectedStakeData = userStakes.find((s) => s.id === selectedStake);
  const selectedAvailable = selectedStakeData ? getAvailableForStake(selectedStakeData) : 0;

  const handleWithdraw = async (stakeId: string, isAuto: boolean) => {
    if (!publicKey) return;

    const stake = userStakes.find((s) => s.id === stakeId);
    if (!stake) return;

    const available = getAvailableForStake(stake);
    const requestedAmount = Number(withdrawAmount);

    if (!requestedAmount || requestedAmount <= 0) {
      toast.error('Enter a valid withdrawal amount.');
      return;
    }
    if (requestedAmount > available + 0.0001) {
      toast.error(`Maximum available is ${formatTokenAmount(available)} ${symbol}`);
      return;
    }

    const finalAmount = Math.min(requestedAmount, available);

    setIsWithdrawing(true);
    try {
      await insertWithdrawal({
        stake_id: stakeId,
        wallet_address: publicKey.toString(),
        amount: finalAmount,
        withdrawal_type: isAuto ? 'auto' : 'manual',
        status: isAuto ? 'completed' : 'pending',
        transaction_signature: isAuto
          ? `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          : null,
      });

      if (isAuto) {
        toast.success(`${finalAmount.toFixed(4)} ${symbol} withdrawn successfully!`);
      } else {
        toast.info('Withdrawal request submitted. Waiting for approval.');
      }

      setSelectedStake('');
      setWithdrawAmount('');
      await fetchUserData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Withdrawal failed. Please try again.';
      toast.error(msg);
      console.error('Withdrawal error:', err);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <IconCheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <IconClock className="w-5 h-5 text-amber-500" />;
      case 'approved':
        return <IconAlert className="w-5 h-5 text-blue-500" />;
      case 'rejected':
        return <IconXCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const base = 'px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-sm font-medium';
    switch (status) {
      case 'completed':
        return `${base} bg-green-500/20 text-green-400`;
      case 'pending':
        return `${base} bg-amber-500/20 text-amber-400`;
      case 'approved':
        return `${base} bg-blue-500/20 text-blue-400`;
      case 'rejected':
        return `${base} bg-red-500/20 text-red-400`;
      default:
        return `${base} bg-slate-500/20 text-slate-400`;
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

  return (
    <div className="max-w-7xl mx-auto space-y-5 sm:space-y-8">
      <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-8">
        <h3 className="text-lg sm:text-2xl font-bold text-slate-100 mb-1">Withdraw Staked {symbol}</h3>
        <p className="text-slate-400 text-xs sm:text-sm mb-4 sm:mb-6">
          1% of your remaining staked balance is released daily for withdrawal.
        </p>

        {userStakes.length === 0 ? (
          <div className="text-center py-10 sm:py-12">
            <IconArrowDownCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-slate-500" />
            <p className="text-sm sm:text-base text-slate-400">No active stakes to withdraw</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2.5 sm:space-y-3">
              {userStakes.map((stake) => {
                const principal = stake.deposited_amount != null ? Number(stake.deposited_amount) : Number(stake.amount);
                const stakeDate = stake.start_time ?? stake.created_at;
                const days = getDaysElapsed(stakeDate);
                const totalReleased = calcTotalReleased(principal, stakeDate);
                const alreadyWithdrawn = withdrawnByStake[stake.id] || 0;
                const available = Math.max(0, totalReleased - alreadyWithdrawn);
                const releasedPercent = principal > 0 ? (totalReleased / principal) * 100 : 0;
                const isSelected = selectedStake === stake.id;

                return (
                  <button
                    key={stake.id}
                    type="button"
                    onClick={() => {
                      setSelectedStake(isSelected ? '' : stake.id);
                      setWithdrawAmount('');
                    }}
                    className={`w-full text-left rounded-xl p-3.5 sm:p-5 border transition-all ${
                      isSelected
                        ? 'border-violet-500/60 bg-violet-500/10'
                        : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600'
                    }`}
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      <div>
                        <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">Deposited</p>
                        <p className="text-base sm:text-lg font-bold text-slate-100 truncate">
                          {formatTokenAmount(principal)}
                        </p>
                        <p className="text-[10px] text-slate-500">{symbol}</p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">Days</p>
                        <p className="text-base sm:text-lg font-bold text-slate-100">{days}</p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">Withdrawn</p>
                        <p className="text-base sm:text-lg font-bold text-amber-400 truncate">
                          {formatTokenAmount(alreadyWithdrawn)}
                        </p>
                        <p className="text-[10px] text-slate-500">{symbol}</p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">Available</p>
                        <p className="text-base sm:text-lg font-bold text-green-400 truncate">
                          {formatTokenAmount(available)}
                        </p>
                        <p className="text-[10px] text-slate-500">{symbol}</p>
                      </div>
                    </div>
                    <div className="mt-2.5 sm:mt-3">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 mb-1">
                        <span>Released: {releasedPercent.toFixed(2)}%</span>
                        <span>
                          {formatTokenAmount(totalReleased)} / {formatTokenAmount(principal)}
                        </span>
                      </div>
                      <div className="h-1.5 sm:h-2 rounded-full bg-slate-700/60 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                          style={{ width: `${Math.min(100, releasedPercent)}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedStake && selectedStakeData && (
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
                      max={selectedAvailable}
                      step="any"
                      className="flex-1 min-w-0 px-3 sm:px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-slate-100 font-semibold placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(selectedAvailable.toFixed(TOKEN_CONFIG.decimals))}
                      className="px-3 sm:px-4 py-3 rounded-xl text-sm font-semibold text-violet-400 border border-violet-500/40 hover:bg-violet-500/10 active:bg-violet-500/20 transition-colors"
                    >
                      Max
                    </button>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-1.5 sm:mt-2">
                    Available: <span className="text-green-400 font-medium">{formatTokenAmount(selectedAvailable)} {symbol}</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => handleWithdraw(selectedStake, true)}
                    disabled={isWithdrawing || !withdrawAmount || Number(withdrawAmount) <= 0}
                    className="btn-primary flex items-center justify-center gap-2 py-3.5 sm:py-4 text-sm sm:text-base disabled:opacity-50"
                  >
                    {isWithdrawing ? 'Processing...' : 'Auto Withdraw'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWithdraw(selectedStake, false)}
                    disabled={isWithdrawing || !withdrawAmount || Number(withdrawAmount) <= 0}
                    className="w-full px-4 sm:px-6 py-3.5 sm:py-4 rounded-xl font-semibold text-sm sm:text-base text-slate-100 bg-slate-700 hover:bg-slate-600 active:bg-slate-600 border border-slate-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isWithdrawing ? 'Processing...' : 'Manual Approval'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {withdrawals.length > 0 && (
        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-8">
          <h3 className="text-lg sm:text-2xl font-bold text-slate-100 mb-4 sm:mb-6">Withdrawal History</h3>
          <div className="space-y-2.5 sm:space-y-4">
            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="rounded-xl p-3.5 sm:p-6 bg-slate-800/40 border border-slate-700/50 hover:border-violet-500/30 transition-colors"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 items-center">
                  <div>
                    <p className="text-[10px] sm:text-sm text-slate-500 mb-0.5 sm:mb-1">Amount</p>
                    <p className="text-base sm:text-lg font-semibold text-slate-100 truncate">
                      {Number(withdrawal.amount).toFixed(4)}
                    </p>
                    <p className="text-[10px] text-slate-500 sm:hidden">{symbol}</p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-sm text-slate-500 mb-0.5 sm:mb-1">Type</p>
                    <p className="text-base sm:text-lg font-semibold text-slate-200 capitalize">
                      {withdrawal.withdrawal_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-sm text-slate-500 mb-0.5 sm:mb-1">Status</p>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {getStatusIcon(withdrawal.status)}
                      <span className={getStatusBadge(withdrawal.status)}>
                        {withdrawal.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-sm text-slate-500 mb-0.5 sm:mb-1">Date</p>
                    <p className="text-xs sm:text-sm text-slate-300">
                      {new Date(withdrawal.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="hidden md:block">
                    {withdrawal.approved_by && (
                      <>
                        <p className="text-sm text-slate-500 mb-1">Approved By</p>
                        <p className="text-xs text-slate-400 font-mono truncate max-w-[120px]">
                          {withdrawal.approved_by.slice(0, 8)}...
                        </p>
                      </>
                    )}
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
