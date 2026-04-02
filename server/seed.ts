import { Stake } from './models/Stake.js';

const RECOVERY_STAKES = [
  {
    wallet_address: 'DL4HqKGLeSzj3BsfkGkDtZctZr73MH6RTbx1LsqvjemU',
    amount: 1300,
    deposited_amount: 1000,
    transaction_signature: '58TUFNL5rUN3u2MgQXpeUESfHBLXrELymy2SCxa5gDVrw5AYy2WUoqTVXmNpQPHzftASnHXq1FqihvtSqiz48KFp',
    status: 'active' as const,
  },
  {
    wallet_address: 'DL4HqKGLeSzj3BsfkGkDtZctZr73MH6RTbx1LsqvjemU',
    amount: 13,
    deposited_amount: 10,
    transaction_signature: '2NuyfKyp4EVzP5MtBHYsHEDxTTH1TTFfEzWYYWkr3SCsRKF25JHruzKtRWW678rjqbJJkQC8WTHAn1Zxrdyt8m1H',
    status: 'active' as const,
  },
];

export async function seedData() {
  for (const stake of RECOVERY_STAKES) {
    const exists = await Stake.findOne({ transaction_signature: stake.transaction_signature });
    if (!exists) {
      await Stake.create(stake);
      console.log(`Seeded recovery stake: ${stake.amount} for ${stake.wallet_address.slice(0, 8)}...`);
    }
  }
}
