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

withdrawalsRouter.get('/available', async (req, res) => {
  try {
    const wallet = req.query.wallet_address;
    if (!wallet || typeof wallet !== 'string') return res.json({ total: 0, stakes: [] });

    const activeStakes = await Stake.find({ wallet_address: wallet, status: 'active' })
      .sort({ created_at: 1 })
      .lean();

    if (activeStakes.length === 0) return res.json({ total: 0, stakes: [] });

    const stakeIds = activeStakes.map(s => String(s._id));
    const existingWithdrawals = await Withdrawal.find({
      stake_id: { $in: stakeIds },
      status: { $in: ['completed', 'pending'] },
    }).lean();

    const withdrawnMap: Record<string, number> = {};
    for (const w of existingWithdrawals) {
      if (w.stake_id) {
        withdrawnMap[String(w.stake_id)] = (withdrawnMap[String(w.stake_id)] || 0) + Number(w.amount);
      }
    }

    let total = 0;
    const stakes = activeStakes.map(s => {
      const id = String(s._id);
      const principal = s.deposited_amount ?? s.amount;
      const stakeDate = s.start_time ?? s.created_at;
      const released = calcTotalReleased(principal, stakeDate);
      const withdrawn = withdrawnMap[id] || 0;
      const available = Math.max(0, released - withdrawn);
      total += available;

      const msElapsed = Date.now() - new Date(stakeDate).getTime();
      const days = Math.floor(msElapsed / (1000 * 60 * 60 * 24));

      return {
        id,
        deposited: principal,
        days,
        released,
        withdrawn,
        available,
        created_at: s.created_at,
      };
    });

    res.json({ total, stakes });
  } catch {
    res.status(500).json({ error: 'Failed to fetch available balance' });
  }
});

/**
 * Single withdrawal request — backend auto-distributes across stakes (oldest first).
 * Creates one withdrawal record per stake drawn from.
 */
withdrawalsRouter.post('/', async (req, res) => {
  try {
    const { wallet_address, amount } = req.body;

    if (!wallet_address || typeof wallet_address !== 'string' || wallet_address.length < 32) {
      return res.status(400).json({ error: 'Invalid wallet_address' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const activeStakes = await Stake.find({ wallet_address, status: 'active' })
      .sort({ created_at: 1 })
      .lean();

    if (activeStakes.length === 0) {
      return res.status(400).json({ error: 'No active stakes found' });
    }

    const stakeIds = activeStakes.map(s => String(s._id));
    const existingWithdrawals = await Withdrawal.find({
      stake_id: { $in: stakeIds },
      status: { $in: ['completed', 'pending'] },
    }).lean();

    const withdrawnMap: Record<string, number> = {};
    for (const w of existingWithdrawals) {
      if (w.stake_id) {
        withdrawnMap[String(w.stake_id)] = (withdrawnMap[String(w.stake_id)] || 0) + Number(w.amount);
      }
    }

    const stakeAvailabilities = activeStakes.map(s => {
      const id = String(s._id);
      const principal = s.deposited_amount ?? s.amount;
      const stakeDate = s.start_time ?? s.created_at;
      const released = calcTotalReleased(principal, stakeDate);
      const withdrawn = withdrawnMap[id] || 0;
      return { id, available: Math.max(0, released - withdrawn) };
    });

    const totalAvailable = stakeAvailabilities.reduce((sum, s) => sum + s.available, 0);

    if (amount > totalAvailable + 0.001) {
      return res.status(400).json({ error: `Amount exceeds available: ${totalAvailable.toFixed(4)}` });
    }

    let remaining = Math.min(amount, totalAvailable);
    const created = [];

    for (const stake of stakeAvailabilities) {
      if (remaining <= 0.0001) break;
      if (stake.available <= 0.0001) continue;

      const drawAmount = Math.min(remaining, stake.available);
      remaining -= drawAmount;

      const doc = await Withdrawal.create({
        stake_id: stake.id,
        wallet_address,
        amount: drawAmount,
        withdrawal_type: 'manual',
        status: 'pending',
        transaction_signature: null,
      });

      created.push({ ...doc.toObject(), id: String(doc._id) });
    }

    res.status(201).json({ withdrawals: created, count: created.length });
  } catch {
    res.status(500).json({ error: 'Failed to create withdrawal' });
  }
});
