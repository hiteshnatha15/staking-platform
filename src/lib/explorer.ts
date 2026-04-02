/**
 * Solana Explorer URL helper
 */
const rpc = import.meta.env.VITE_SOLANA_RPC || '';
const cluster = rpc.includes('mainnet') ? 'mainnet-beta' : 'devnet';

export function getExplorerTxUrl(signature: string | null | undefined): string | null {
  if (!signature || signature.startsWith('demo_') || signature.startsWith('auto_')) return null;
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}
