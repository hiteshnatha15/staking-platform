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

// RPC list - free public endpoints. Try in order until one works.
const RPC_ENDPOINTS = (() => {
  const network = (import.meta.env.VITE_SOLANA_NETWORK || 'mainnet').toLowerCase();
  const devnetRpc = 'https://api.devnet.solana.com';
  const mainnetRpcs = [
    'https://rpc.ankr.com/solana',
    'https://solana-rpc.publicnode.com',
    'https://solana.publicnode.com',
    'https://mainnet.rpcpool.com',
    'https://solana-mainnet.gateway.tatum.io',
    'https://api.mainnet-beta.solana.com',
  ];
  return network === 'devnet' ? [devnetRpc] : mainnetRpcs;
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

/** Transfer SPL tokens from user to staking vault. Sign ONCE, then try each RPC to send. */
export async function transferToVault(
  _connection: Connection,
  fromWallet: PublicKey,
  amountRaw: bigint,
  signTransaction: (tx: Transaction) => Promise<Transaction>
): Promise<string> {
  const mint = new PublicKey(TOKEN_CONFIG.mintAddress);
  const vaultPubkey = new PublicKey(TOKEN_CONFIG.stakingVault);

  const fromAta = await getAssociatedTokenAddress(
    mint,
    fromWallet,
    false,
    TOKEN_PROGRAM_ID
  );
  const vaultAta = await getAssociatedTokenAddress(
    mint,
    vaultPubkey,
    false,
    TOKEN_PROGRAM_ID
  );

  // Step 1: Find first working RPC for blockhash + vault check
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

  // Step 2: Build transaction (check vault ATA once)
  const transaction = new Transaction();
  try {
    await getAccount(conn, vaultAta);
  } catch {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        fromWallet,
        vaultAta,
        vaultPubkey,
        mint
      )
    );
  }
  transaction.add(
    createTransferInstruction(
      fromAta,
      vaultAta,
      fromWallet,
      amountRaw,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  // Step 3: Get blockhash and set on tx (need lastValidBlockHeight for confirmation)
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromWallet;

  // Step 4: Sign ONCE - user sees popup only 1 time
  const signed = await signTransaction(transaction);
  const serialized = signed.serialize();

  // Step 5: Try each RPC to send - no more signing
  let signature: string | null = null;
  let successConn: Connection | null = null;
  for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
    try {
      const c = getConnection(i);
      signature = await c.sendRawTransaction(serialized, {
        skipPreflight: true,
        maxRetries: 3,
      });
      successConn = c;
      break;
    } catch {
      continue;
    }
  }
  if (!signature || !successConn) {
    throw new Error('Transaction signed but failed to broadcast. Try again later.');
  }

  // Step 6: CRITICAL - Wait for on-chain confirmation BEFORE returning.
  // If we return before confirmation, StakingInterface would insert into Supabase
  // even when tx fails on-chain = system loss (user gets balance without actual stake).
  const confirmed = await waitForConfirmation(
    successConn,
    signature,
    lastValidBlockHeight
  );
  if (!confirmed) {
    throw new Error('Transaction was not confirmed on-chain. Please try again.');
  }
  return signature;
}

/** Wait for tx to be confirmed or to fail/expire. Returns true only if confirmed. */
async function waitForConfirmation(
  conn: Connection,
  signature: string,
  lastValidBlockHeight: number
): Promise<boolean> {
  const timeout = 90_000; // 90 seconds max
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      const status = await conn.getSignatureStatus(signature);
      if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') {
        return true;
      }
      if (status?.err) {
        return false; // Tx failed on-chain
      }
      const height = await conn.getBlockHeight();
      if (height > lastValidBlockHeight) {
        return false; // Blockhash expired, tx will never confirm
      }
    } catch {
      // RPC issue, keep polling
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  return false; // Timeout
}

/** Convert human amount to raw (with decimals) */
export function toRawAmount(amount: number): bigint {
  return BigInt(
    Math.floor(amount * Math.pow(10, TOKEN_CONFIG.decimals))
  );
}

export { getConnection };
