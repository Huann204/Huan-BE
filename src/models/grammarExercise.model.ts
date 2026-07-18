import mongoose, { Document, Schema, Types } from 'mongoose';

export type GrammarExerciseType = 'choice' | 'fill_blank' | 'error_correction' | 'sentence_order';
export interface IGrammarExercise extends Document {
  _id: Types.ObjectId; topic: Types.ObjectId; slug: string; type: GrammarExerciseType;
  prompt: { vi: string; en: string }; options: string[]; correctAnswer: string;
  explanation: { vi: string; en: string }; order: number; isPublished: boolean;
}
const localized = new Schema({ vi: { type: String, required: true }, en: { type: String, required: true } }, { _id: false });
const schema = new Schema<IGrammarExercise>({
  topic: { type: Schema.Types.ObjectId, ref: 'GrammarTopic', required: true, index: true },
  slug: { type: String, required: true, unique: true }, type: { type: String, enum: ['choice', 'fill_blank', 'error_correction', 'sentence_order'], required: true },
  prompt: { type: localized, required: true }, options: { type: [String], default: [] }, correctAnswer: { type: String, required: true },
  explanation: { type: localized, required: true }, order: { type: Number, default: 0 }, isPublished: { type: Boolean, default: true },
}, { timestamps: true, versionKey: false });
schema.index({ topic: 1, order: 1 });
export default mongoose.model<IGrammarExercise>('GrammarExercise', schema);
