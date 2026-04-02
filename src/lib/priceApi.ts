/**
 * Fetch live token price - DexScreener (free) + Birdeye (optional, needs API key)
 */

const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex/tokens';
const BIRDEYE_API = 'https://public-api.birdeye.so';

export interface TokenPriceResult {
  priceUsd: number;
  priceChange24h: number | null;
  liquidity: number;
}

/** Try DexScreener first (free, no key). If no pairs, try Birdeye (needs VITE_BIRDEYE_API_KEY) */
export async function fetchTokenPrice(
  mintAddress: string
): Promise<TokenPriceResult | null> {
  if (!mintAddress) return null;

  const fromDex = await fetchFromDexScreener(mintAddress);
  if (fromDex) return fromDex;

  const fromBirdeye = await fetchFromBirdeye(mintAddress);
  return fromBirdeye;
}

async function fetchFromDexScreener(
  mintAddress: string
): Promise<TokenPriceResult | null> {
  try {
    const res = await fetch(`${DEXSCREENER_API}/${mintAddress}`);
    if (!res.ok) return null;

    const data = await res.json();
    const pairs = data?.pairs as Array<{
      priceUsd?: string;
      liquidity?: { usd?: number };
      priceChange?: { h24?: number };
    }> | undefined;

    if (!pairs || !Array.isArray(pairs) || pairs.length === 0) return null;

    const sorted = [...pairs]
      .filter((p) => p.priceUsd && parseFloat(p.priceUsd) > 0)
      .sort((a, b) => {
        const liqA = a.liquidity?.usd ?? 0;
        const liqB = b.liquidity?.usd ?? 0;
        return liqB - liqA;
      });

    const best = sorted[0];
    if (!best?.priceUsd) return null;

    const priceUsd = parseFloat(best.priceUsd);
    if (Number.isNaN(priceUsd) || priceUsd <= 0) return null;

    return {
      priceUsd,
      priceChange24h: best.priceChange?.h24 ?? null,
      liquidity: best.liquidity?.usd ?? 0,
    };
  } catch {
    return null;
  }
}

async function fetchFromBirdeye(
  mintAddress: string
): Promise<TokenPriceResult | null> {
  const apiKey = import.meta.env.VITE_BIRDEYE_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `${BIRDEYE_API}/defi/price?address=${mintAddress}`,
      {
        headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana' },
      }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const value = data?.data?.value;
    if (typeof value !== 'number' || value <= 0) return null;

    return {
      priceUsd: value,
      priceChange24h: null,
      liquidity: 0,
    };
  } catch {
    return null;
  }
}
