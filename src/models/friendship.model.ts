import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFriendship extends Document {
  _id: Types.ObjectId;
  requester: Types.ObjectId;
  recipient: Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const friendshipSchema = new Schema<IFriendship>(
  {
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  },
  { timestamps: true, versionKey: false }
);
friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });
export default mongoose.model<IFriendship>('Friendship', friendshipSchema);
