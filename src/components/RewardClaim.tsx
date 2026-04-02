import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { IconGift, IconWallet } from './icons/ProIcons';
import { supabase, Stake } from '../lib/supabase';
import { TOKEN_CONFIG, formatTokenAmount } from '../lib/tokenConfig';
import { useToast } from '../contexts/ToastContext';

function calculateRewards(stake: Stake): number {
  const stakeStart = stake.start_time ?? stake.created_at;
  const hoursStaked = Math.floor(
    (Date.now() - new Date(stakeStart).getTime()) / (1000 * 60 * 60)
  );
  const hourlyRate = TOKEN_CONFIG.dailyRate / 100 / 24;
  return Number(stake.amount) * hourlyRate * hoursStaked;
}

export const RewardClaim = () => {
  const { publicKey } = useWallet();
  const toast = useToast();
  const [activeStakes, setActiveStakes] = useState<Stake[]>([]);
  const [claimedByStake, setClaimedByStake] = useState<Record<string, number>>({});
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (!publicKey) return;

    const fetchStakes = async () => {
      const { data } = await supabase
        .from('stakes')
        .select('*')
        .eq('wallet_address', publicKey.toString())
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      setActiveStakes(data ?? []);
    };

    const fetchClaimed = async () => {
      try {
        const { data } = await supabase
          .from('reward_claims')
          .select('stake_id, amount')
          .eq('wallet_address', publicKey.toString());
        const byStake: Record<string, number> = {};
        data?.forEach((r: { stake_id: string | null; amount: number }) => {
          if (r.stake_id) {
            byStake[r.stake_id] = (byStake[r.stake_id] ?? 0) + Number(r.amount);
          }
        });
        setClaimedByStake(byStake);
      } catch {
        setClaimedByStake({});
      }
    };

    fetchStakes();
    fetchClaimed();
  }, [publicKey]);

  const getClaimablePerStake = (stake: Stake): number => {
    const earned = calculateRewards(stake);
    const claimed = claimedByStake[stake.id] ?? 0;
    return Math.max(0, earned - claimed);
  };

  const totalClaimable = activeStakes.reduce(
    (sum, s) => sum + getClaimablePerStake(s),
    0
  );

  const handleClaimAll = async () => {
    if (!publicKey || totalClaimable <= 0) return;
    setIsClaiming(true);
    try {
      for (const stake of activeStakes) {
        const amount = getClaimablePerStake(stake);
        if (amount <= 0) continue;
        const { error } = await supabase.from('reward_claims').insert({
          wallet_address: publicKey.toString(),
          stake_id: stake.id,
          amount,
          transaction_signature: `reward_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        });
        if (error) throw error;
      }
      toast.success(`${totalClaimable.toFixed(4)} ${TOKEN_CONFIG.symbol} rewards claimed!`);
      setClaimedByStake((prev) => {
        const next = { ...prev };
        activeStakes.forEach((s) => {
          const amt = getClaimablePerStake(s);
          if (amt > 0) next[s.id] = (next[s.id] ?? 0) + amt;
        });
        return next;
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reward claim failed');
    } finally {
      setIsClaiming(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="rounded-xl sm:rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 sm:p-8 text-center">
        <IconGift className="mx-auto mb-3 sm:mb-4 h-12 w-12 sm:h-16 sm:w-16 text-slate-500" />
        <h3 className="mb-2 text-lg sm:text-xl font-bold text-slate-100">Claim Rewards</h3>
        <p className="text-sm sm:text-base text-slate-400">Connect wallet to claim staking rewards</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl sm:rounded-2xl border border-slate-700/60 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-cyan-500/20">
            <IconGift className="h-5 w-5 sm:h-7 sm:w-7 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-400">Claimable Rewards</p>
            <p className="text-xl sm:text-3xl font-bold text-cyan-400 truncate">
              {totalClaimable.toFixed(4)} {TOKEN_CONFIG.symbol}
            </p>
            <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-500">
              From {activeStakes.length} active stake{activeStakes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {totalClaimable > 0 && (
          <button
            onClick={handleClaimAll}
            disabled={isClaiming}
            className="flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 sm:px-6 py-3 text-sm sm:text-base font-semibold text-white hover:bg-cyan-500 active:bg-cyan-500 disabled:opacity-50"
          >
            {isClaiming ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Claiming...
              </>
            ) : (
              <>
                <IconGift className="h-5 w-5" />
                Claim All Rewards
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
