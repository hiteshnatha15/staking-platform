import { Router } from 'express';
import { RewardClaim } from '../models/RewardClaim.js';
import { Stake } from '../models/Stake.js';

function calculateMaxReward(stakeAmount: number, stakeDate: string | Date, dailyRate: number): number {
  const hoursStaked = Math.floor(
    (Date.now() - new Date(stakeDate).getTime()) / (1000 * 60 * 60)
  );
  const hourlyRate = dailyRate / 100 / 24;
  return stakeAmount * hourlyRate * hoursStaked;
}

export const rewardsRouter = Router();

rewardsRouter.get('/', async (req, res) => {
  try {
    const wallet = req.query.wallet_address;
    if (!wallet || typeof wallet !== 'string') return res.json([]);
    const docs = await RewardClaim.find({ wallet_address: wallet }).lean();
    res.json(docs.map((d) => ({ ...d, id: d._id })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch reward claims' });
  }
});

rewardsRouter.post('/', async (req, res) => {
  try {
    const { wallet_address, stake_id, amount, transaction_signature } = req.body;

    if (!wallet_address || typeof wallet_address !== 'string' || wallet_address.length < 32) {
      return res.status(400).json({ error: 'Invalid wallet_address' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    if (!stake_id || typeof stake_id !== 'string') {
      return res.status(400).json({ error: 'Invalid stake_id' });
    }

    const stake = await Stake.findById(stake_id).lean();
    if (!stake || stake.wallet_address !== wallet_address || stake.status !== 'active') {
      return res.status(400).json({ error: 'Stake not found or not active' });
    }

    const stakeDate = stake.start_time ?? stake.created_at;
    const maxReward = calculateMaxReward(stake.amount, stakeDate, 1);

    const existingClaims = await RewardClaim.find({ stake_id }).lean();
    const alreadyClaimed = existingClaims.reduce((s, c) => s + Number(c.amount), 0);
    const claimable = Math.max(0, maxReward - alreadyClaimed);

    if (amount > claimable + 0.001) {
      return res.status(400).json({ error: `Amount exceeds claimable: ${claimable.toFixed(4)}` });
    }

    const doc = await RewardClaim.create({
      wallet_address,
      stake_id,
      amount: Math.min(amount, claimable),
      transaction_signature: transaction_signature || null,
    });
    res.status(201).json({ ...doc.toObject(), id: doc._id });
  } catch {
    res.status(500).json({ error: 'Failed to create reward claim' });
  }
});
