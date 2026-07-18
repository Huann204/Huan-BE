import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGrammarProgress extends Document {
  user: Types.ObjectId; topic: Types.ObjectId; attempted: number; correct: number; completedExercises: Types.ObjectId[]; mastery: number; lastPracticedAt: Date;
}
const schema = new Schema<IGrammarProgress>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, topic: { type: Schema.Types.ObjectId, ref: 'GrammarTopic', required: true, index: true },
  attempted: { type: Number, default: 0 }, correct: { type: Number, default: 0 }, completedExercises: [{ type: Schema.Types.ObjectId, ref: 'GrammarExercise' }],
  mastery: { type: Number, default: 0, min: 0, max: 100 }, lastPracticedAt: { type: Date, default: Date.now },
}, { timestamps: true, versionKey: false });
schema.index({ user: 1, topic: 1 }, { unique: true });
export default mongoose.model<IGrammarProgress>('GrammarProgress', schema);
