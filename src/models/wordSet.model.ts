import mongoose, { Document, Schema, Types } from 'mongoose';

export type WordSetVisibility = 'private' | 'public';
export type WordSetModerationStatus = 'not_required' | 'pending' | 'approved' | 'rejected';

export interface ISetWord {
  _id: Types.ObjectId;
  word: string;
  phonetic: string;
  meaning: { vi: string; en: string };
  example: string;
  exampleMeaning: string;
  imageUrl?: string | null;
  order: number;
}

export interface IWordSet extends Document {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  title: string;
  description: string;
  coverImageUrl?: string | null;
  visibility: WordSetVisibility;
  moderationStatus: WordSetModerationStatus;
  moderationNote: string;
  words: Types.DocumentArray<ISetWord>;
  sourceSet?: Types.ObjectId | null;
  copyCount: number;
  practiceCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const localizedTextSchema = new Schema(
  { vi: { type: String, required: true, trim: true }, en: { type: String, required: true, trim: true } },
  { _id: false }
);

const setWordSchema = new Schema<ISetWord>({
  word: { type: String, required: true, trim: true, maxlength: 100 },
  phonetic: { type: String, default: '', trim: true, maxlength: 100 },
  meaning: { type: localizedTextSchema, required: true },
  example: { type: String, default: '', trim: true, maxlength: 500 },
  exampleMeaning: { type: String, default: '', trim: true, maxlength: 500 },
  imageUrl: { type: String, default: null, trim: true },
  order: { type: Number, default: 0 },
});

const wordSetSchema = new Schema<IWordSet>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', trim: true, maxlength: 500 },
    coverImageUrl: { type: String, default: null, trim: true },
    visibility: { type: String, enum: ['private', 'public'], default: 'private', index: true },
    moderationStatus: {
      type: String,
      enum: ['not_required', 'pending', 'approved', 'rejected'],
      default: 'not_required',
      index: true,
    },
    moderationNote: { type: String, default: '', trim: true, maxlength: 500 },
    words: { type: [setWordSchema], default: [] },
    sourceSet: { type: Schema.Types.ObjectId, ref: 'WordSet', default: null },
    copyCount: { type: Number, default: 0, min: 0 },
    practiceCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false }
);

wordSetSchema.index({ visibility: 1, moderationStatus: 1, updatedAt: -1 });
wordSetSchema.index({ title: 'text', description: 'text' });

export default mongoose.model<IWordSet>('WordSet', wordSetSchema);
