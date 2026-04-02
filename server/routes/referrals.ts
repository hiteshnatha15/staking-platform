import { Router } from 'express';
import { ReferralCode } from '../models/ReferralCode.js';

export const referralsRouter = Router();

// GET /api/referrals/count -- total registered users
referralsRouter.get('/count', async (_req, res) => {
  try {
    const count = await ReferralCode.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/referrals/lookup?referral_code=X -- find wallet by referral code
referralsRouter.get('/lookup', async (req, res) => {
  try {
    const { referral_code } = req.query;
    if (!referral_code) return res.json({ wallet_address: null });
    const doc = await ReferralCode.findOne({ referral_code: (referral_code as string).trim() }).lean();
    res.json({ wallet_address: doc?.wallet_address ?? null });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/referrals?referred_by=X -- get referrals by referrer
referralsRouter.get('/', async (req, res) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.referred_by) filter.referred_by = req.query.referred_by;
    if (req.query.wallet_address) filter.wallet_address = req.query.wallet_address;
    const docs = await ReferralCode.find(filter).sort({ created_at: -1 }).lean();
    res.json(docs.map((d) => ({ ...d, id: d._id })));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/referrals/count-by?referred_by=X -- count referrals for a wallet
referralsRouter.get('/count-by', async (req, res) => {
  try {
    const count = await ReferralCode.countDocuments({ referred_by: req.query.referred_by });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/referrals -- upsert referral code
referralsRouter.post('/', async (req, res) => {
  try {
    const { wallet_address, referral_code, referred_by } = req.body;
    const doc = await ReferralCode.findOneAndUpdate(
      { wallet_address },
      { $setOnInsert: { wallet_address, referral_code, referred_by } },
      { upsert: true, new: true }
    );
    res.status(201).json({ ...doc.toObject(), id: doc._id });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
