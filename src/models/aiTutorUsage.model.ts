import mongoose, { Schema } from 'mongoose';

const aiTutorUsageSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    characterCount: { type: Number, required: true, min: 1 },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 7 },
  },
  { versionKey: false }
);

aiTutorUsageSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('AiTutorUsage', aiTutorUsageSchema);
