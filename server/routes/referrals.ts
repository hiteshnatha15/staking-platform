import { Router } from 'express';
import { ReferralCode } from '../models/ReferralCode.js';

export const referralsRouter = Router();

referralsRouter.get('/count', async (_req, res) => {
  try {
    const count = await ReferralCode.countDocuments();
    res.json({ count });
  } catch {
    res.status(500).json({ error: 'Failed to count referrals' });
  }
});

referralsRouter.get('/lookup', async (req, res) => {
  try {
    const { referral_code } = req.query;
    if (!referral_code) return res.json({ wallet_address: null });
    const doc = await ReferralCode.findOne({ referral_code: (referral_code as string).trim() }).lean();
    res.json({ wallet_address: doc?.wallet_address ?? null });
  } catch {
    res.status(500).json({ error: 'Failed to lookup referral' });
  }
});

referralsRouter.get('/', async (req, res) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.referred_by) filter.referred_by = req.query.referred_by;
    if (req.query.wallet_address) filter.wallet_address = req.query.wallet_address;
    const docs = await ReferralCode.find(filter).sort({ created_at: -1 }).lean();
    res.json(docs.map((d) => ({ ...d, id: d._id })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

referralsRouter.get('/count-by', async (req, res) => {
  try {
    const referred_by = req.query.referred_by;
    if (!referred_by || typeof referred_by !== 'string') return res.json({ count: 0 });
    const count = await ReferralCode.countDocuments({ referred_by });
    res.json({ count });
  } catch {
    res.status(500).json({ error: 'Failed to count referrals' });
  }
});

referralsRouter.post('/', async (req, res) => {
  try {
    const { wallet_address, referral_code, referred_by } = req.body;
    if (!wallet_address || typeof wallet_address !== 'string' || wallet_address.length < 32) {
      return res.status(400).json({ error: 'Invalid wallet_address' });
    }
    if (!referral_code || typeof referral_code !== 'string') {
      return res.status(400).json({ error: 'Invalid referral_code' });
    }
    if (referred_by === wallet_address) {
      return res.status(400).json({ error: 'Cannot refer yourself' });
    }
    const doc = await ReferralCode.findOneAndUpdate(
      { wallet_address },
      { $setOnInsert: { wallet_address, referral_code, referred_by: referred_by || null } },
      { upsert: true, new: true }
    );
    res.status(201).json({ ...doc.toObject(), id: doc._id });
  } catch {
    res.status(500).json({ error: 'Failed to upsert referral' });
  }
});
