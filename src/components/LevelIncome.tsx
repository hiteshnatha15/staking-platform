import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  IconDollar,
  IconLayers,
  IconWallet,
  IconChevronDown,
  IconChevronUp,
  IconArrowDownCircle,
  IconChartTrendingUp,
} from './icons/ProIcons';
import { supabase } from '../lib/supabase';
import { TOKEN_CONFIG, formatTokenAmount } from '../lib/tokenConfig';
import { useToast } from '../contexts/ToastContext';

const REFERRAL_LEVELS = [
  { level: 1, percent: 10, label: 'Level 1 (Direct)' },
  { level: 2, percent: 5, label: 'Level 2' },
  { level: 3, percent: 3, label: 'Level 3' },
];

const DAILY_RELEASE_RATE = 0.10; // 10% per day

interface EarningRecord {
  amount: number;
  created_at: string;
  level: number;
}

function calcReleasedForEarning(amount: number, earnedDate: string): number {
  const msElapsed = Date.now() - new Date(earnedDate).getTime();
  const daysElapsed = Math.floor(msElapsed / (1000 * 60 * 60 * 24));
  if (daysElapsed <= 0) return 0;
  return amount * (1 - Math.pow(1 - DAILY_RELEASE_RATE, daysElapsed));
}

export const LevelIncome = () => {
  const { publicKey } = useWallet();
  const toast = useToast();
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [totalReleased, setTotalReleased] = useState(0);
  const [earningsByLevel, setEarningsByLevel] = useState<Record<number, number>>({});
  const [expanded, setExpanded] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const availableToWithdraw = Math.max(0, totalReleased - totalWithdrawn);

  useEffect(() => {
    if (!publicKey) return;

    const fetchEarnings = async () => {
      const { data } = await supabase
        .from('commission_earnings')
        .select('level, amount, created_at')
        .eq('wallet_address', publicKey.toString());

      let total = 0;
      let released = 0;
      const byLevel: Record<number, number> = {};
      REFERRAL_LEVELS.forEach((l) => (byLevel[l.level] = 0));

      (data as EarningRecord[] | null)?.forEach((e) => {
        const amt = Number(e.amount);
        total += amt;
        released += calcReleasedForEarning(amt, e.created_at);
        if (byLevel[e.level] !== undefined) {
          byLevel[e.level] += amt;
        }
      });

      setTotalEarnings(total);
      setTotalReleased(released);
      setEarningsByLevel(byLevel);
    };

    const fetchWithdrawn = async () => {
      try {
        const { data } = await supabase
          .from('commission_withdrawals')
          .select('amount')
          .eq('wallet_address', publicKey.toString());
        const sum = data?.reduce((s, r) => s + Number(r.amount), 0) ?? 0;
        setTotalWithdrawn(sum);
      } catch {
        setTotalWithdrawn(0);
      }
    };

    fetchEarnings();
    fetchWithdrawn();
  }, [publicKey]);

  const handleWithdrawCommission = async () => {
    if (!publicKey) return;

    const requested = Number(withdrawAmount);
    if (!requested || requested <= 0) {
      toast.error('Enter a valid withdrawal amount.');
      return;
    }
    if (requested > availableToWithdraw + 0.0001) {
      toast.error(`Maximum available is ${formatTokenAmount(availableToWithdraw)} ${TOKEN_CONFIG.symbol}`);
      return;
    }

    const finalAmount = Math.min(requested, availableToWithdraw);

    setIsWithdrawing(true);
    try {
      const { error } = await supabase.from('commission_withdrawals').insert({
        wallet_address: publicKey.toString(),
        amount: finalAmount,
        transaction_signature: `comm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      });
      if (error) throw error;
      toast.success(`${finalAmount.toFixed(4)} ${TOKEN_CONFIG.symbol} commission withdrawn!`);
      setTotalWithdrawn((w) => w + finalAmount);
      setWithdrawAmount('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Commission withdraw failed');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const lockedAmount = Math.max(0, totalEarnings - totalReleased);
  const releasedPercent = totalEarnings > 0 ? (totalReleased / totalEarnings) * 100 : 0;

  if (!publicKey) {
    return (
      <div className="rounded-xl sm:rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 sm:p-8 text-center">
        <IconDollar className="mx-auto mb-3 sm:mb-4 h-12 w-12 sm:h-16 sm:w-16 text-slate-500" />
        <h3 className="mb-2 text-lg sm:text-xl font-bold text-slate-100">Referral Wallet</h3>
        <p className="text-sm sm:text-base text-slate-400">Connect wallet to view referral earnings</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-xl sm:rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-4 sm:p-6">
        <div className="mb-3 sm:mb-4 flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-amber-500/20">
            <IconWallet className="h-5 w-5 sm:h-7 sm:w-7 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100">Referral Wallet</h3>
            <p className="text-[10px] sm:text-xs text-slate-400">10% of remaining balance released daily</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 mb-3 sm:mb-4">
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">Total Earned</p>
            <p className="text-base sm:text-xl font-bold text-amber-400 truncate">{formatTokenAmount(totalEarnings)}</p>
            <p className="text-[10px] text-slate-500">{TOKEN_CONFIG.symbol}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">Released</p>
            <p className="text-base sm:text-xl font-bold text-emerald-400 truncate">{formatTokenAmount(totalReleased)}</p>
            <p className="text-[10px] text-slate-500">{TOKEN_CONFIG.symbol}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">Locked</p>
            <p className="text-base sm:text-xl font-bold text-slate-300 truncate">{formatTokenAmount(lockedAmount)}</p>
            <p className="text-[10px] text-slate-500">{TOKEN_CONFIG.symbol}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">Withdrawn</p>
            <p className="text-base sm:text-xl font-bold text-violet-400 truncate">{formatTokenAmount(totalWithdrawn)}</p>
            <p className="text-[10px] text-slate-500">{TOKEN_CONFIG.symbol}</p>
          </div>
        </div>

        {totalEarnings > 0 && (
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 mb-1">
              <span>Released: {releasedPercent.toFixed(1)}%</span>
              <span>{formatTokenAmount(totalReleased)} / {formatTokenAmount(totalEarnings)}</span>
            </div>
            <div className="h-1.5 sm:h-2 rounded-full bg-slate-700/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                style={{ width: `${Math.min(100, releasedPercent)}%` }}
              />
            </div>
          </div>
        )}

        {availableToWithdraw > 0 && (
          <div className="rounded-xl border border-slate-700/40 bg-slate-800/30 p-3 sm:p-4 space-y-2.5 sm:space-y-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs sm:text-sm font-semibold text-slate-300">Available to Withdraw</p>
              <p className="text-base sm:text-lg font-bold text-green-400">{formatTokenAmount(availableToWithdraw)} {TOKEN_CONFIG.symbol}</p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`0.00 ${TOKEN_CONFIG.symbol}`}
                step="any"
                className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-slate-100 font-semibold text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setWithdrawAmount(availableToWithdraw.toFixed(TOKEN_CONFIG.decimals))}
                className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm font-semibold text-amber-400 border border-amber-500/40 hover:bg-amber-500/10 active:bg-amber-500/20 transition-colors"
              >
                Max
              </button>
            </div>
            <button
              onClick={handleWithdrawCommission}
              disabled={isWithdrawing || !withdrawAmount || Number(withdrawAmount) <= 0}
              className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 sm:px-6 py-3 text-sm sm:text-base font-semibold text-white hover:bg-amber-500 active:bg-amber-500 disabled:opacity-50"
            >
              {isWithdrawing ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Withdrawing...
                </>
              ) : (
                <>
                  <IconArrowDownCircle className="h-5 w-5" />
                  Withdraw Commission
                </>
              )}
            </button>
          </div>
        )}

        {totalEarnings > 0 && availableToWithdraw <= 0 && (
          <p className="text-xs sm:text-sm text-slate-500 text-center py-2">
            No funds available yet. 10% of remaining balance is released daily.
          </p>
        )}
      </div>

      <div className="rounded-xl sm:rounded-2xl border border-slate-700/60 bg-slate-900/60 overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between p-4 sm:p-6 text-left hover:bg-slate-800/40"
        >
          <div className="flex items-center gap-2">
            <IconLayers className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
            <h3 className="text-sm sm:text-lg font-bold text-slate-100">3-Level Referral Structure</h3>
          </div>
          {expanded ? (
            <IconChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <IconChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </button>

        {expanded && (
          <div className="border-t border-slate-700/60">
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full min-w-[360px]">
                <thead>
                  <tr className="border-b border-slate-700/60 bg-slate-800/40">
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Level
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Commission
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Your Earnings
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {REFERRAL_LEVELS.map((l) => (
                    <tr
                      key={l.level}
                      className="border-b border-slate-700/40 last:border-0 hover:bg-slate-800/30"
                    >
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <span className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                          <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-slate-700/60 text-[10px] sm:text-xs font-bold text-slate-300">
                            {l.level === 1 ? '🥇' : l.level === 2 ? '🥈' : '🥉'}
                          </span>
                          <span className="hidden sm:inline">{l.label}</span>
                          <span className="sm:hidden">L{l.level}</span>
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold text-emerald-400">
                        {l.percent}%
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right font-mono text-xs sm:text-sm text-slate-200">
                        {formatTokenAmount(earningsByLevel[l.level] || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
