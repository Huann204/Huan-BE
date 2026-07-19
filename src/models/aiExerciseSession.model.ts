import mongoose, { Schema } from 'mongoose';

const questionSchema = new Schema(
  {
    prompt: { type: String, required: true, maxlength: 500 },
    options: { type: [String], required: true, validate: (items: string[]) => items.length === 4 },
    correctIndex: { type: Number, required: true, min: 0, max: 3 },
    explanationVi: { type: String, required: true, maxlength: 800 },
  },
  { _id: true }
);

const aiExerciseSessionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    skill: { type: String, enum: ['vocabulary', 'grammar'], required: true },
    topic: { type: String, required: true, maxlength: 120 },
    level: { type: String, enum: ['A1', 'A2', 'B1', 'B2', 'C1'], required: true },
    questions: { type: [questionSchema], required: true },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    score: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
    completedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model('AiExerciseSession', aiExerciseSessionSchema);
