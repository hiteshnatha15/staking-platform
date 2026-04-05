import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { BitKeepWalletAdapter } from '@solana/wallet-adapter-bitkeep';
import { clusterApiUrl } from '@solana/web3.js';

const FREE_RPC = 'https://solana-rpc.publicnode.com';

export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {

  const endpoint = useMemo(() => {
    const rpc = import.meta.env.VITE_SOLANA_RPC;
    if (rpc && !rpc.toLowerCase().includes('api-key') && !rpc.toLowerCase().includes('api_key')) {
      return rpc;
    }
    return rpc || FREE_RPC || clusterApiUrl(WalletAdapterNetwork.Devnet);
  }, []);

  const wallets = useMemo(() => [new BitKeepWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
};
