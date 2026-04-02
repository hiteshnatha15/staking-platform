import { Router } from 'express';
import { Withdrawal } from '../models/Withdrawal.js';

export const withdrawalsRouter = Router();

// GET /api/withdrawals?wallet_address=X
withdrawalsRouter.get('/', async (req, res) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.wallet_address) filter.wallet_address = req.query.wallet_address;
    const docs = await Withdrawal.find(filter).sort({ created_at: -1 }).lean();
    res.json(docs.map((d) => ({ ...d, id: d._id })));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/withdrawals
withdrawalsRouter.post('/', async (req, res) => {
  try {
    const doc = await Withdrawal.create(req.body);
    res.status(201).json({ ...doc.toObject(), id: doc._id });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
