import { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { IconArrowDownCircle, IconClock, IconCheckCircle, IconXCircle, IconAlert, IconWallet } from './icons/ProIcons';
import { supabase, Stake, Withdrawal } from '../lib/supabase';
import { TOKEN_CONFIG, formatTokenAmount } from '../lib/tokenConfig';
import { useToast } from '../contexts/ToastContext';

const DAILY_RELEASE_RATE = 0.01; // 1% per day

/**
 * After N full days, remaining = principal * (1 - rate)^N
 * Total released = principal - remaining = principal * (1 - (1 - rate)^N)
 */
function calcTotalReleased(principal: number, stakeDate: string): number {
  const msElapsed = Date.now() - new Date(stakeDate).getTime();
  const daysElapsed = Math.floor(msElapsed / (1000 * 60 * 60 * 24));
  if (daysElapsed <= 0) return 0;
  return principal * (1 - Math.pow(1 - DAILY_RELEASE_RATE, daysElapsed));
}

function getDaysElapsed(stakeDate: string): number {
  return Math.floor((Date.now() - new Date(stakeDate).getTime()) / (1000 * 60 * 60 * 24));
}

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

    const { data: stakes } = await supabase
      .from('stakes')
      .select('*')
      .eq('wallet_address', publicKey.toString())
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    const { data: withdrawalData } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('wallet_address', publicKey.toString())
      .order('created_at', { ascending: false });

    if (stakes) setUserStakes(stakes);
    if (withdrawalData) setWithdrawals(withdrawalData);
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
      const { error } = await supabase.from('withdrawals').insert({
        stake_id: stakeId,
        wallet_address: publicKey.toString(),
        amount: finalAmount,
        withdrawal_type: isAuto ? 'auto' : 'manual',
        status: isAuto ? 'completed' : 'pending',
        transaction_signature: isAuto
          ? `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          : null,
      });

      if (!error && isAuto) {
        toast.success(`${finalAmount.toFixed(4)} ${symbol} withdrawn successfully!`);
      } else if (!error && !isAuto) {
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
    const base = 'px-3 py-1 rounded-full text-sm font-medium';
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
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center">
          <IconWallet className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-slate-100 mb-4">Withdrawal Center</h2>
        <p className="text-slate-400">Connect your wallet to manage withdrawals</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="glass-card rounded-2xl p-5 sm:p-8">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-100 mb-1">Withdraw Staked {symbol}</h3>
        <p className="text-slate-400 text-sm mb-6">
          1% of your remaining staked balance is released daily for withdrawal.
        </p>

        {userStakes.length === 0 ? (
          <div className="text-center py-12">
            <IconArrowDownCircle className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <p className="text-slate-400">No active stakes to withdraw</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
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
                    className={`w-full text-left rounded-xl p-5 border transition-all ${
                      isSelected
                        ? 'border-violet-500/60 bg-violet-500/10'
                        : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600'
                    }`}
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Deposited</p>
                        <p className="text-lg font-bold text-slate-100">
                          {formatTokenAmount(principal)} <span className="text-xs text-slate-500">{symbol}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Days Elapsed</p>
                        <p className="text-lg font-bold text-slate-100">{days}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Already Withdrawn</p>
                        <p className="text-lg font-bold text-amber-400">
                          {formatTokenAmount(alreadyWithdrawn)} <span className="text-xs text-slate-500">{symbol}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Available Now</p>
                        <p className="text-lg font-bold text-green-400">
                          {formatTokenAmount(available)} <span className="text-xs text-slate-500">{symbol}</span>
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Released: {releasedPercent.toFixed(2)}%</span>
                        <span>
                          {formatTokenAmount(totalReleased)} / {formatTokenAmount(principal)} {symbol}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-700/60 overflow-hidden">
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
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Withdrawal Amount
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder={`0.00 ${symbol}`}
                      max={selectedAvailable}
                      step="any"
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-slate-100 font-semibold placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(selectedAvailable.toFixed(TOKEN_CONFIG.decimals))}
                      className="px-4 py-3 rounded-xl text-sm font-semibold text-violet-400 border border-violet-500/40 hover:bg-violet-500/10 transition-colors"
                    >
                      Max
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Available: <span className="text-green-400 font-medium">{formatTokenAmount(selectedAvailable)} {symbol}</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleWithdraw(selectedStake, true)}
                    disabled={isWithdrawing || !withdrawAmount || Number(withdrawAmount) <= 0}
                    className="btn-primary flex items-center justify-center gap-2 py-4 disabled:opacity-50"
                  >
                    {isWithdrawing ? 'Processing...' : 'Auto Withdraw'}
                  </button>
                  <button
                    onClick={() => handleWithdraw(selectedStake, false)}
                    disabled={isWithdrawing || !withdrawAmount || Number(withdrawAmount) <= 0}
                    className="w-full px-6 py-4 rounded-xl font-semibold text-slate-100 bg-slate-700 hover:bg-slate-600 border border-slate-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isWithdrawing ? 'Processing...' : 'Request Manual Approval'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {withdrawals.length > 0 && (
        <div className="glass-card rounded-2xl p-5 sm:p-8">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-100 mb-6">Withdrawal History</h3>
          <div className="space-y-4">
            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="rounded-xl p-6 bg-slate-800/40 border border-slate-700/50 hover:border-violet-500/30 transition-colors"
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Amount</p>
                    <p className="text-lg font-semibold text-slate-100">
                      {Number(withdrawal.amount).toFixed(4)} {symbol}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Type</p>
                    <p className="text-lg font-semibold text-slate-200 capitalize">
                      {withdrawal.withdrawal_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(withdrawal.status)}
                      <span className={getStatusBadge(withdrawal.status)}>
                        {withdrawal.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Requested</p>
                    <p className="text-sm text-slate-300">
                      {new Date(withdrawal.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
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
