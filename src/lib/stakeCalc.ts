import { TOKEN_CONFIG } from './tokenConfig';

const DAILY_RELEASE_RATE = 0.01;

export function calcTotalReleased(principal: number, stakeDate: string): number {
  const msElapsed = Date.now() - new Date(stakeDate).getTime();
  const daysElapsed = Math.floor(msElapsed / (1000 * 60 * 60 * 24));
  if (daysElapsed <= 0) return 0;
  return principal * (1 - Math.pow(1 - DAILY_RELEASE_RATE, daysElapsed));
}

export function getDaysElapsed(stakeDate: string): number {
  return Math.floor((Date.now() - new Date(stakeDate).getTime()) / (1000 * 60 * 60 * 24));
}

export function calculateRewards(stakeAmount: number, stakeStart: string): number {
  const hoursStaked = Math.floor(
    (Date.now() - new Date(stakeStart).getTime()) / (1000 * 60 * 60)
  );
  const hourlyRate = TOKEN_CONFIG.dailyRate / 100 / 24;
  return stakeAmount * hourlyRate * hoursStaked;
}
