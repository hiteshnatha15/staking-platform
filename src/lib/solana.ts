import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { TOKEN_CONFIG } from './tokenConfig';

const LAMPORTS_PER_SOL = 1e9;

// RPC list - prefer user-configured RPC, then free public fallbacks.
const RPC_ENDPOINTS = (() => {
  const network = (import.meta.env.VITE_SOLANA_NETWORK || 'mainnet').toLowerCase();
  const customRpc = import.meta.env.VITE_SOLANA_RPC || '';
  const devnetRpc = 'https://api.devnet.solana.com';
  const mainnetRpcs = [
    'https://solana-rpc.publicnode.com',
    'https://api.mainnet-beta.solana.com',
    'https://solana.publicnode.com',
    'https://mainnet.rpcpool.com',
  ];
  if (network === 'devnet') return [devnetRpc];
  const rpcs = customRpc ? [customRpc, ...mainnetRpcs.filter(r => r !== customRpc)] : mainnetRpcs;
  return rpcs;
})();

const getConnection = (rpcIndex = 0) => {
  const endpoint = RPC_ENDPOINTS[rpcIndex] || RPC_ENDPOINTS[0];
  return new Connection(endpoint, { commitment: 'confirmed' });
};

/** Get native SOL balance - tries all RPCs until one works */
export async function getSolBalance(
  _connection: Connection,
  walletAddress: PublicKey
): Promise<number> {
  for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
    try {
      const conn = getConnection(i);
      const lamports = await conn.getBalance(walletAddress, 'confirmed');
      return lamports / LAMPORTS_PER_SOL;
    } catch {
      continue;
    }
  }
  return 0;
}

/** Get user's token balance - tries all RPCs until one works */
export async function getTokenBalance(
  _connection: Connection,
  walletAddress: PublicKey
): Promise<number> {
  if (!TOKEN_CONFIG.mintAddress) return 0;

  const mint = new PublicKey(TOKEN_CONFIG.mintAddress);
  const ata = getAssociatedTokenAddressSync(
    mint,
    walletAddress,
    false,
    TOKEN_PROGRAM_ID
  );

  for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
    try {
      const conn = getConnection(i);
      const account = await getAccount(conn, ata);
      return Number(account.amount) / Math.pow(10, TOKEN_CONFIG.decimals);
    } catch {
      continue;
    }
  }
  return 0;
}

export interface BroadcastResult {
  signature: string;
  blockhash: string;
  lastValidBlockHeight: number;
}

/** Build the token transfer transaction (does NOT sign or send). */
export async function buildVaultTransaction(
  fromWallet: PublicKey,
  amountRaw: bigint,
): Promise<{ transaction: Transaction; blockhash: string; lastValidBlockHeight: number }> {
  const mint = new PublicKey(TOKEN_CONFIG.mintAddress);
  const vaultPubkey = new PublicKey(TOKEN_CONFIG.stakingVault);

  const fromAta = await getAssociatedTokenAddress(mint, fromWallet, false, TOKEN_PROGRAM_ID);
  const vaultAta = await getAssociatedTokenAddress(mint, vaultPubkey, false, TOKEN_PROGRAM_ID);

  let conn: Connection | null = null;
  for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
    try {
      const c = getConnection(i);
      await c.getLatestBlockhash();
      conn = c;
      break;
    } catch {
      continue;
    }
  }
  if (!conn) throw new Error('All RPCs failed. Try again later or use a different network.');

  const transaction = new Transaction();
  try {
    await getAccount(conn, vaultAta);
  } catch {
    transaction.add(
      createAssociatedTokenAccountInstruction(fromWallet, vaultAta, vaultPubkey, mint)
    );
  }
  transaction.add(
    createTransferInstruction(fromAta, vaultAta, fromWallet, amountRaw, [], TOKEN_PROGRAM_ID)
  );

  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromWallet;

  return { transaction, blockhash, lastValidBlockHeight };
}

/** Sign, build, and broadcast the token transfer. Returns immediately after broadcast. */
export async function broadcastToVault(
  _connection: Connection,
  fromWallet: PublicKey,
  amountRaw: bigint,
  signTransaction: (tx: Transaction) => Promise<Transaction>
): Promise<BroadcastResult> {
  const { transaction, blockhash, lastValidBlockHeight } = await buildVaultTransaction(fromWallet, amountRaw);

  const signed = await signTransaction(transaction);
  const serialized = signed.serialize();

  let signature: string | null = null;
  for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
    try {
      const c = getConnection(i);
      signature = await c.sendRawTransaction(serialized, {
        skipPreflight: true,
        maxRetries: 3,
      });
      break;
    } catch {
      continue;
    }
  }
  if (!signature) {
    throw new Error('Transaction signed but failed to broadcast. Try again later.');
  }

  return { signature, blockhash, lastValidBlockHeight };
}

/** Wait for on-chain confirmation. Tries multiple RPCs for resilience. */
export async function confirmVaultTransfer(
  result: BroadcastResult
): Promise<boolean> {
  const { signature, blockhash, lastValidBlockHeight } = result;
  return waitForConfirmation(signature, blockhash, lastValidBlockHeight);
}

/**
 * Wait for tx to be confirmed or to fail/expire. Tries multiple RPCs for
 * resilience. Uses confirmTransaction first (built-in retry logic), then
 * falls back to manual polling if the primary RPC fails.
 */
async function waitForConfirmation(
  signature: string,
  _blockhash: string,
  lastValidBlockHeight: number
): Promise<boolean> {
  // Manual polling with short timeout — runs in the background so be quick
  const timeout = 30_000;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    for (let i = 0; i < Math.min(RPC_ENDPOINTS.length, 3); i++) {
      try {
        const conn = getConnection(i);
        const resp = await conn.getSignatureStatuses([signature]);
        const status = resp?.value?.[0];
        if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') {
          return true;
        }
        if (status?.err) {
          return false;
        }
      } catch {
        continue;
      }
    }
    try {
      const conn = getConnection(0);
      const height = await conn.getBlockHeight();
      if (height > lastValidBlockHeight) return false;
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  return false;
}

/** Convert human amount to raw (with decimals) */
export function toRawAmount(amount: number): bigint {
  return BigInt(
    Math.floor(amount * Math.pow(10, TOKEN_CONFIG.decimals))
  );
}

export { getConnection };
