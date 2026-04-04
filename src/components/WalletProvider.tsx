import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { BitKeepWalletAdapter } from '@solana/wallet-adapter-bitkeep';
import { clusterApiUrl } from '@solana/web3.js';

const FREE_RPC = 'https://solana-rpc.publicnode.com';

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent));
}

export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const isMobile = useMemo(() => isMobileDevice(), []);

  const endpoint = useMemo(() => {
    const rpc = import.meta.env.VITE_SOLANA_RPC;
    if (rpc && !rpc.toLowerCase().includes('api-key') && !rpc.toLowerCase().includes('api_key')) {
      return rpc;
    }
    return rpc || FREE_RPC || clusterApiUrl(WalletAdapterNetwork.Devnet);
  }, []);

  const wallets = useMemo(
    () => isMobile ? [] : [new BitKeepWalletAdapter()],
    [isMobile]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={!isMobile}>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
};
