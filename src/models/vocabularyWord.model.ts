import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IVocabularyWord extends Document {
  _id: Types.ObjectId;
  topic: Types.ObjectId;
  slug: string;
  word: string;
  phonetic: string;
  meaning: { vi: string; en: string };
  example: string;
  exampleMeaning: string;
  emoji: string;
  order: number;
  isPublished: boolean;
}

const localizedTextSchema = new Schema(
  { vi: { type: String, required: true }, en: { type: String, required: true } },
  { _id: false }
);

const vocabularyWordSchema = new Schema<IVocabularyWord>(
  {
    topic: { type: Schema.Types.ObjectId, ref: 'VocabularyTopic', required: true, index: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    word: { type: String, required: true, trim: true },
    phonetic: { type: String, required: true },
    meaning: { type: localizedTextSchema, required: true },
    example: { type: String, required: true },
    exampleMeaning: { type: String, required: true },
    emoji: { type: String, required: true },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

vocabularyWordSchema.index({ topic: 1, order: 1 });

export default mongoose.model<IVocabularyWord>('VocabularyWord', vocabularyWordSchema);
