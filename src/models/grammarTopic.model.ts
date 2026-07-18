import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGrammarTopic extends Document {
  _id: Types.ObjectId; slug: string; title: { vi: string; en: string }; description: { vi: string; en: string };
  theory: { vi: string; en: string }; examples: string[]; level: 'A1' | 'A2'; icon: string; order: number; isPublished: boolean;
}
const localized = new Schema({ vi: { type: String, required: true }, en: { type: String, required: true } }, { _id: false });
const schema = new Schema<IGrammarTopic>({
  slug: { type: String, required: true, unique: true, lowercase: true }, title: { type: localized, required: true },
  description: { type: localized, required: true }, theory: { type: localized, required: true }, examples: { type: [String], default: [] },
  level: { type: String, enum: ['A1', 'A2'], required: true, index: true }, icon: { type: String, default: '📝' },
  order: { type: Number, default: 0 }, isPublished: { type: Boolean, default: true },
}, { timestamps: true, versionKey: false });
export default mongoose.model<IGrammarTopic>('GrammarTopic', schema);
