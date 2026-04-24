import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './db.js';
import { seedData } from './seed.js';
import { stakesRouter } from './routes/stakes.js';
import { withdrawalsRouter } from './routes/withdrawals.js';
import { referralsRouter } from './routes/referrals.js';
import { commissionsRouter } from './routes/commissions.js';
import { rewardsRouter } from './routes/rewards.js';
import { historyRouter } from './routes/history.js';
import { adminRouter } from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '8080', 10);

const app = express();
app.use(express.json({ limit: '16kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/stakes', stakesRouter);
app.use('/api/withdrawals', withdrawalsRouter);
app.use('/api/referrals', referralsRouter);
app.use('/api/commissions', commissionsRouter);
app.use('/api/rewards', rewardsRouter);
app.use('/api/history', historyRouter);
app.use('/api/admin', adminRouter);

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath, { maxAge: '1y', immutable: true }));
app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

async function start() {
  await connectDB();
  await seedData();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
