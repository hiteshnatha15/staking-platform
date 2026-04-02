import mongoose, { Schema, Document } from 'mongoose';

export interface ICommissionWithdrawal extends Document {
  wallet_address: string;
  amount: number;
  transaction_signature: string | null;
  status: string;
  created_at: Date;
}

const commissionWithdrawalSchema = new Schema<ICommissionWithdrawal>({
  wallet_address: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  transaction_signature: { type: String, default: null },
  status: { type: String, default: 'completed' },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const CommissionWithdrawal = mongoose.model<ICommissionWithdrawal>('CommissionWithdrawal', commissionWithdrawalSchema);
