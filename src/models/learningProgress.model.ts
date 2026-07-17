import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IWordProgress {
  word: Types.ObjectId;
  interval: number;
  nextReview: Date;
  reviews: number;
  correct: number;
}

export interface ILearningProgress extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  xp: number;
  streak: number;
  sessions: number;
  minutesLearned: number;
  dailyGoal: number;
  lastStudyDate: Date | null;
  words: Types.DocumentArray<IWordProgress>;
}

const wordProgressSchema = new Schema<IWordProgress>(
  {
    word: { type: Schema.Types.ObjectId, ref: 'VocabularyWord', required: true },
    interval: { type: Number, default: 0, min: 0 },
    nextReview: { type: Date, default: Date.now },
    reviews: { type: Number, default: 0, min: 0 },
    correct: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const learningProgressSchema = new Schema<ILearningProgress>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    xp: { type: Number, default: 0, min: 0 },
    streak: { type: Number, default: 0, min: 0 },
    sessions: { type: Number, default: 0, min: 0 },
    minutesLearned: { type: Number, default: 0, min: 0 },
    dailyGoal: { type: Number, default: 15, min: 5, max: 60 },
    lastStudyDate: { type: Date, default: null },
    words: { type: [wordProgressSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model<ILearningProgress>('LearningProgress', learningProgressSchema);
