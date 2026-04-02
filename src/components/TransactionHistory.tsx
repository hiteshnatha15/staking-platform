import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  IconHistory,
  IconExternalLink,
  IconArrowUpRight,
  IconArrowDownRight,
  IconWallet,
  IconGift,
} from './icons/ProIcons';
import { supabase } from '../lib/supabase';
import { TOKEN_CONFIG, formatTokenAmount } from '../lib/tokenConfig';
import { getExplorerTxUrl } from '../lib/explorer';

interface TxItem {
  id: string;
  type: 'stake' | 'withdrawal' | 'commission' | 'reward';
  amount: number;
  status?: string;
  transaction_signature: string | null;
  created_at: string;
}

export const TransactionHistory = () => {
  const { publicKey } = useWallet();
  const [items, setItems] = useState<TxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicKey) return;

    const fetchHistory = async () => {
      setLoading(true);
      const wallet = publicKey.toString();

      const [stakesRes, withdrawalsRes, commissionsRes, rewardRes] = await Promise.all([
        supabase
          .from('stakes')
          .select('id, amount, status, transaction_signature, created_at')
          .eq('wallet_address', wallet)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('withdrawals')
          .select('id, amount, status, transaction_signature, created_at')
          .eq('wallet_address', wallet)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('commission_withdrawals')
          .select('id, amount, transaction_signature, created_at')
          .eq('wallet_address', wallet)
          .order('created_at', { ascending: false })
          .limit(50)
          .then((r) => r)
          .catch(() => ({ data: [], error: null })),
        supabase
          .from('reward_claims')
          .select('id, amount, transaction_signature, created_at')
          .eq('wallet_address', wallet)
          .order('created_at', { ascending: false })
          .limit(50)
          .then((r) => r)
          .catch(() => ({ data: [], error: null })),
      ]);

      const combined: TxItem[] = [];

      stakesRes.data?.forEach((s) => {
        combined.push({
          id: `stake-${s.id}`,
          type: 'stake',
          amount: Number(s.amount),
          status: s.status,
          transaction_signature: s.transaction_signature,
          created_at: s.created_at,
        });
      });

      withdrawalsRes.data?.forEach((w) => {
        combined.push({
          id: `withdraw-${w.id}`,
          type: 'withdrawal',
          amount: Number(w.amount),
          status: w.status,
          transaction_signature: w.transaction_signature,
          created_at: w.created_at,
        });
      });

      commissionsRes.data?.forEach((c) => {
        combined.push({
          id: `commission-${c.id}`,
          type: 'commission',
          amount: Number(c.amount),
          transaction_signature: c.transaction_signature,
          created_at: c.created_at,
        });
      });

      rewardRes.data?.forEach((r) => {
        combined.push({
          id: `reward-${r.id}`,
          type: 'reward',
          amount: Number(r.amount),
          transaction_signature: r.transaction_signature,
          created_at: r.created_at,
        });
      });

      combined.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setItems(combined.slice(0, 30));
      setLoading(false);
    };

    fetchHistory();
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-12 text-center">
        <IconHistory className="mx-auto mb-4 h-16 w-16 text-slate-500" />
        <h3 className="mb-2 text-xl font-bold text-slate-100">Transaction History</h3>
        <p className="text-slate-400">Connect wallet to view your transactions</p>
      </div>
    );
  }

  const getTypeLabel = (type: TxItem['type']) => {
    switch (type) {
      case 'stake':
        return 'Stake';
      case 'withdrawal':
        return 'Withdrawal';
      case 'commission':
        return 'Commission';
      case 'reward':
        return 'Reward Claim';
      default:
        return type;
    }
  };

  const getTypeIcon = (type: TxItem['type']) => {
    switch (type) {
      case 'stake':
        return <IconArrowUpRight className="h-5 w-5 text-emerald-400" />;
      case 'withdrawal':
        return <IconArrowDownRight className="h-5 w-5 text-violet-400" />;
      case 'commission':
        return <IconGift className="h-5 w-5 text-amber-400" />;
      case 'reward':
        return <IconGift className="h-5 w-5 text-cyan-400" />;
      default:
        return <IconHistory className="h-5 w-5 text-slate-400" />;
    }
  };

  const getAmountSign = (type: TxItem['type']) => (type === 'stake' ? '+' : '-');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-700/60">
          <IconHistory className="h-6 w-6 text-slate-300" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-100">Transaction History</h3>
          <p className="text-sm text-slate-400">All your stakes, withdrawals & earnings</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-12 text-center">
          <IconWallet className="mx-auto mb-3 h-12 w-12 text-slate-600" />
          <p className="text-slate-400">No transactions yet</p>
          <p className="mt-1 text-sm text-slate-500">Stake tokens to see your history</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const explorerUrl = getExplorerTxUrl(item.transaction_signature);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-4 transition-colors hover:border-slate-600/80"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700/60">
                    {getTypeIcon(item.type)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-100">{getTypeLabel(item.type)}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(item.created_at).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p
                    className={`font-mono font-semibold ${
                      item.type === 'stake' ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {getAmountSign(item.type)}
                    {item.amount.toFixed(4)} {TOKEN_CONFIG.symbol}
                  </p>
                  {explorerUrl ? (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-700/60 text-slate-400 transition-colors hover:bg-emerald-500/20 hover:text-emerald-400"
                      aria-label="View on Explorer"
                    >
                      <IconExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">
                      {item.status || 'Processing'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
