import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { BaseWalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  Coins,
  ArrowDownCircle,
  ChartTrendingUp,
  Users,
  DollarSign,
  LayoutDashboard,
  History,
  Wallet,
} from './components/icons/ProIcons';
import { StakingInterface } from './components/StakingInterface';
import { WithdrawalInterface } from './components/WithdrawalInterface';
import { TeamDashboard } from './components/TeamDashboard';
import { LevelIncome } from './components/LevelIncome';
import { RewardClaim } from './components/RewardClaim';
import { ReferralSection } from './components/ReferralSection';
import { TransactionHistory } from './components/TransactionHistory';
import { supabase } from './lib/supabase';
import { TOKEN_CONFIG } from './lib/tokenConfig';
import { fetchTokenPrice } from './lib/priceApi';
import rubixLogo from './assets/rubix-logo.svg';

type Tab = 'dashboard' | 'stake' | 'team' | 'income' | 'referral-wallet' | 'withdraw' | 'history';

function App() {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [tvl, setTvl] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [tokenPrice, setTokenPrice] = useState<number | null>(null);
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null);

  useEffect(() => {
    const fetchTvl = async () => {
      const { data } = await supabase
        .from('stakes')
        .select('amount')
        .eq('status', 'active');
      const total = data?.reduce((sum, s) => sum + Number(s.amount), 0) ?? 0;
      setTvl(total);
    };
    fetchTvl();
    const interval = setInterval(fetchTvl, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { count } = await supabase
          .from('referral_codes')
          .select('*', { count: 'exact', head: true });
        setTotalUsers(count ?? 0);
      } catch {
        setTotalUsers(0);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const loadPrice = async () => {
      const result = await fetchTokenPrice(TOKEN_CONFIG.mintAddress);
      if (result) {
        setTokenPrice(result.priceUsd);
        setPriceChange24h(result.priceChange24h);
      }
    };
    loadPrice();
    const interval = setInterval(loadPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!publicKey) return;
    const refCode = new URLSearchParams(window.location.search).get('ref');
    const registerUser = async () => {
      const wallet = publicKey.toString();
      const code = wallet;
      let referredBy: string | null = null;
      if (refCode) {
        const { data } = await supabase
          .from('referral_codes')
          .select('wallet_address')
          .eq('referral_code', refCode.trim())
          .maybeSingle();
        referredBy = data?.wallet_address ?? null;
      }
      await supabase.from('referral_codes').upsert(
        { wallet_address: wallet, referral_code: code, referred_by: referredBy },
        { onConflict: 'wallet_address' }
      );
    };
    registerUser().catch(() => {});
  }, [publicKey]);

  const tabs: { id: Tab; name: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'stake', name: 'Stake', icon: Coins },
    { id: 'team', name: 'Team', icon: Users },
    { id: 'income', name: 'Income', icon: DollarSign },
    { id: 'referral-wallet', name: 'Referral', icon: Wallet },
    { id: 'withdraw', name: 'Withdraw', icon: ArrowDownCircle },
    { id: 'history', name: 'History', icon: History },
  ];

  const statCards: {
    label: string;
    value: string;
    sub?: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    glow: string;
    tab: Tab;
  }[] = [
    {
      label: `${TOKEN_CONFIG.symbol} Price`,
      value: tokenPrice !== null
        ? `$${tokenPrice < 0.01 ? tokenPrice.toFixed(6) : tokenPrice.toFixed(4)}`
        : '---',
      sub: priceChange24h !== null
        ? `${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(2)}% 24h`
        : undefined,
      icon: DollarSign,
      color: 'violet',
      glow: 'group-hover:shadow-violet-500/20',
      tab: 'dashboard',
    },
    {
      label: 'Total Value Locked',
      value: tvl !== null ? `${tvl.toFixed(2)}` : '---',
      sub: TOKEN_CONFIG.symbol,
      icon: Coins,
      color: 'emerald',
      glow: 'group-hover:shadow-emerald-500/20',
      tab: 'stake',
    },
    {
      label: 'APR',
      value: `${TOKEN_CONFIG.apr}%`,
      sub: 'Annual Yield',
      icon: ChartTrendingUp,
      color: 'cyan',
      glow: 'group-hover:shadow-cyan-500/20',
      tab: 'stake',
    },
    {
      label: 'Network Members',
      value: totalUsers.toLocaleString(),
      sub: 'Active Users',
      icon: Users,
      color: 'amber',
      glow: 'group-hover:shadow-amber-500/20',
      tab: 'team',
    },
  ];

  const colorMap: Record<string, { icon: string; bg: string; ring: string; subColor: string }> = {
    violet: { icon: 'text-violet-400', bg: 'bg-violet-500/15', ring: 'ring-violet-500/20', subColor: priceChange24h !== null && priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400' },
    emerald: { icon: 'text-emerald-400', bg: 'bg-emerald-500/15', ring: 'ring-emerald-500/20', subColor: 'text-slate-500' },
    cyan: { icon: 'text-cyan-400', bg: 'bg-cyan-500/15', ring: 'ring-cyan-500/20', subColor: 'text-slate-500' },
    amber: { icon: 'text-amber-400', bg: 'bg-amber-500/15', ring: 'ring-amber-500/20', subColor: 'text-slate-500' },
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-slate-100">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.04] blur-[100px] animate-float" />
        <div className="absolute top-1/3 -left-32 h-[400px] w-[400px] rounded-full bg-violet-500/[0.04] blur-[100px] animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute bottom-0 right-1/3 h-[350px] w-[350px] rounded-full bg-cyan-500/[0.03] blur-[100px] animate-float" style={{ animationDelay: '-5s' }} />
      </div>

      {/* Navbar + Tab Navigation - sticky together at top */}
      <div className="sticky top-0 z-30">
        <nav className="border-b border-slate-800/60 bg-[#0a0f1a]/90 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 sm:h-16 items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={rubixLogo}
                  alt="Rubix"
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl object-contain shrink-0"
                />
                <div className="min-w-0">
                  <h1 className="text-base font-bold tracking-tight text-white sm:text-lg truncate">
                    {TOKEN_CONFIG.symbol} Network
                  </h1>
                  <p className="hidden sm:block text-[10px] text-slate-500">
                    Staking &middot; Referrals &middot; Earnings
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-medium text-slate-400">
                    {totalUsers.toLocaleString()} members
                  </span>
                </div>
                <BaseWalletMultiButton
                  labels={{
                    'change-wallet': 'Change wallet',
                    connecting: 'Connecting ...',
                    'copy-address': 'Copy address',
                    copied: 'Copied',
                    disconnect: 'Disconnect',
                    'has-wallet': 'Connect',
                    'no-wallet': 'Connect Wallet',
                  }}
                />
              </div>
            </div>
          </div>
        </nav>

        {/* Tab navigation - directly under navbar */}
        <div className="border-b border-slate-800/40 bg-[#0a0f1a]/85 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="flex gap-0.5 sm:gap-1 py-1.5 sm:py-2 overflow-x-auto scrollbar-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 sm:px-4 sm:py-2 sm:text-sm ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-500 hover:text-slate-300 active:scale-95'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20" />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>{tab.name}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Stat cards - clickable */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {statCards.map((card) => {
                const Icon = card.icon;
                const c = colorMap[card.color];
                return (
                  <button
                    key={card.label}
                    type="button"
                    onClick={() => setActiveTab(card.tab)}
                    className={`group relative text-left rounded-2xl border border-slate-800/60 bg-slate-900/50 p-4 sm:p-6 backdrop-blur-sm card-interactive hover:border-slate-700/80 hover:shadow-2xl ${card.glow}`}
                  >
                    <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} ring-1 ${c.ring} transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className={`h-5 w-5 ${c.icon}`} />
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-slate-400 mb-1 truncate">{card.label}</p>
                    <p className="text-xl sm:text-2xl font-bold text-white truncate">{card.value}</p>
                    {card.sub && (
                      <p className={`mt-0.5 text-xs font-medium ${card.color === 'violet' ? c.subColor : 'text-slate-500'}`}>
                        {card.sub}
                      </p>
                    )}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-medium text-slate-500">View &rarr;</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { text: '30% Auto-Stake Bonus', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { text: '1% Daily Unstake', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                { text: '3-Level Referrals', color: 'text-violet-400', bg: 'bg-violet-500/10' },
                { text: '10% Daily Withdrawal', color: 'text-amber-400', bg: 'bg-amber-500/10' },
              ].map((f) => (
                <div key={f.text} className={`rounded-xl ${f.bg} border border-slate-800/40 px-3 py-3 sm:px-4 sm:py-3 text-center`}>
                  <p className={`text-xs sm:text-sm font-semibold ${f.color}`}>{f.text}</p>
                </div>
              ))}
            </div>

            {/* Main content grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <StakingInterface />
              </div>
              <div className="space-y-6">
                <ReferralSection />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <TeamDashboard />
              <LevelIncome />
            </div>
          </div>
        )}

        {activeTab === 'stake' && (
          <div className="animate-fadeIn">
            <StakingInterface />
          </div>
        )}

        {activeTab === 'team' && (
          <div className="animate-fadeIn space-y-6">
            <ReferralSection />
            <TeamDashboard />
          </div>
        )}

        {activeTab === 'income' && (
          <div className="animate-fadeIn space-y-6">
            <RewardClaim />
            <LevelIncome />
          </div>
        )}

        {activeTab === 'referral-wallet' && (
          <div className="animate-fadeIn space-y-6">
            <ReferralSection />
            <LevelIncome />
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div className="animate-fadeIn">
            <WithdrawalInterface />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-fadeIn">
            <TransactionHistory />
          </div>
        )}
      </main>

      <footer className="relative z-10 mt-12 border-t border-slate-800/40 py-6 text-center">
        <p className="text-xs text-slate-600">
          {TOKEN_CONFIG.symbol} Staking Network &middot; Built on Solana
        </p>
      </footer>
    </div>
  );
}

export default App;
