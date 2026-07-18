import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotification extends Document {
  user: Types.ObjectId;
  actor?: Types.ObjectId;
  type: 'friend_request' | 'friend_accepted' | 'challenge_invite' | 'challenge_accepted' | 'system';
  title: { vi: string; en: string };
  message: { vi: string; en: string };
  link?: string;
  readAt: Date | null;
  createdAt: Date;
}

const localizedSchema = new Schema({ vi: { type: String, required: true }, en: { type: String, required: true } }, { _id: false });
const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['friend_request', 'friend_accepted', 'challenge_invite', 'challenge_accepted', 'system'], required: true },
    title: { type: localizedSchema, required: true },
    message: { type: localizedSchema, required: true },
    link: { type: String },
    readAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);
notificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });
export default mongoose.model<INotification>('Notification', notificationSchema);
