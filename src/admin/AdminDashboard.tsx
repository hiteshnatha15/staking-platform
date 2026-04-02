import { useState, useEffect } from 'react';
import { getStats, getActivity, DashboardStats, ActivityItem } from './adminApi';

export const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStats(), getActivity()])
      .then(([s, a]) => { setStats(s); setActivity(a); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!stats) return <p className="text-slate-400 text-center py-20">Failed to load stats</p>;

  const cards = [
    { label: 'Total Value Locked', value: stats.tvl.toFixed(2), sub: 'RUBIX', color: 'emerald' },
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), sub: 'Registered', color: 'violet' },
    { label: 'Active Stakes', value: stats.activeStakes.toLocaleString(), sub: `of ${stats.totalStakes} total`, color: 'cyan' },
    { label: 'Pending Withdrawals', value: stats.pendingWithdrawals.toString(), sub: `${stats.pendingWithdrawalAmount.toFixed(2)} RUBIX`, color: 'amber' },
    { label: '24h New Stakes', value: stats.stakes24h.toString(), sub: 'Last 24 hours', color: 'blue' },
    { label: 'Rewards Claimed', value: stats.totalRewardsClaimed.toFixed(2), sub: 'RUBIX total', color: 'pink' },
    { label: 'Total Commissions', value: stats.totalCommissions.toFixed(2), sub: 'RUBIX earned', color: 'orange' },
  ];

  const colorClasses: Record<string, { bg: string; text: string }> = {
    emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
    violet: { bg: 'bg-violet-500/15', text: 'text-violet-400' },
    cyan: { bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
    amber: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
    blue: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
    pink: { bg: 'bg-pink-500/15', text: 'text-pink-400' },
    orange: { bg: 'bg-orange-500/15', text: 'text-orange-400' },
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => {
          const clr = colorClasses[c.color];
          return (
            <div key={c.label} className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-5">
              <p className="text-xs font-medium text-slate-400 mb-1">{c.label}</p>
              <p className={`text-2xl font-bold ${clr.text}`}>{c.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{c.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-5">
        <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
        {activity.length === 0 ? (
          <p className="text-sm text-slate-500">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {activity.map(item => (
              <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-800/40 px-4 py-3 border border-slate-700/40">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`shrink-0 px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                    item.type === 'stake' ? 'bg-emerald-500/20 text-emerald-400' :
                    item.type === 'withdrawal' ? 'bg-violet-500/20 text-violet-400' :
                    'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {item.type}
                  </span>
                  <span className="font-mono text-xs text-slate-300 truncate">
                    {item.wallet.slice(0, 6)}...{item.wallet.slice(-4)}
                  </span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-mono text-sm font-semibold text-slate-100">{item.amount.toFixed(2)}</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    item.status === 'active' || item.status === 'completed' || item.status === 'claimed' ? 'bg-green-500/20 text-green-400' :
                    item.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {item.status}
                  </span>
                  <span className="text-[11px] text-slate-500 w-20 text-right">
                    {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
