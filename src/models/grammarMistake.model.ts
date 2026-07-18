import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGrammarMistake extends Document {
  user: Types.ObjectId; topic: Types.ObjectId; exercise: Types.ObjectId; lastAnswer: string; attempts: number; resolvedAt: Date | null; lastAttemptAt: Date;
}
const schema = new Schema<IGrammarMistake>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, topic: { type: Schema.Types.ObjectId, ref: 'GrammarTopic', required: true },
  exercise: { type: Schema.Types.ObjectId, ref: 'GrammarExercise', required: true }, lastAnswer: { type: String, required: true }, attempts: { type: Number, default: 0 },
  resolvedAt: { type: Date, default: null }, lastAttemptAt: { type: Date, default: Date.now },
}, { timestamps: true, versionKey: false });
schema.index({ user: 1, exercise: 1 }, { unique: true });
export default mongoose.model<IGrammarMistake>('GrammarMistake', schema);


