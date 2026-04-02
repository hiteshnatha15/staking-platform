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
import { supabase } from '../lib/supabase';
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

      const { data: refs } = await supabase
        .from('referral_codes')
        .select('wallet_address, created_at')
        .eq('referred_by', wallet)
        .order('created_at', { ascending: false });

      const referrals = (refs || []).map((r) => ({
        referred_wallet: r.wallet_address,
        created_at: r.created_at,
      }));
      let totalTeam = referrals.length;

      for (const r of referrals) {
        const { count } = await supabase
          .from('referral_codes')
          .select('*', { count: 'exact', head: true })
          .eq('referred_by', r.referred_wallet);
        totalTeam += count || 0;
      }

      const referredWallets = referrals.map((r) => r.referred_wallet);
      let totalTeamStaked = 0;
      if (referredWallets.length > 0) {
        const { data: stakes } = await supabase
          .from('stakes')
          .select('amount')
          .in('wallet_address', referredWallets)
          .eq('status', 'active');
        totalTeamStaked = stakes?.reduce((s, st) => s + Number(st.amount), 0) || 0;
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
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-12 text-center">
        <IconUsers className="mx-auto mb-4 h-16 w-16 text-slate-500" />
        <h3 className="mb-2 text-xl font-bold text-slate-100">Your Team</h3>
        <p className="text-slate-400">Connect wallet to view your network</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="group rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/90 to-slate-900/50 p-6 shadow-xl transition-all hover:border-emerald-500/30">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
            <IconUserPlus className="h-6 w-6 text-emerald-400" />
          </div>
          <p className="mb-1 text-sm font-medium text-slate-400">Direct Referrals</p>
          <p className="text-3xl font-bold text-white">{stats.directReferrals}</p>
          <p className="mt-1 text-xs text-slate-500">Level 1 team members</p>
        </div>

        <div className="group rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/90 to-slate-900/50 p-6 shadow-xl transition-all hover:border-teal-500/30">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/20">
            <IconUsers className="h-6 w-6 text-teal-400" />
          </div>
          <p className="mb-1 text-sm font-medium text-slate-400">Total Team</p>
          <p className="text-3xl font-bold text-white">{stats.totalTeam}</p>
          <p className="mt-1 text-xs text-slate-500">All levels combined</p>
        </div>

        <div className="group rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/90 to-slate-900/50 p-6 shadow-xl transition-all hover:border-cyan-500/30">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
            <IconChartTrendingUp className="h-6 w-6 text-cyan-400" />
          </div>
          <p className="mb-1 text-sm font-medium text-slate-400">Team Volume</p>
          <p className="text-3xl font-bold text-white">
            {stats.totalTeamStaked.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-slate-500">{TOKEN_CONFIG.symbol} staked</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6">
        <div className="mb-4 flex items-center gap-2">
          <IconCrown className="h-5 w-5 text-amber-400" />
          <h3 className="text-lg font-bold text-slate-100">Direct Team</h3>
        </div>

        {stats.referrals.length === 0 ? (
          <div className="py-12 text-center">
            <IconTrophy className="mx-auto mb-3 h-12 w-12 text-slate-600" />
            <p className="text-slate-400">No referrals yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Share your link to grow your team
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.referrals.map((r, i) => (
              <div
                key={r.referred_wallet}
                className="flex items-center justify-between rounded-xl border border-slate-700/40 bg-slate-800/40 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700/60 text-sm font-bold text-slate-300">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-mono text-sm text-slate-200">
                      {r.referred_wallet.slice(0, 8)}...{r.referred_wallet.slice(-6)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <IconChevronRight className="h-5 w-5 text-slate-500" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
