# RUBIX Staking DApp

A Solana-based token staking platform with a 3-level referral system, controlled daily withdrawals, and a separate referral income wallet. Built with React, TypeScript, and Supabase.

## Features

### Staking
- **30% Auto-Stake Bonus** — Stake 100 tokens, get 130 in your staking balance
- **12% APR** — Rewards accrue hourly based on staked amount
- **Reward Claiming** — Claim accumulated staking rewards at any time

### Controlled Withdrawals (1% Daily Unstake)
Staked tokens are not available for instant withdrawal. Instead, **1% of the remaining staked balance is released each day**:

| Day | Remaining | Released | Cumulative |
|-----|-----------|----------|------------|
| 1   | 100       | 1.00     | 1.00       |
| 2   | 99        | 0.99     | 1.99       |
| 3   | 98.01     | 0.98     | 2.97       |

Partial withdrawals are supported — withdraw any amount up to what has been released.

### 3-Level Referral System
Earn commission when your referrals stake tokens:

| Level | Commission |
|-------|-----------|
| Level 1 (Direct) | 10% |
| Level 2 | 5% |
| Level 3 | 3% |

### Referral Wallet (10% Daily Withdrawal)
Referral income is held in a **separate wallet** with its own withdrawal schedule. **10% of the remaining balance is released daily**:

| Day | Remaining | Released | Cumulative |
|-----|-----------|----------|------------|
| 1   | 1000      | 100      | 100        |
| 2   | 900       | 90       | 190        |
| 3   | 810       | 81       | 271        |

### Other
- Phantom & Solflare wallet support (desktop + mobile deep links)
- Live token price via DexScreener / Birdeye
- Team dashboard with direct referrals and team volume
- Full transaction history (stakes, withdrawals, commissions, rewards)
- Demo mode when Solana token is not configured

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS 3 |
| Blockchain | Solana (web3.js, SPL Token) |
| Wallets | Phantom, Solflare via Wallet Adapter |
| Backend/DB | Supabase (Postgres + RLS) |

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- An SPL token mint address and a vault wallet (for production)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Solana token config
VITE_TOKEN_MINT=YourSPLTokenMintAddress
VITE_STAKING_VAULT=YourVaultWalletPublicKey
VITE_TOKEN_SYMBOL=RUBIX
VITE_TOKEN_DECIMALS=9
VITE_SOLANA_RPC=https://rpc.ankr.com/solana

# Optional - for live price feed
# VITE_BIRDEYE_API_KEY=your-birdeye-api-key
```

> Without `VITE_TOKEN_MINT` and `VITE_STAKING_VAULT`, the app runs in **demo mode** (no on-chain transactions).

### 3. Set up the database

Run the SQL migrations in your Supabase SQL editor, in order:

1. `supabase/migrations/20260316083134_create_staking_tables.sql`
2. `supabase/migrations/20260318090000_create_networking_tables.sql`
3. `supabase/migrations/20260319000000_commission_reward_tables.sql`
4. `supabase/migrations/20260320000000_staking_30_percent_bonus.sql`
5. `supabase/migrations/20260402000000_update_3_level_referral.sql`

### 4. Start development server

```bash
npm run dev
```

Opens at [http://localhost:8080](http://localhost:8080).

### 5. Build for production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── App.tsx                    # Main app layout, tabs, dashboard
├── main.tsx                   # Entry point
├── index.css                  # Global styles, glassmorphism, animations
├── components/
│   ├── StakingInterface.tsx   # Stake form, wallet stats, active positions
│   ├── WithdrawalInterface.tsx# 1% daily release withdrawal UI
│   ├── LevelIncome.tsx        # Referral wallet, 10% daily release, 3-level table
│   ├── ReferralSection.tsx    # Referral link, copy/share
│   ├── RewardClaim.tsx        # Claim staking rewards
│   ├── TeamDashboard.tsx      # Team stats, direct referral list
│   ├── TransactionHistory.tsx # Combined tx history
│   ├── WalletProvider.tsx     # Solana wallet adapter setup
│   ├── ErrorBoundary.tsx      # React error boundary
│   └── icons/ProIcons.tsx     # SVG icon components
├── contexts/
│   └── ToastContext.tsx        # Toast notification system
└── lib/
    ├── supabase.ts            # Supabase client + TypeScript interfaces
    ├── solana.ts              # RPC connection, token transfers, confirmation
    ├── tokenConfig.ts         # Token symbol, decimals, APR, bonus config
    ├── priceApi.ts            # DexScreener / Birdeye price fetching
    └── explorer.ts            # Solana Explorer URL helper
```

## Database Tables

| Table | Purpose |
|-------|---------|
| `stakes` | Active and withdrawn stakes per wallet |
| `withdrawals` | Partial stake withdrawal records |
| `admin_wallets` | Authorized admin wallet addresses |
| `referral_codes` | User wallet-to-referral-code mapping |
| `level_commissions` | Commission percentages per level (1-3) |
| `commission_earnings` | Per-earning records with timestamps |
| `commission_withdrawals` | Referral income withdrawal records |
| `reward_claims` | Staking reward claim records |

## Configuration

Key constants in `src/lib/tokenConfig.ts`:

| Setting | Default | Description |
|---------|---------|-------------|
| `apr` | 12 | Annual percentage rate for staking rewards |
| `stakingBonusPercent` | 30 | Instant bonus on deposit (stake 100 → 130) |

Withdrawal rates are defined in the components:
- **Stake withdrawal**: 1% daily release (`WithdrawalInterface.tsx`, `StakingInterface.tsx`)
- **Referral withdrawal**: 10% daily release (`LevelIncome.tsx`)

## License

Private — all rights reserved.
