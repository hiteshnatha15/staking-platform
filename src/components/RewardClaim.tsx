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
  const hourlyRate = TOKEN_CONFIG.apr / 100 / 365 / 24;
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
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-8 text-center">
        <IconGift className="mx-auto mb-4 h-16 w-16 text-slate-500" />
        <h3 className="mb-2 text-xl font-bold text-slate-100">Claim Rewards</h3>
        <p className="text-slate-400">Connect wallet to claim staking rewards</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/20">
            <IconGift className="h-7 w-7 text-cyan-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Claimable Rewards</p>
            <p className="text-3xl font-bold text-cyan-400">
              {totalClaimable.toFixed(4)} {TOKEN_CONFIG.symbol}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              From {activeStakes.length} active stake{activeStakes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {totalClaimable > 0 && (
          <button
            onClick={handleClaimAll}
            disabled={isClaiming}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
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
