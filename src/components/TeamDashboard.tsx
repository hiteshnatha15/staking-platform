import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  IconUsers,
  IconUserPlus,
  IconChartTrendingUp,
  IconChevronRight,
  IconCrown,
  IconTrophy,
} from './icons/ProIcons';
import { getReferrals, getReferralCountBy, getStakeAmounts } from '../lib/api';
import { TOKEN_CONFIG, formatTokenAmount } from '../lib/tokenConfig';

interface TeamStats {
  directReferrals: number;
  totalTeam: number;
  totalTeamStaked: number;
  referrals: { referred_wallet: string; created_at: string }[];
}

export const TeamDashboard = () => {
  const { publicKey } = useWallet();
  const [stats, setStats] = useState<TeamStats>({
    directReferrals: 0,
    totalTeam: 0,
    totalTeamStaked: 0,
    referrals: [],
  });

  useEffect(() => {
    if (!publicKey) return;

    const fetchTeam = async () => {
      const wallet = publicKey.toString();

      const refs = await getReferrals(wallet);
      const referrals = refs.map((r) => ({
        referred_wallet: r.wallet_address,
        created_at: r.created_at,
      }));
      let totalTeam = referrals.length;

      for (const r of referrals) {
        const count = await getReferralCountBy(r.referred_wallet);
        totalTeam += count;
      }

      const referredWallets = referrals.map((r) => r.referred_wallet);
      let totalTeamStaked = 0;
      if (referredWallets.length > 0) {
        const stakes = await getStakeAmounts(referredWallets);
        totalTeamStaked = stakes.reduce((s, st) => s + Number(st.amount), 0);
      }

      setStats({
        directReferrals: referrals.length,
        totalTeam,
        totalTeamStaked,
        referrals,
      });
    };

    fetchTeam();
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div className="rounded-xl sm:rounded-2xl border border-slate-700/60 bg-slate-900/60 p-8 sm:p-12 text-center">
        <IconUsers className="mx-auto mb-3 sm:mb-4 h-12 w-12 sm:h-16 sm:w-16 text-slate-500" />
        <h3 className="mb-2 text-lg sm:text-xl font-bold text-slate-100">Your Team</h3>
        <p className="text-sm sm:text-base text-slate-400">Connect wallet to view your network</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6 overflow-hidden">
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="group rounded-xl sm:rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/90 to-slate-900/50 p-3 sm:p-6 shadow-xl transition-all hover:border-emerald-500/30">
          <div className="mb-2 sm:mb-4 flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-500/20">
            <IconUserPlus className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-400" />
          </div>
          <p className="mb-0.5 sm:mb-1 text-[10px] sm:text-sm font-medium text-slate-400">Direct</p>
          <p className="text-xl sm:text-3xl font-bold text-white">{stats.directReferrals}</p>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-500 hidden sm:block">Level 1 team members</p>
        </div>

        <div className="group rounded-xl sm:rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/90 to-slate-900/50 p-3 sm:p-6 shadow-xl transition-all hover:border-teal-500/30">
          <div className="mb-2 sm:mb-4 flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-teal-500/20">
            <IconUsers className="h-4 w-4 sm:h-6 sm:w-6 text-teal-400" />
          </div>
          <p className="mb-0.5 sm:mb-1 text-[10px] sm:text-sm font-medium text-slate-400">Total Team</p>
          <p className="text-xl sm:text-3xl font-bold text-white">{stats.totalTeam}</p>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-500 hidden sm:block">All levels combined</p>
        </div>

        <div className="group rounded-xl sm:rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/90 to-slate-900/50 p-3 sm:p-6 shadow-xl transition-all hover:border-cyan-500/30">
          <div className="mb-2 sm:mb-4 flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-cyan-500/20">
            <IconChartTrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-cyan-400" />
          </div>
          <p className="mb-0.5 sm:mb-1 text-[10px] sm:text-sm font-medium text-slate-400">Volume</p>
          <p className="text-lg sm:text-3xl font-bold text-white truncate">
            {stats.totalTeamStaked.toFixed(2)}
          </p>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-500">{TOKEN_CONFIG.symbol}</p>
        </div>
      </div>

      <div className="rounded-xl sm:rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4 sm:p-6">
        <div className="mb-3 sm:mb-4 flex items-center gap-2">
          <IconCrown className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
          <h3 className="text-base sm:text-lg font-bold text-slate-100">Direct Team</h3>
        </div>

        {stats.referrals.length === 0 ? (
          <div className="py-8 sm:py-12 text-center">
            <IconTrophy className="mx-auto mb-3 h-10 w-10 sm:h-12 sm:w-12 text-slate-600" />
            <p className="text-sm sm:text-base text-slate-400">No referrals yet</p>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Share your link to grow your team
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {stats.referrals.map((r, i) => (
              <div
                key={r.referred_wallet}
                className="flex items-center justify-between rounded-lg sm:rounded-xl border border-slate-700/40 bg-slate-800/40 px-3 py-2.5 sm:px-4 sm:py-3"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700/60 text-xs sm:text-sm font-bold text-slate-300">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-xs sm:text-sm text-slate-200 truncate">
                      {r.referred_wallet.slice(0, 6)}...{r.referred_wallet.slice(-4)}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-500">
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <IconChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
