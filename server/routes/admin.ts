import { Router } from 'express';
import { adminAuth, signAdminToken, AdminRequest } from '../middleware/adminAuth.js';
import { Stake } from '../models/Stake.js';
import { Withdrawal } from '../models/Withdrawal.js';
import { ReferralCode } from '../models/ReferralCode.js';
import { CommissionEarning } from '../models/CommissionEarning.js';
import { CommissionWithdrawal } from '../models/CommissionWithdrawal.js';
import { RewardClaim } from '../models/RewardClaim.js';

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || '';

export const adminRouter = Router();

// ────────────────────── Login (public) ──────────────────────

adminRouter.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = signAdminToken(username);
  res.json({ token, username });
});

// ──── All routes below require auth ────
adminRouter.use(adminAuth);

// ────────────────────── Dashboard Stats ──────────────────────

adminRouter.get('/stats', async (_req, res) => {
  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      tvlResult,
      totalUsers,
      activeStakes,
      totalStakes,
      pendingWithdrawals,
      pendingWithdrawalAmount,
      pendingCommissionWithdrawals,
      pendingCommissionWithdrawalAmount,
      stakes24h,
      totalRewardsClaimed,
      totalCommissions,
    ] = await Promise.all([
      Stake.aggregate([{ $match: { status: 'active' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      ReferralCode.countDocuments(),
      Stake.countDocuments({ status: 'active' }),
      Stake.countDocuments(),
      Withdrawal.countDocuments({ status: 'pending' }),
      Withdrawal.aggregate([{ $match: { status: 'pending' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      CommissionWithdrawal.countDocuments({ status: 'pending' }),
      CommissionWithdrawal.aggregate([{ $match: { status: 'pending' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Stake.countDocuments({ created_at: { $gte: yesterday } }),
      RewardClaim.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      CommissionEarning.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    res.json({
      tvl: tvlResult[0]?.total ?? 0,
      totalUsers,
      activeStakes,
      totalStakes,
      pendingWithdrawals,
      pendingWithdrawalAmount: pendingWithdrawalAmount[0]?.total ?? 0,
      pendingCommissionWithdrawals,
      pendingCommissionWithdrawalAmount: pendingCommissionWithdrawalAmount[0]?.total ?? 0,
      stakes24h,
      totalRewardsClaimed: totalRewardsClaimed[0]?.total ?? 0,
      totalCommissions: totalCommissions[0]?.total ?? 0,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ────────────────────── Recent Activity ──────────────────────

adminRouter.get('/activity', async (_req, res) => {
  try {
    const [stakes, withdrawals, rewards] = await Promise.all([
      Stake.find().sort({ created_at: -1 }).limit(10).lean(),
      Withdrawal.find().sort({ created_at: -1 }).limit(10).lean(),
      RewardClaim.find().sort({ created_at: -1 }).limit(10).lean(),
    ]);

    const items = [
      ...stakes.map(s => ({ id: String(s._id), type: 'stake' as const, wallet: s.wallet_address, amount: s.amount, status: s.status, date: s.created_at })),
      ...withdrawals.map(w => ({ id: String(w._id), type: 'withdrawal' as const, wallet: w.wallet_address, amount: w.amount, status: w.status, date: w.created_at })),
      ...rewards.map(r => ({ id: String(r._id), type: 'reward' as const, wallet: r.wallet_address, amount: r.amount, status: 'claimed', date: r.created_at })),
    ];
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(items.slice(0, 15));
  } catch {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// ────────────────────── Stakes CRUD ──────────────────────

adminRouter.get('/stakes', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};

    if (req.query.wallet) {
      filter.wallet_address = { $regex: req.query.wallet, $options: 'i' };
    }
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }

    const [docs, total] = await Promise.all([
      Stake.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
      Stake.countDocuments(filter),
    ]);

    res.json({
      data: docs.map(d => ({ ...d, id: String(d._id) })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch stakes' });
  }
});

adminRouter.patch('/stakes/:id', async (req: AdminRequest, res) => {
  try {
    const allowed = ['active', 'pending', 'withdrawn'];
    const updates: Record<string, unknown> = {};

    if (req.body.status && allowed.includes(req.body.status)) {
      updates.status = req.body.status;
    }
    if (typeof req.body.amount === 'number' && req.body.amount >= 0) {
      updates.amount = req.body.amount;
    }
    if (typeof req.body.deposited_amount === 'number' && req.body.deposited_amount >= 0) {
      updates.deposited_amount = req.body.deposited_amount;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const doc = await Stake.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!doc) return res.status(404).json({ error: 'Stake not found' });
    res.json({ ...doc.toObject(), id: String(doc._id) });
  } catch {
    res.status(500).json({ error: 'Failed to update stake' });
  }
});

// ────────────────────── Withdrawals CRUD ──────────────────────

adminRouter.get('/withdrawals', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};

    if (req.query.wallet) {
      filter.wallet_address = { $regex: req.query.wallet, $options: 'i' };
    }
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }

    const [docs, total] = await Promise.all([
      Withdrawal.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
      Withdrawal.countDocuments(filter),
    ]);

    res.json({
      data: docs.map(d => ({ ...d, id: String(d._id) })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

adminRouter.patch('/withdrawals/:id', async (req: AdminRequest, res) => {
  try {
    const allowed = ['completed', 'rejected'];
    const newStatus = req.body.status;
    if (!newStatus || !allowed.includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status. Use completed or rejected.' });
    }

    if (newStatus === 'completed') {
      const txSig = req.body.transaction_signature;
      if (!txSig || typeof txSig !== 'string' || txSig.trim().length < 10) {
        return res.status(400).json({ error: 'Transaction signature is required to complete a withdrawal.' });
      }
    }

    const updates: Record<string, unknown> = {
      status: newStatus,
      approved_by: req.adminUser || 'admin',
    };

    if (newStatus === 'completed') {
      updates.transaction_signature = req.body.transaction_signature.trim();
    }
    if (newStatus === 'rejected' && req.body.reject_reason) {
      updates.reject_reason = String(req.body.reject_reason).trim().slice(0, 500);
    }

    const doc = await Withdrawal.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!doc) return res.status(404).json({ error: 'Withdrawal not found' });
    res.json({ ...doc.toObject(), id: String(doc._id) });
  } catch {
    res.status(500).json({ error: 'Failed to update withdrawal' });
  }
});

// ────────────────────── Referrals ──────────────────────

adminRouter.get('/referrals', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = { referred_by: { $ne: null } };

    if (req.query.wallet) {
      filter.$or = [
        { wallet_address: { $regex: req.query.wallet, $options: 'i' } },
        { referred_by: { $regex: req.query.wallet, $options: 'i' } },
      ];
    }

    const [docs, total] = await Promise.all([
      ReferralCode.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
      ReferralCode.countDocuments(filter),
    ]);

    const wallets = docs.map(d => d.wallet_address);
    const commissionSums = await CommissionEarning.aggregate([
      { $match: { from_wallet: { $in: wallets } } },
      { $group: { _id: '$from_wallet', total: { $sum: '$amount' } } },
    ]);
    const commMap: Record<string, number> = {};
    for (const c of commissionSums) commMap[c._id] = c.total;

    const enriched = docs.map(d => ({
      id: String(d._id),
      wallet_address: d.wallet_address,
      referral_code: d.referral_code,
      referred_by: d.referred_by,
      commission_generated: commMap[d.wallet_address] ?? 0,
      created_at: d.created_at,
    }));

    res.json({ data: enriched, total, page, pages: Math.ceil(total / limit) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

adminRouter.get('/referral-stats', async (_req, res) => {
  try {
    const [
      totalReferrals,
      usersWithReferrals,
      commissionsByLevel,
      topReferrers,
      totalCommissionsPaid,
      totalCommissionsWithdrawn,
    ] = await Promise.all([
      ReferralCode.countDocuments({ referred_by: { $ne: null } }),
      ReferralCode.aggregate([
        { $match: { referred_by: { $ne: null } } },
        { $group: { _id: '$referred_by' } },
        { $count: 'count' },
      ]),
      CommissionEarning.aggregate([
        { $group: { _id: '$level', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      CommissionEarning.aggregate([
        { $group: { _id: '$wallet_address', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 10 },
      ]),
      CommissionEarning.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      CommissionWithdrawal.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    res.json({
      totalReferrals,
      usersWithReferrals: usersWithReferrals[0]?.count ?? 0,
      commissionsByLevel: commissionsByLevel.map(l => ({ level: l._id, total: l.total, count: l.count })),
      topReferrers: topReferrers.map(r => ({ wallet: r._id, totalEarned: r.total, referralCount: r.count })),
      totalCommissionsPaid: totalCommissionsPaid[0]?.total ?? 0,
      totalCommissionsWithdrawn: totalCommissionsWithdrawn[0]?.total ?? 0,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch referral stats' });
  }
});

adminRouter.get('/commissions', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};

    if (req.query.wallet) {
      filter.$or = [
        { wallet_address: { $regex: req.query.wallet, $options: 'i' } },
        { from_wallet: { $regex: req.query.wallet, $options: 'i' } },
      ];
    }
    if (req.query.level) {
      filter.level = parseInt(req.query.level as string);
    }

    const [docs, total] = await Promise.all([
      CommissionEarning.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
      CommissionEarning.countDocuments(filter),
    ]);

    res.json({
      data: docs.map(d => ({ ...d, id: String(d._id) })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch commissions' });
  }
});

adminRouter.get('/commission-withdrawals', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};

    if (req.query.wallet) {
      filter.wallet_address = { $regex: req.query.wallet, $options: 'i' };
    }
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }

    const [docs, total] = await Promise.all([
      CommissionWithdrawal.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
      CommissionWithdrawal.countDocuments(filter),
    ]);

    res.json({
      data: docs.map(d => ({ ...d, id: String(d._id) })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch commission withdrawals' });
  }
});

adminRouter.patch('/commission-withdrawals/:id', async (req: AdminRequest, res) => {
  try {
    const allowed = ['completed', 'rejected'];
    const newStatus = req.body.status;
    if (!newStatus || !allowed.includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status. Use completed or rejected.' });
    }

    if (newStatus === 'completed') {
      const txSig = req.body.transaction_signature;
      if (!txSig || typeof txSig !== 'string' || txSig.trim().length < 10) {
        return res.status(400).json({ error: 'Transaction signature is required to complete a withdrawal.' });
      }
    }

    const updates: Record<string, unknown> = {
      status: newStatus,
      approved_by: req.adminUser || 'admin',
    };

    if (newStatus === 'completed') {
      updates.transaction_signature = req.body.transaction_signature.trim();
    }
    if (newStatus === 'rejected' && req.body.reject_reason) {
      updates.reject_reason = String(req.body.reject_reason).trim().slice(0, 500);
    }

    const doc = await CommissionWithdrawal.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!doc) return res.status(404).json({ error: 'Commission withdrawal not found' });
    res.json({ ...doc.toObject(), id: String(doc._id) });
  } catch {
    res.status(500).json({ error: 'Failed to update commission withdrawal' });
  }
});

// ────────────────────── Users ──────────────────────

adminRouter.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};

    if (req.query.wallet) {
      filter.wallet_address = { $regex: req.query.wallet, $options: 'i' };
    }

    const [users, total] = await Promise.all([
      ReferralCode.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
      ReferralCode.countDocuments(filter),
    ]);

    const wallets = users.map(u => u.wallet_address);

    const [stakeTotals, referralCounts] = await Promise.all([
      Stake.aggregate([
        { $match: { wallet_address: { $in: wallets }, status: 'active' } },
        { $group: { _id: '$wallet_address', totalStaked: { $sum: '$amount' } } },
      ]),
      ReferralCode.aggregate([
        { $match: { referred_by: { $in: wallets } } },
        { $group: { _id: '$referred_by', count: { $sum: 1 } } },
      ]),
    ]);

    const stakeMap: Record<string, number> = {};
    for (const s of stakeTotals) stakeMap[s._id] = s.totalStaked;
    const refMap: Record<string, number> = {};
    for (const r of referralCounts) refMap[r._id] = r.count;

    const enriched = users.map(u => ({
      id: String(u._id),
      wallet_address: u.wallet_address,
      referral_code: u.referral_code,
      referred_by: u.referred_by,
      total_staked: stakeMap[u.wallet_address] ?? 0,
      referral_count: refMap[u.wallet_address] ?? 0,
      created_at: u.created_at,
    }));

    res.json({ data: enriched, total, page, pages: Math.ceil(total / limit) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

adminRouter.get('/users/:wallet', async (req, res) => {
  try {
    const wallet = req.params.wallet;
    const user = await ReferralCode.findOne({ wallet_address: wallet }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [stakes, withdrawals, commissions, rewards, referrals] = await Promise.all([
      Stake.find({ wallet_address: wallet }).sort({ created_at: -1 }).lean(),
      Withdrawal.find({ wallet_address: wallet }).sort({ created_at: -1 }).lean(),
      CommissionEarning.find({ wallet_address: wallet }).lean(),
      RewardClaim.find({ wallet_address: wallet }).lean(),
      ReferralCode.find({ referred_by: wallet }).lean(),
    ]);

    res.json({
      user: { ...user, id: String(user._id) },
      stakes: stakes.map(s => ({ ...s, id: String(s._id) })),
      withdrawals: withdrawals.map(w => ({ ...w, id: String(w._id) })),
      commissions: commissions.map(c => ({ ...c, id: String(c._id) })),
      rewards: rewards.map(r => ({ ...r, id: String(r._id) })),
      referrals: referrals.map(r => ({ ...r, id: String(r._id) })),
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});
