-- Add deposited_amount to stakes for 30% instant bonus tracking
-- amount = effective (deposited + 30% bonus) for display & rewards
-- deposited_amount = actual tokens sent to vault (for withdrawal)
ALTER TABLE stakes ADD COLUMN IF NOT EXISTS deposited_amount numeric;
-- Backfill: old stakes had no bonus, so deposited = amount
UPDATE stakes SET deposited_amount = amount WHERE deposited_amount IS NULL;
