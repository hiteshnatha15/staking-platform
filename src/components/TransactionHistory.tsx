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
import { getTransactionHistory, TxItem } from '../lib/api';
import { TOKEN_CONFIG, formatTokenAmount } from '../lib/tokenConfig';
import { getExplorerTxUrl } from '../lib/explorer';

export const TransactionHistory = () => {
  const { publicKey } = useWallet();
  const [items, setItems] = useState<TxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicKey) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const combined = await getTransactionHistory(publicKey.toString());
        setItems(combined);
      } catch (err) {
        console.error('Failed to fetch history:', err);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div className="rounded-xl sm:rounded-2xl border border-slate-700/60 bg-slate-900/60 p-8 sm:p-12 text-center">
        <IconHistory className="mx-auto mb-3 sm:mb-4 h-12 w-12 sm:h-16 sm:w-16 text-slate-500" />
        <h3 className="mb-2 text-lg sm:text-xl font-bold text-slate-100">Transaction History</h3>
        <p className="text-sm sm:text-base text-slate-400">Connect wallet to view your transactions</p>
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
    <div className="w-full space-y-4 sm:space-y-6 overflow-hidden">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-slate-700/60">
          <IconHistory className="h-5 w-5 sm:h-6 sm:w-6 text-slate-300" />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-100">Transaction History</h3>
          <p className="text-xs sm:text-sm text-slate-400">All your stakes, withdrawals & earnings</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 sm:py-16">
          <div className="h-8 w-8 sm:h-10 sm:w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl sm:rounded-2xl border border-slate-700/60 bg-slate-900/60 p-8 sm:p-12 text-center">
          <IconWallet className="mx-auto mb-3 h-10 w-10 sm:h-12 sm:w-12 text-slate-600" />
          <p className="text-sm sm:text-base text-slate-400">No transactions yet</p>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">Stake tokens to see your history</p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {items.map((item) => {
            const explorerUrl = getExplorerTxUrl(item.transaction_signature);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-700/60 bg-slate-800/40 px-3 py-3 sm:px-4 sm:py-4 transition-colors hover:border-slate-600/80"
              >
                <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-slate-700/60">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-slate-100">{getTypeLabel(item.type)}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                      {new Date(item.created_at).toLocaleString(undefined, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <div className="text-right">
                    <p
                      className={`font-mono text-xs sm:text-base font-semibold ${
                        item.type === 'stake' ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      {getAmountSign(item.type)}
                      {item.amount.toFixed(4)}
                    </p>
                    <p className="text-[10px] text-slate-500 sm:hidden">{TOKEN_CONFIG.symbol}</p>
                    <span className="hidden sm:inline text-[10px] text-slate-500"> {TOKEN_CONFIG.symbol}</span>
                  </div>
                  {explorerUrl ? (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-slate-700/60 text-slate-400 transition-colors hover:bg-emerald-500/20 hover:text-emerald-400"
                      aria-label="View on Explorer"
                    >
                      <IconExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </a>
                  ) : (
                    <span className="text-[10px] sm:text-xs text-slate-500 w-8 sm:w-9 text-center">
                      {item.status || '...'}
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
