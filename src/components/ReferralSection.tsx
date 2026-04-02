import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { IconLink, IconCopy, IconCheck, IconShare, IconWallet } from './icons/ProIcons';
import { TOKEN_CONFIG } from '../lib/tokenConfig';
import { useToast } from '../contexts/ToastContext';

export const ReferralSection = () => {
  const { publicKey } = useWallet();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const referralCode = publicKey ? publicKey.toString() : '';

  const referralUrl = referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${referralCode}`
    : '';

  const handleCopy = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success('Referral link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share && referralUrl) {
      navigator.share({
        title: `${TOKEN_CONFIG.symbol} Staking – Join My Team`,
        text: `Stake ${TOKEN_CONFIG.symbol} & earn. Use my referral: ${referralUrl}`,
        url: referralUrl,
      }).then(() => toast.success('Link shared successfully!')).catch(() => handleCopy());
    } else {
      handleCopy();
    }
  };

  if (!publicKey) {
    return (
      <div className="rounded-xl sm:rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 sm:p-8 text-center">
        <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-emerald-500/20">
          <IconWallet className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-400" />
        </div>
        <h3 className="mb-2 text-lg sm:text-xl font-bold text-slate-100">Your Referral Link</h3>
        <p className="text-sm sm:text-base text-slate-400">Connect wallet to get your unique referral link</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl sm:rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/90 to-slate-900/50 p-4 sm:p-6 shadow-xl">
      <div className="mb-4 sm:mb-6 flex items-center gap-2.5 sm:gap-3">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
          <IconLink className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-100">Invite & Earn</h3>
          <p className="text-xs sm:text-sm text-slate-400">Share your link, earn commission</p>
        </div>
      </div>

      <div className="mb-3 sm:mb-4">
        <label className="mb-1.5 sm:mb-2 block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
          Your Referral Code
        </label>
        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-600/60 bg-slate-800/60 px-3 py-2.5 sm:px-4 sm:py-3">
          <span className="min-w-0 flex-1 truncate font-mono text-[11px] sm:text-base font-bold text-emerald-400" title={referralCode}>
            {referralCode}
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(referralCode);
              setCopied(true);
              toast.success('Referral code copied!');
              setTimeout(() => setCopied(false), 2000);
            }}
            className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-700/60 hover:text-white active:bg-slate-700/60"
          >
            {copied ? <IconCheck className="h-4 w-4 sm:h-5 sm:w-5" /> : <IconCopy className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>
        </div>
      </div>

      <div className="mb-4 sm:mb-6">
        <label className="mb-1.5 sm:mb-2 block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
          Referral Link
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
          <input
            type="text"
            readOnly
            value={referralUrl}
            className="min-w-0 flex-1 rounded-xl border border-slate-600/60 bg-slate-800/60 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-300"
          />
          <button
            onClick={handleCopy}
            className="flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 sm:py-3 text-sm font-semibold text-white hover:bg-emerald-500 active:bg-emerald-500 active:scale-[0.98]"
          >
            {copied ? <IconCheck className="h-4 w-4 sm:h-5 sm:w-5" /> : <IconCopy className="h-4 w-4 sm:h-5 sm:w-5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <button
        onClick={handleShare}
        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-2.5 sm:py-3 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20 active:bg-emerald-500/20 active:scale-[0.98]"
      >
        <IconShare className="h-4 w-4 sm:h-5 sm:w-5" />
        Share Link
      </button>
    </div>
  );
};
