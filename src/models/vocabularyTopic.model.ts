import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IVocabularyTopic extends Document {
  _id: Types.ObjectId;
  slug: string;
  title: { vi: string; en: string };
  description: { vi: string; en: string };
  emoji: string;
  imageUrl?: string | null;
  color: string;
  order: number;
  isPublished: boolean;
}

const localizedTextSchema = new Schema(
  { vi: { type: String, required: true }, en: { type: String, required: true } },
  { _id: false }
);

const vocabularyTopicSchema = new Schema<IVocabularyTopic>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: { type: localizedTextSchema, required: true },
    description: { type: localizedTextSchema, required: true },
    emoji: { type: String, required: true },
    imageUrl: { type: String, default: null, trim: true },
    color: { type: String, required: true },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model<IVocabularyTopic>('VocabularyTopic', vocabularyTopicSchema);
