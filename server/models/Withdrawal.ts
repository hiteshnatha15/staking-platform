import mongoose, { Schema, Document } from 'mongoose';

export interface IWithdrawal extends Document {
  stake_id: string | null;
  wallet_address: string;
  amount: number;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  withdrawal_type: 'auto' | 'manual';
  approved_by: string | null;
  transaction_signature: string | null;
  created_at: Date;
  updated_at: Date;
}

const withdrawalSchema = new Schema<IWithdrawal>({
  stake_id: { type: String, default: null },
  wallet_address: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'completed', 'rejected'], default: 'pending', index: true },
  withdrawal_type: { type: String, enum: ['auto', 'manual'], default: 'auto' },
  approved_by: { type: String, default: null },
  transaction_signature: { type: String, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const Withdrawal = mongoose.model<IWithdrawal>('Withdrawal', withdrawalSchema);
