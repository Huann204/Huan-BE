import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDailyReward extends Document {
  user: Types.ObjectId;
  date: string;
  xpAwarded: number;
  claimedAt: Date;
}

const dailyRewardSchema = new Schema<IDailyReward>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true },
    xpAwarded: { type: Number, required: true, default: 25 },
    claimedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

dailyRewardSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model<IDailyReward>('DailyReward', dailyRewardSchema);
