-- Update level commissions to 3-level system
-- Level 1: 10%, Level 2: 5%, Level 3: 3%
DELETE FROM level_commissions WHERE level > 3;
UPDATE level_commissions SET percentage = 10 WHERE level = 1;
UPDATE level_commissions SET percentage = 5  WHERE level = 2;
UPDATE level_commissions SET percentage = 3  WHERE level = 3;

-- Add status column to commission_withdrawals if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commission_withdrawals' AND column_name = 'status'
  ) THEN
    ALTER TABLE commission_withdrawals
      ADD COLUMN status text NOT NULL DEFAULT 'completed';
  END IF;
END $$;
