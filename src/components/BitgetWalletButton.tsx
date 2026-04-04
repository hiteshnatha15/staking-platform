import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const BITGET_NAMES = ['bitget wallet', 'bitkeep', 'bitget'];
const BITGET_INSTALL_URL = 'https://web3.bitget.com/en/wallet-download';

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent));
}

export const BitgetWalletButton: FC = () => {
  const { wallets, select, connect, disconnect, connecting, connected, publicKey, wallet } = useWallet();
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isMobile = useMemo(() => isMobileDevice(), []);

  const bitgetWallet = useMemo(
    () => wallets.find((w) => BITGET_NAMES.includes(w.adapter.name.toLowerCase())),
    [wallets],
  );

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleConnect = useCallback(async () => {
    if (isMobile) {
      setShowMobileWarning(true);
      return;
    }
    if (!bitgetWallet) {
      window.open(BITGET_INSTALL_URL, '_blank', 'noopener');
      return;
    }
    try {
      select(bitgetWallet.adapter.name);
      await connect();
    } catch {
      // wallet popup closed or rejected
    }
  }, [isMobile, bitgetWallet, select, connect]);

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

  const mobileWarningModal = showMobileWarning && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-700/60 bg-slate-900 p-6 shadow-2xl shadow-black/40 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 ring-1 ring-amber-500/30">
          <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Desktop Only</h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          Wallet connection is only available on desktop browsers. Please open this site on a desktop device to connect your wallet.
        </p>
        <button
          onClick={() => setShowMobileWarning(false)}
          className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all"
        >
          Got it
        </button>
      </div>
    </div>
  );

  if (connected && publicKey) {
    return (
      <>
        {mobileWarningModal}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/70 px-3 py-2 text-sm font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-800 transition-colors"
          >
            {wallet?.adapter.icon && (
              <img src={wallet.adapter.icon} alt="" className="h-4 w-4 rounded-sm" />
            )}
            <span>{truncatedAddress}</span>
            <svg className={`h-3 w-3 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-700/60 bg-slate-900 shadow-xl shadow-black/30 overflow-hidden z-50">
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy address'}
              </button>
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-slate-800 transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      {mobileWarningModal}
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-60 disabled:cursor-wait transition-all"
      >
        {connecting ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
            <span>Connecting…</span>
          </>
        ) : (
          <span>{bitgetWallet ? 'Connect Wallet' : 'Install Bitget Wallet'}</span>
        )}
      </button>
    </>
  );
};
