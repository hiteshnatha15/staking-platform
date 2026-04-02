import { Router } from 'express';
import { Stake } from '../models/Stake.js';
import { Withdrawal } from '../models/Withdrawal.js';
import { CommissionWithdrawal } from '../models/CommissionWithdrawal.js';
import { RewardClaim } from '../models/RewardClaim.js';

export const historyRouter = Router();

// GET /api/history?wallet_address=X -- combined transaction history
historyRouter.get('/', async (req, res) => {
  try {
    const wallet = req.query.wallet_address as string;
    if (!wallet) return res.json([]);

    const [stakes, withdrawals, commissions, rewards] = await Promise.all([
      Stake.find({ wallet_address: wallet }).sort({ created_at: -1 }).limit(50).lean(),
      Withdrawal.find({ wallet_address: wallet }).sort({ created_at: -1 }).limit(50).lean(),
      CommissionWithdrawal.find({ wallet_address: wallet }).sort({ created_at: -1 }).limit(50).lean(),
      RewardClaim.find({ wallet_address: wallet }).sort({ created_at: -1 }).limit(50).lean(),
    ]);

    const combined = [
      ...stakes.map((s) => ({ id: `stake-${s._id}`, type: 'stake' as const, amount: s.amount, status: s.status, transaction_signature: s.transaction_signature, created_at: s.created_at })),
      ...withdrawals.map((w) => ({ id: `withdraw-${w._id}`, type: 'withdrawal' as const, amount: w.amount, status: w.status, transaction_signature: w.transaction_signature, created_at: w.created_at })),
      ...commissions.map((c) => ({ id: `commission-${c._id}`, type: 'commission' as const, amount: c.amount, transaction_signature: c.transaction_signature, created_at: c.created_at })),
      ...rewards.map((r) => ({ id: `reward-${r._id}`, type: 'reward' as const, amount: r.amount, transaction_signature: r.transaction_signature, created_at: r.created_at })),
    ];

    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(combined.slice(0, 30));
  } catch {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});
