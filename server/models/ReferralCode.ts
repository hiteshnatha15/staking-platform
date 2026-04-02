import mongoose, { Schema, Document } from 'mongoose';

export interface IReferralCode extends Document {
  wallet_address: string;
  referral_code: string;
  referred_by: string | null;
  created_at: Date;
}

const referralCodeSchema = new Schema<IReferralCode>({
  wallet_address: { type: String, required: true, unique: true, index: true },
  referral_code: { type: String, required: true, unique: true, index: true },
  referred_by: { type: String, default: null, index: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const ReferralCode = mongoose.model<IReferralCode>('ReferralCode', referralCodeSchema);
