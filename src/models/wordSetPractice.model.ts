import mongoose, { Schema } from 'mongoose';

const wordSetPracticeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    wordSet: { type: Schema.Types.ObjectId, ref: 'WordSet', required: true, index: true },
    mode: { type: String, enum: ['flashcard', 'quiz'], required: true },
    correct: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 1 },
    completedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

wordSetPracticeSchema.index({ user: 1, completedAt: -1 });

export default mongoose.model('WordSetPractice', wordSetPracticeSchema);
