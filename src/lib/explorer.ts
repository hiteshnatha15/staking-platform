/**
 * Solana Explorer URL helper
 */
const rpc = (import.meta.env.VITE_SOLANA_RPC || '').toLowerCase();
const isDevnet = rpc.includes('devnet') || rpc.includes('testnet');

export function getExplorerTxUrl(signature: string | null | undefined): string | null {
  if (!signature || signature.startsWith('demo_') || signature.startsWith('reward_')) return null;
  const base = `https://explorer.solana.com/tx/${signature}`;
  return isDevnet ? `${base}?cluster=devnet` : base;
}
