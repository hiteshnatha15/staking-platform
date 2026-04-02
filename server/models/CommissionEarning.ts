import mongoose, { Schema, Document } from 'mongoose';

export interface ICommissionEarning extends Document {
  wallet_address: string;
  from_wallet: string;
  amount: number;
  level: number;
  stake_id: string | null;
  created_at: Date;
}

const commissionEarningSchema = new Schema<ICommissionEarning>({
  wallet_address: { type: String, required: true, index: true },
  from_wallet: { type: String, required: true },
  amount: { type: Number, required: true },
  level: { type: Number, required: true, index: true },
  stake_id: { type: String, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const CommissionEarning = mongoose.model<ICommissionEarning>('CommissionEarning', commissionEarningSchema);
