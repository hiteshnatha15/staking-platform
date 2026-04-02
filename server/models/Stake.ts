import mongoose, { Schema, Document } from 'mongoose';

export interface IStake extends Document {
  wallet_address: string;
  amount: number;
  deposited_amount: number | null;
  start_time: Date;
  status: 'active' | 'pending' | 'withdrawn';
  transaction_signature: string | null;
  created_at: Date;
  updated_at: Date;
}

const stakeSchema = new Schema<IStake>({
  wallet_address: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  deposited_amount: { type: Number, default: null },
  start_time: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'pending', 'withdrawn'], default: 'active', index: true },
  transaction_signature: { type: String, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const Stake = mongoose.model<IStake>('Stake', stakeSchema);
