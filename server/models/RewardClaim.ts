import mongoose, { Schema, Document } from 'mongoose';

export interface IRewardClaim extends Document {
  wallet_address: string;
  stake_id: string | null;
  amount: number;
  transaction_signature: string | null;
  created_at: Date;
}

const rewardClaimSchema = new Schema<IRewardClaim>({
  wallet_address: { type: String, required: true, index: true },
  stake_id: { type: String, default: null },
  amount: { type: Number, required: true },
  transaction_signature: { type: String, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const RewardClaim = mongoose.model<IRewardClaim>('RewardClaim', rewardClaimSchema);
