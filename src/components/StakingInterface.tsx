import { useState, useEffect, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { IconCoins, IconChartTrendingUp, IconClock, IconArrowRight, IconWallet, IconAlert } from './icons/ProIcons';
import { getStakes, getWithdrawals, insertStake, updateStakeStatus, Stake, Withdrawal } from '../lib/api';
import { TOKEN_CONFIG, isTokenConfigured, formatTokenAmount } from '../lib/tokenConfig';
import { useToast } from '../contexts/ToastContext';
import {
  getConnection,
  getSolBalance,
  getTokenBalance,
  buildVaultTransaction,
  confirmVaultTransfer,
  toRawAmount,
} from '../lib/solana';

const DAILY_RELEASE_RATE = 0.01;

function calcTotalReleased(principal: number, stakeDate: string): number {
  const msElapsed = Date.now() - new Date(stakeDate).getTime();
  const daysElapsed = Math.floor(msElapsed / (1000 * 60 * 60 * 24));
  if (daysElapsed <= 0) return 0;
  return principal * (1 - Math.pow(1 - DAILY_RELEASE_RATE, daysElapsed));
}

const PENDING_STAKE_KEY = 'rubix_pending_stake';

export const StakingInterface = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [isStaking, setIsStaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userStakes, setUserStakes] = useState<Stake[]>([]);
  const [totalStaked, setTotalStaked] = useState(0);
  const [totalRewards, setTotalRewards] = useState(0);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  const fetchBalances = () => {
    if (!publicKey) return;
    fetchUserStakes();
    getSolBalance(getConnection(), publicKey).then(setSolBalance);
    getTokenBalance(getConnection(), publicKey).then(setTokenBalance);
  };

  useEffect(() => {
    if (publicKey) {
      fetchBalances();
      const interval = setInterval(fetchBalances, 5000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchUserStakes depends on publicKey
  }, [publicKey]);

  // Recover pending stake after page reload
  useEffect(() => {
    if (!publicKey) return;
    const raw = localStorage.getItem(PENDING_STAKE_KEY);
    if (!raw) return;
    try {
      const pending = JSON.parse(raw);
      if (pending.wallet !== publicKey.toString()) return;
      localStorage.removeItem(PENDING_STAKE_KEY);
      (async () => {
        try {
          await insertStake({
            wallet_address: pending.wallet,
            amount: pending.amount,
            deposited_amount: pending.deposited,
            transaction_signature: pending.signature,
            status: 'pending',
          });
          const confirmed = await confirmVaultTransfer({
            signature: pending.signature,
            blockhash: pending.blockhash,
            lastValidBlockHeight: pending.lastValidBlockHeight,
          });
          if (confirmed) {
            await updateStakeStatus(pending.signature, 'active');
          }
          toast.success(`Recovered stake: ${pending.deposited} ${TOKEN_CONFIG.symbol}`);
          fetchUserStakes();
        } catch {
          toast.info('Pending stake recovery attempted.');
        }
      })();
    } catch {
      localStorage.removeItem(PENDING_STAKE_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  const fetchUserStakes = async () => {
    if (!publicKey) return;
    try {
      const wallet = publicKey.toString();
      const [data, withdrawalData] = await Promise.all([
        getStakes(wallet, 'active,pending'),
        getWithdrawals(wallet),
      ]);
      setWithdrawals(withdrawalData);
      setUserStakes(data);
      const total = data.reduce((sum: number, stake: Stake) => sum + Number(stake.amount), 0);
      const rewards = data.reduce(
        (sum: number, stake: Stake) => sum + Number(calculateRewards(stake)),
        0
      );
      setTotalStaked(total);
      setTotalRewards(rewards);
    } catch (err) {
      console.error('Failed to fetch stakes:', err);
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

  const handleStake = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!publicKey || !amount || Number(amount) <= 0) return;
    setError(null);

    const amountNum = Number(amount);
    if (tokenBalance !== null && amountNum > tokenBalance) {
      setError(`Insufficient balance. You have ${formatTokenAmount(tokenBalance)} ${TOKEN_CONFIG.symbol}`);
      return;
    }

    setIsStaking(true);
    try {
      const effectiveAmount = amountNum * (1 + TOKEN_CONFIG.stakingBonusPercent / 100);

      if (isTokenConfigured() && sendTransaction) {
        const amountRaw = toRawAmount(amountNum);

        // Phase 1: Build transaction (before wallet popup)
        const { transaction, blockhash, lastValidBlockHeight } = await buildVaultTransaction(publicKey, amountRaw);

        // Phase 2: Send via wallet adapter (sign + send atomically, avoids Phantom reload bug)
        const signature = await sendTransaction(transaction, connection, {
          skipPreflight: true,
          maxRetries: 3,
        });

        // Save to localStorage immediately in case page reloads
        localStorage.setItem(PENDING_STAKE_KEY, JSON.stringify({
          wallet: publicKey.toString(),
          amount: effectiveAmount,
          deposited: amountNum,
          signature,
          blockhash,
          lastValidBlockHeight,
        }));

        // Phase 3: Record in DB as "pending"
        await insertStake({
          wallet_address: publicKey.toString(),
          amount: effectiveAmount,
          deposited_amount: amountNum,
          transaction_signature: signature,
          status: 'pending',
        });

        // Clear localStorage once DB record is saved
        localStorage.removeItem(PENDING_STAKE_KEY);

        // Phase 4: Wait for on-chain confirmation, then upgrade to active
        const confirmed = await confirmVaultTransfer({ signature, blockhash, lastValidBlockHeight });
        if (confirmed) {
          await updateStakeStatus(signature, 'active');
        }
      } else {
        const txSignature = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await insertStake({
          wallet_address: publicKey.toString(),
          amount: effectiveAmount,
          deposited_amount: amountNum,
          transaction_signature: txSignature,
          status: 'active',
        });
      }

      setAmount('');
      await fetchUserStakes();
      if (isTokenConfigured() && publicKey) {
        getTokenBalance(connection, publicKey).then(setTokenBalance);
      }
      const bonus = amountNum * (TOKEN_CONFIG.stakingBonusPercent / 100);
      toast.success(`Successfully staked ${amountNum} ${TOKEN_CONFIG.symbol}! +${TOKEN_CONFIG.stakingBonusPercent}% bonus (${bonus.toFixed(4)}) = ${(amountNum + bonus).toFixed(4)} ${TOKEN_CONFIG.symbol}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Staking failed. Please try again.';
      setError(msg);
      toast.error(msg);
      console.error('Staking error:', err);
    } finally {
      setIsStaking(false);
    }
  };

  const calculateRewards = (stake: Stake) => {
    const stakeStart = stake.start_time ?? stake.created_at;
    const hoursStaked = Math.floor(
      (Date.now() - new Date(stakeStart).getTime()) / (1000 * 60 * 60)
    );
    const hourlyRate = TOKEN_CONFIG.dailyRate / 100 / 24;
    return (Number(stake.amount) * hourlyRate * hoursStaked).toFixed(4);
  };

  const symbol = TOKEN_CONFIG.symbol;

  if (!publicKey) {
    return (
      <div className="text-center py-12 sm:py-20 px-4">
        <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <IconWallet className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
        </div>
        <h2 className="text-xl sm:text-3xl font-bold text-slate-100 mb-2 sm:mb-3">Connect Your Wallet</h2>
        <p className="text-slate-400 text-sm sm:text-lg max-w-md mx-auto">
          Connect your Solana wallet to stake {symbol} and earn {TOKEN_CONFIG.dailyRate}% Daily
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!isTokenConfigured() && (
        <div className="rounded-xl p-4 flex items-center gap-3 border border-amber-500/30 bg-amber-500/5">
          <IconAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="font-semibold text-amber-200 text-sm">Demo Mode</p>
            <p className="text-xs text-slate-400">
              Set VITE_TOKEN_MINT and VITE_STAKING_VAULT in .env for on-chain staking.
            </p>
          </div>
        </div>
      )}

      {/* Wallet stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="group glass-card rounded-xl sm:rounded-2xl p-3 sm:p-5 card-hover">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-slate-500 text-[10px] sm:text-xs font-medium">Wallet</span>
            <button
              type="button"
              onClick={fetchBalances}
              className="rounded-md px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] font-medium text-slate-500 hover:bg-slate-700/40 hover:text-slate-300 transition-colors duration-150"
            >
              Refresh
            </button>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-slate-100 truncate">
            {solBalance !== null ? solBalance.toFixed(4) : '---'}
          </p>
          <p className="text-[10px] text-slate-500 mb-1">SOL</p>
          <div className="pt-1.5 border-t border-slate-700/40">
            <p className="text-base sm:text-xl font-bold text-slate-100 truncate">
              {tokenBalance !== null ? formatTokenAmount(tokenBalance) : '---'}
            </p>
            <p className="text-[10px] text-slate-500">{symbol}</p>
          </div>
        </div>

        <div className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-5 card-hover">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-slate-500 text-[10px] sm:text-xs font-medium">Total Staked</span>
            <div className="p-1.5 sm:p-2 bg-emerald-500/10 rounded-lg">
              <IconCoins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-slate-100 truncate">{formatTokenAmount(totalStaked)}</p>
          <p className="text-[10px] text-slate-500">{symbol}</p>
        </div>

        <div className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-5 card-hover">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-slate-500 text-[10px] sm:text-xs font-medium">Rewards</span>
            <div className="p-1.5 sm:p-2 bg-green-500/10 rounded-lg">
              <IconChartTrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-green-400 truncate">{formatTokenAmount(totalRewards)}</p>
          <p className="text-[10px] text-slate-500">{symbol}</p>
        </div>

        <div className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-5 card-hover">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-slate-500 text-[10px] sm:text-xs font-medium">Positions</span>
            <div className="p-1.5 sm:p-2 bg-cyan-500/10 rounded-lg">
              <IconClock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-cyan-400">{userStakes.length}</p>
          <p className="text-[10px] text-slate-500">Active Stakes</p>
        </div>
      </div>

      {/* Stake form */}
      <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-8">
        <h3 className="text-lg sm:text-2xl font-bold text-slate-100 mb-1">Stake {symbol}</h3>
        <p className="text-slate-400 text-xs sm:text-sm mb-1">
          Lock {symbol} to earn {TOKEN_CONFIG.dailyRate}% Daily rewards
        </p>
        <p className="text-emerald-400 text-[11px] sm:text-xs font-medium mb-4 sm:mb-5">
          +{TOKEN_CONFIG.stakingBonusPercent}% instant bonus: stake 100 = get {(100 * (1 + TOKEN_CONFIG.stakingBonusPercent / 100)).toFixed(0)} {symbol}
        </p>
        <div className="space-y-3 sm:space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs sm:text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
              Amount to Stake
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`0.00 ${symbol}`}
                className="flex-1 min-w-0 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-100 font-semibold text-base sm:text-lg placeholder-slate-600"
              />
              {tokenBalance !== null && (
                <button
                  type="button"
                  onClick={() => setAmount(tokenBalance.toString())}
                  className="px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl text-sm font-semibold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 active:bg-emerald-500/20 transition-colors duration-150"
                >
                  Max
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleStake}
            disabled={isStaking || !amount || Number(amount) <= 0}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 sm:py-4 text-sm sm:text-lg"
          >
            {isStaking ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Staking...
              </>
            ) : (
              <>
                Stake Now
                <IconArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Active stakes list */}
      {userStakes.length > 0 && (
        <div>
          <h3 className="text-lg sm:text-2xl font-bold text-slate-100 mb-3 sm:mb-4">Your Active Stakes</h3>
          <div className="space-y-2.5 sm:space-y-3">
            {userStakes.map((stake, index) => {
              const principal = stake.deposited_amount != null ? Number(stake.deposited_amount) : Number(stake.amount);
              const stakeDate = stake.start_time ?? stake.created_at;
              const totalReleased = calcTotalReleased(principal, stakeDate);
              const alreadyWithdrawn = withdrawnByStake[stake.id] || 0;
              const available = Math.max(0, totalReleased - alreadyWithdrawn);

              return (
                <div
                  key={stake.id}
                  className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-5 card-hover animate-slideUp"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
                    <div>
                      <p className="text-slate-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Staked</p>
                      <p className="text-base sm:text-xl font-bold text-slate-100 truncate">
                        {formatTokenAmount(Number(stake.amount))}
                      </p>
                      <p className="text-[10px] text-slate-600">{symbol}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Rewards</p>
                      <p className="text-base sm:text-xl font-bold text-green-400 truncate">
                        {calculateRewards(stake)}
                      </p>
                      <p className="text-[10px] text-slate-600">{symbol}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Withdrawable</p>
                      <p className="text-base sm:text-xl font-bold text-emerald-400 truncate">
                        {formatTokenAmount(available)}
                      </p>
                      <p className="text-[10px] text-slate-600">1% daily</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Since</p>
                      <p className="text-base sm:text-xl font-bold text-slate-100">
                        {new Date(stakeDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-[10px] text-slate-600">
                        {new Date(stakeDate).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center justify-start sm:justify-end col-span-2 sm:col-span-1">
                      {stake.status === 'pending' ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                          <span className="text-amber-400 text-[11px] sm:text-xs font-semibold">Confirming</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                          <span className="text-emerald-400 text-[11px] sm:text-xs font-semibold">Active</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
