import { Router } from 'express';
import { CommissionEarning } from '../models/CommissionEarning.js';
import { CommissionWithdrawal } from '../models/CommissionWithdrawal.js';

const DAILY_RELEASE_RATE = 0.10;

function calcReleasedForEarning(amount: number, earnedDate: string | Date): number {
  const msElapsed = Date.now() - new Date(earnedDate).getTime();
  const daysElapsed = Math.floor(msElapsed / (1000 * 60 * 60 * 24));
  if (daysElapsed <= 0) return 0;
  return amount * (1 - Math.pow(1 - DAILY_RELEASE_RATE, daysElapsed));
}

export const commissionsRouter = Router();

commissionsRouter.get('/earnings', async (req, res) => {
  try {
    const wallet = req.query.wallet_address;
    if (!wallet || typeof wallet !== 'string') return res.json([]);
    const docs = await CommissionEarning.find({ wallet_address: wallet }).lean();
    res.json(docs.map((d) => ({ ...d, id: d._id })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch commission earnings' });
  }
});

commissionsRouter.get('/withdrawals', async (req, res) => {
  try {
    const wallet = req.query.wallet_address;
    if (!wallet || typeof wallet !== 'string') return res.json([]);
    const docs = await CommissionWithdrawal.find({ wallet_address: wallet }).lean();
    res.json(docs.map((d) => ({ ...d, id: d._id })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch commission withdrawals' });
  }
});

commissionsRouter.post('/withdrawals', async (req, res) => {
  try {
    const { wallet_address, amount, transaction_signature } = req.body;

    if (!wallet_address || typeof wallet_address !== 'string' || wallet_address.length < 32) {
      return res.status(400).json({ error: 'Invalid wallet_address' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const earnings = await CommissionEarning.find({ wallet_address }).lean();
    let totalReleased = 0;
    for (const e of earnings) {
      totalReleased += calcReleasedForEarning(Number(e.amount), e.created_at);
    }

    const withdrawals = await CommissionWithdrawal.find({ wallet_address }).lean();
    const totalWithdrawn = withdrawals.reduce((s, w) => s + Number(w.amount), 0);
    const available = Math.max(0, totalReleased - totalWithdrawn);

    if (amount > available + 0.001) {
      return res.status(400).json({ error: `Amount exceeds available: ${available.toFixed(4)}` });
    }

    const doc = await CommissionWithdrawal.create({
      wallet_address,
      amount: Math.min(amount, available),
      transaction_signature: transaction_signature || null,
      status: 'completed',
    });
    res.status(201).json({ ...doc.toObject(), id: doc._id });
  } catch {
    res.status(500).json({ error: 'Failed to create commission withdrawal' });
  }
});
