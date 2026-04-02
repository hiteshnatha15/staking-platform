import { Router } from 'express';
import { Stake } from '../models/Stake.js';

export const stakesRouter = Router();

// GET /api/stakes/tvl -- sum of active stake amounts
stakesRouter.get('/tvl', async (_req, res) => {
  try {
    const result = await Stake.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    res.json({ total: result[0]?.total ?? 0 });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/stakes?wallet_address=X&status=active,pending
stakesRouter.get('/', async (req, res) => {
  try {
    const { wallet_address, status } = req.query;
    const filter: Record<string, unknown> = {};
    if (wallet_address) filter.wallet_address = wallet_address;
    if (status) {
      const statuses = (status as string).split(',');
      filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
    }
    const stakes = await Stake.find(filter).sort({ created_at: -1 }).lean();
    const mapped = stakes.map((s) => ({ ...s, id: s._id }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/stakes
stakesRouter.post('/', async (req, res) => {
  try {
    const doc = await Stake.create(req.body);
    res.status(201).json({ ...doc.toObject(), id: doc._id });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// PATCH /api/stakes/:txSignature -- update status by transaction_signature
stakesRouter.patch('/:txSignature', async (req, res) => {
  try {
    const updated = await Stake.findOneAndUpdate(
      { transaction_signature: req.params.txSignature },
      { $set: req.body },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json({ ...updated.toObject(), id: updated._id });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
