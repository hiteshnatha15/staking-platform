import { Router } from 'express';
import { Withdrawal } from '../models/Withdrawal.js';
import { Stake } from '../models/Stake.js';

const DAILY_RELEASE_RATE = 0.01;

function calcTotalReleased(principal: number, stakeDate: string | Date): number {
  const msElapsed = Date.now() - new Date(stakeDate).getTime();
  const daysElapsed = Math.floor(msElapsed / (1000 * 60 * 60 * 24));
  if (daysElapsed <= 0) return 0;
  return principal * (1 - Math.pow(1 - DAILY_RELEASE_RATE, daysElapsed));
}

export const withdrawalsRouter = Router();

withdrawalsRouter.get('/', async (req, res) => {
  try {
    const wallet = req.query.wallet_address;
    if (!wallet || typeof wallet !== 'string') return res.json([]);
    const docs = await Withdrawal.find({ wallet_address: wallet }).sort({ created_at: -1 }).lean();
    res.json(docs.map((d) => ({ ...d, id: d._id })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

withdrawalsRouter.post('/', async (req, res) => {
  try {
    const { stake_id, wallet_address, amount, withdrawal_type, status, transaction_signature } = req.body;

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

    const principal = stake.deposited_amount ?? stake.amount;
    const stakeDate = stake.start_time ?? stake.created_at;
    const totalReleased = calcTotalReleased(principal, stakeDate);

    const existingWithdrawals = await Withdrawal.find({
      stake_id,
      status: { $in: ['completed', 'pending', 'approved'] },
    }).lean();
    const alreadyWithdrawn = existingWithdrawals.reduce((s, w) => s + Number(w.amount), 0);
    const available = Math.max(0, totalReleased - alreadyWithdrawn);

    if (amount > available + 0.001) {
      return res.status(400).json({ error: `Amount exceeds available: ${available.toFixed(4)}` });
    }

    const doc = await Withdrawal.create({
      stake_id,
      wallet_address,
      amount: Math.min(amount, available),
      withdrawal_type: withdrawal_type === 'manual' ? 'manual' : 'auto',
      status: status === 'pending' ? 'pending' : 'completed',
      transaction_signature: transaction_signature || null,
    });
    res.status(201).json({ ...doc.toObject(), id: doc._id });
  } catch {
    res.status(500).json({ error: 'Failed to create withdrawal' });
  }
});
