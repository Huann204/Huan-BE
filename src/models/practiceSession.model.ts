import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPracticeSession extends Document {
  user: Types.ObjectId;
  correct: number;
  total: number;
  minutes: number;
  xpEarned: number;
  completedAt: Date;
}

const practiceSessionSchema = new Schema<IPracticeSession>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    correct: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 1 },
    minutes: { type: Number, required: true, min: 1 },
    xpEarned: { type: Number, required: true, min: 0 },
    completedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true, versionKey: false }
);

practiceSessionSchema.index({ user: 1, completedAt: -1 });

export default mongoose.model<IPracticeSession>('PracticeSession', practiceSessionSchema);
