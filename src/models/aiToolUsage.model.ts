import mongoose, { Schema } from 'mongoose';

const aiToolUsageSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    feature: {
      type: String,
      enum: ['writing', 'vocabulary', 'exercises', 'writing_prompt', 'speaking_prompt', 'speaking_review', 'conversation'],
      required: true,
    },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 14 },
  },
  { versionKey: false }
);

aiToolUsageSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('AiToolUsage', aiToolUsageSchema);
