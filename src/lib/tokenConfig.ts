/**
 * Networking Token Staking - Token Configuration
 * Set your SPL token details in .env
 */

export const TOKEN_CONFIG = {
  /** SPL Token Mint Address - your networking project token */
  mintAddress: import.meta.env.VITE_TOKEN_MINT || '',
  /** Staking vault wallet - receives staked tokens */
  stakingVault: import.meta.env.VITE_STAKING_VAULT || '',
  /** Display symbol e.g. NET, NETW, etc. */
  symbol: import.meta.env.VITE_TOKEN_SYMBOL || 'NET',
  /** Token decimals (usually 6 or 9) */
  decimals: parseInt(import.meta.env.VITE_TOKEN_DECIMALS || '9', 10),
  /** Daily staking reward rate (%) */
  dailyRate: 1,
  /** Instant bonus when user stakes: deposited + (deposited * bonus/100) */
  stakingBonusPercent: 30,
} as const;

export const isTokenConfigured = () =>
  !!TOKEN_CONFIG.mintAddress && !!TOKEN_CONFIG.stakingVault;

/** Format token amount with full precision (up to token decimals), trim trailing zeros */
export function formatTokenAmount(amount: number): string {
  const s = amount.toFixed(TOKEN_CONFIG.decimals);
  return s.replace(/\.?0+$/, '') || '0';
}
