import mongoose, { Schema } from 'mongoose';

const aiGenerationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    feature: { type: String, enum: ['word_set'], required: true },
    model: { type: String, required: true },
    topic: { type: String, required: true, maxlength: 120 },
    itemCount: { type: Number, required: true, min: 1 },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 },
  },
  { versionKey: false }
);

aiGenerationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('AiGeneration', aiGenerationSchema);
