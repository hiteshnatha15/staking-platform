import mongoose, { Schema, Document } from 'mongoose';

export interface ICommissionWithdrawal extends Document {
  wallet_address: string;
  amount: number;
  transaction_signature: string | null;
  status: 'pending' | 'completed' | 'rejected';
  approved_by: string | null;
  reject_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

const commissionWithdrawalSchema = new Schema<ICommissionWithdrawal>({
  wallet_address: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  transaction_signature: { type: String, default: null },
  status: { type: String, enum: ['pending', 'completed', 'rejected'], default: 'pending', index: true },
  approved_by: { type: String, default: null },
  reject_reason: { type: String, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const CommissionWithdrawal = mongoose.model<ICommissionWithdrawal>('CommissionWithdrawal', commissionWithdrawalSchema);
