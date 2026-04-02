import { Router } from 'express';
import { Stake } from '../models/Stake.js';
import { ReferralCode } from '../models/ReferralCode.js';
import { CommissionEarning } from '../models/CommissionEarning.js';

const REFERRAL_LEVELS = [
  { level: 1, percent: 10 },
  { level: 2, percent: 5 },
  { level: 3, percent: 3 },
];

async function distributeCommissions(stakerWallet: string, stakeAmount: number, stakeId: string) {
  try {
    let currentWallet = stakerWallet;
    for (const { level, percent } of REFERRAL_LEVELS) {
      const ref = await ReferralCode.findOne({ wallet_address: currentWallet }).lean();
      if (!ref?.referred_by) break;

      const referrerWallet = ref.referred_by;
      const commission = stakeAmount * (percent / 100);

      await CommissionEarning.create({
        wallet_address: referrerWallet,
        from_wallet: stakerWallet,
        amount: commission,
        level,
        stake_id: stakeId,
      });

      currentWallet = referrerWallet;
    }
  } catch (err) {
    console.error('Commission distribution error:', err);
  }
}

export const stakesRouter = Router();

stakesRouter.get('/tvl', async (_req, res) => {
  try {
    const result = await Stake.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    res.json({ total: result[0]?.total ?? 0 });
  } catch {
    res.status(500).json({ error: 'Failed to fetch TVL' });
  }
});

stakesRouter.get('/', async (req, res) => {
  try {
    const { wallet_address, status } = req.query;
    if (!wallet_address || typeof wallet_address !== 'string') {
      return res.json([]);
    }
    const filter: Record<string, unknown> = { wallet_address };
    if (status) {
      const statuses = (status as string).split(',').filter(Boolean);
      filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
    }
    const stakes = await Stake.find(filter).sort({ created_at: -1 }).lean();
    res.json(stakes.map((s) => ({ ...s, id: s._id })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch stakes' });
  }
});

stakesRouter.post('/', async (req, res) => {
  try {
    const { wallet_address, amount, deposited_amount, transaction_signature, status } = req.body;

    if (!wallet_address || typeof wallet_address !== 'string' || wallet_address.length < 32) {
      return res.status(400).json({ error: 'Invalid wallet_address' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    if (typeof deposited_amount !== 'number' || deposited_amount <= 0) {
      return res.status(400).json({ error: 'Invalid deposited_amount' });
    }
    if (!transaction_signature || typeof transaction_signature !== 'string') {
      return res.status(400).json({ error: 'Invalid transaction_signature' });
    }

    const existing = await Stake.findOne({ transaction_signature }).lean();
    if (existing) {
      return res.status(200).json({ ...existing, id: existing._id, duplicate: true });
    }

    const doc = await Stake.create({
      wallet_address,
      amount,
      deposited_amount,
      transaction_signature,
      status: status === 'pending' ? 'pending' : 'active',
    });

    // Distribute referral commissions (non-blocking, uses deposited amount as basis)
    distributeCommissions(wallet_address, deposited_amount, String(doc._id));

    res.status(201).json({ ...doc.toObject(), id: doc._id });
  } catch {
    res.status(500).json({ error: 'Failed to create stake' });
  }
});

stakesRouter.patch('/:txSignature', async (req, res) => {
  try {
    const allowedStatus = ['active', 'pending', 'withdrawn'];
    const newStatus = req.body.status;
    if (!newStatus || !allowedStatus.includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const updated = await Stake.findOneAndUpdate(
      { transaction_signature: req.params.txSignature },
      { $set: { status: newStatus } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json({ ...updated.toObject(), id: updated._id });
  } catch {
    res.status(500).json({ error: 'Failed to update stake' });
  }
});
