import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWallet } from '@solana/wallet-adapter-react';

const BITGET_NAMES = ['bitget wallet', 'bitkeep', 'bitget'];
const BITGET_INSTALL_URL = 'https://web3.bitget.com/en/wallet-download';

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent));
}

function getDappDeepLink(): string {
  const dappUrl = encodeURIComponent(window.location.href);
  return `https://bkcode.vip?action=dapp&url=${dappUrl}`;
}

export const BitgetWalletButton: FC = () => {
  const { wallets, select, connect, disconnect, connecting, connected, publicKey, wallet } = useWallet();
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showInstallSheet, setShowInstallSheet] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const deepLinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = useMemo(() => isMobileDevice(), []);

  const bitgetWallet = useMemo(
    () => wallets.find((w) => BITGET_NAMES.includes(w.adapter.name.toLowerCase())),
    [wallets],
  );

  const walletAvailable = !!bitgetWallet && bitgetWallet.readyState === 'Installed';

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && deepLinkTimerRef.current) {
        clearTimeout(deepLinkTimerRef.current);
        deepLinkTimerRef.current = null;
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (deepLinkTimerRef.current) clearTimeout(deepLinkTimerRef.current);
    };
  }, []);

  const handleConnect = useCallback(async () => {
    if (walletAvailable && bitgetWallet) {
      try {
        select(bitgetWallet.adapter.name);
        await connect();
      } catch {
        // wallet popup closed or rejected
      }
      return;
    }

    if (isMobile) {
      window.location.href = getDappDeepLink();

      deepLinkTimerRef.current = setTimeout(() => {
        deepLinkTimerRef.current = null;
        if (!document.hidden) {
          setShowInstallSheet(true);
        }
      }, 2500);
      return;
    }

    if (!bitgetWallet) {
      window.open(BITGET_INSTALL_URL, '_blank', 'noopener');
    }
  }, [isMobile, walletAvailable, bitgetWallet, select, connect]);

  const handleCopy = useCallback(() => {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey.toBase58());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [publicKey]);

  const handleDisconnect = useCallback(async () => {
    setMenuOpen(false);
    await disconnect();
  }, [disconnect]);

  const truncatedAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}..${publicKey.toBase58().slice(-4)}`
    : '';

  const installSheetContent = showInstallSheet ? (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) setShowInstallSheet(false); }}
    >
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/40 animate-slideUp">
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-slate-600" />
        </div>

        <div className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 ring-1 ring-amber-500/30">
            <svg className="h-7 w-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>

          <h3 className="text-lg font-bold text-white mb-1">Wallet Not Found</h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            It looks like Bitget Wallet isn't installed yet. Install the app and try again.
          </p>

          <div className="space-y-3">
            <a
              href={BITGET_INSTALL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Install Bitget Wallet
            </a>

            <button
              onClick={() => {
                setShowInstallSheet(false);
                window.location.href = getDappDeepLink();
              }}
              className="flex items-center justify-center gap-2.5 w-full rounded-xl border border-slate-700/60 bg-slate-800/70 px-4 py-3.5 text-sm font-semibold text-slate-200 active:scale-[0.98] hover:border-slate-600 transition-all"
            >
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              Try Again
            </button>

            <button
              onClick={() => setShowInstallSheet(false)}
              className="w-full rounded-xl px-4 py-3 text-sm font-medium text-slate-500 active:text-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="h-safe-bottom" />
      </div>
    </div>
  ) : null;

  const installSheet = installSheetContent ? createPortal(installSheetContent, document.body) : null;

  if (connected && publicKey) {
    const menuDropdown = menuOpen ? (
      isMobile ? createPortal(
        <div className="fixed inset-0 z-[100]" onClick={() => setMenuOpen(false)}>
          <div className="fixed inset-0 bg-black/40" />
          <div
            className="fixed bottom-0 inset-x-0 rounded-t-2xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/40 animate-slideUp z-[101]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3">
              <div className="h-1 w-10 rounded-full bg-slate-600" />
            </div>
            <div className="px-5 py-4 border-b border-slate-800/60">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Connected Wallet</p>
              <p className="text-sm text-slate-300 font-mono break-all">{publicKey.toBase58()}</p>
            </div>
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-3 px-5 py-4 text-base text-slate-300 active:bg-slate-800 transition-colors"
            >
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
              {copied ? 'Copied!' : 'Copy Address'}
            </button>
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-3 px-5 py-4 text-base text-red-400 active:bg-slate-800 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Disconnect
            </button>
            <button
              onClick={() => setMenuOpen(false)}
              className="w-full px-5 py-3.5 text-sm font-medium text-slate-500 active:text-slate-300 transition-colors border-t border-slate-800/60"
            >
              Cancel
            </button>
            <div className="h-safe-bottom" />
          </div>
        </div>,
        document.body
      ) : (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-700/60 bg-slate-900 shadow-xl shadow-black/30 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-800/60">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Connected</p>
            <p className="text-xs text-slate-300 font-mono truncate">{publicKey.toBase58()}</p>
          </div>
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 active:bg-slate-700 transition-colors"
          >
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
            </svg>
            {copied ? 'Copied!' : 'Copy Address'}
          </button>
          <button
            onClick={handleDisconnect}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-slate-800 active:bg-slate-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Disconnect
          </button>
        </div>
      )
    ) : null;

    return (
      <>
        {installSheet}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300 hover:border-emerald-500/50 hover:bg-emerald-500/15 active:scale-[0.97] transition-all"
          >
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            {wallet?.adapter.icon && (
              <img src={wallet.adapter.icon} alt="" className="h-4 w-4 rounded-sm" />
            )}
            <span className="hidden sm:inline">{truncatedAddress}</span>
            <span className="sm:hidden">{publicKey.toBase58().slice(0, 4)}..</span>
            <svg className={`h-3 w-3 text-emerald-400/60 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {menuDropdown}
        </div>
      </>
    );
  }

  return (
    <>
      {installSheet}
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3 sm:px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.97] disabled:opacity-60 disabled:cursor-wait transition-all"
      >
        {connecting ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
            <span className="hidden sm:inline">Connecting…</span>
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 6v3" />
            </svg>
            <span className="hidden sm:inline">{walletAvailable ? 'Connect Wallet' : 'Install Bitget Wallet'}</span>
            <span className="sm:hidden">Connect</span>
          </>
        )}
      </button>
    </>
  );
};
