import { Router } from 'express';
import { CommissionEarning } from '../models/CommissionEarning.js';
import { CommissionWithdrawal } from '../models/CommissionWithdrawal.js';

export const commissionsRouter = Router();

// GET /api/commissions/earnings?wallet_address=X
commissionsRouter.get('/earnings', async (req, res) => {
  try {
    const docs = await CommissionEarning.find({ wallet_address: req.query.wallet_address }).lean();
    res.json(docs.map((d) => ({ ...d, id: d._id })));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/commissions/withdrawals?wallet_address=X
commissionsRouter.get('/withdrawals', async (req, res) => {
  try {
    const docs = await CommissionWithdrawal.find({ wallet_address: req.query.wallet_address }).lean();
    res.json(docs.map((d) => ({ ...d, id: d._id })));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/commissions/withdrawals
commissionsRouter.post('/withdrawals', async (req, res) => {
  try {
    const doc = await CommissionWithdrawal.create(req.body);
    res.status(201).json({ ...doc.toObject(), id: doc._id });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
