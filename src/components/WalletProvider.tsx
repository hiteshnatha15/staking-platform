import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

import '@solana/wallet-adapter-react-ui/styles.css';

/**
 * Phantom & Solflare support mobile:
 * - Phantom: Open in mobile browser → Connect opens Phantom app via deep link
 * - Solflare: Same for Solflare mobile app
 * - Works on iOS Safari, Android Chrome when wallet app is installed
 */
// Free RPCs that work without API key - use these to avoid 403 errors
const FREE_RPC = 'https://rpc.ankr.com/solana';

export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const endpoint = useMemo(() => {
    const rpc = import.meta.env.VITE_SOLANA_RPC;
    // Skip RPCs that require API key (Helius, QuickNode etc) - they cause 403
    if (rpc && !rpc.toLowerCase().includes('api-key') && !rpc.toLowerCase().includes('api_key')) {
      return rpc;
    }
    return rpc || FREE_RPC || clusterApiUrl(WalletAdapterNetwork.Devnet);
  }, []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      // Add more adapters here; Phantom/Solflare mobile apps work via deep link
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
