import { Router } from 'express';
import { RewardClaim } from '../models/RewardClaim.js';

export const rewardsRouter = Router();

// GET /api/rewards?wallet_address=X
rewardsRouter.get('/', async (req, res) => {
  try {
    const docs = await RewardClaim.find({ wallet_address: req.query.wallet_address }).lean();
    res.json(docs.map((d) => ({ ...d, id: d._id })));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/rewards
rewardsRouter.post('/', async (req, res) => {
  try {
    const doc = await RewardClaim.create(req.body);
    res.status(201).json({ ...doc.toObject(), id: doc._id });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
