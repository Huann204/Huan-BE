import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPeerChallenge extends Document {
  _id: Types.ObjectId;
  creator: Types.ObjectId;
  opponent: Types.ObjectId;
  targetXp: number;
  status: 'pending' | 'active' | 'declined' | 'completed';
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
}

const peerChallengeSchema = new Schema<IPeerChallenge>(
  {
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    opponent: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetXp: { type: Number, min: 50, max: 5000, default: 200 },
    status: { type: String, enum: ['pending', 'active', 'declined', 'completed'], default: 'pending' },
    startsAt: { type: Date, default: Date.now },
    endsAt: { type: Date, required: true, index: true },
  },
  { timestamps: true, versionKey: false }
);
peerChallengeSchema.index({ creator: 1, opponent: 1, status: 1 });
export default mongoose.model<IPeerChallenge>('PeerChallenge', peerChallengeSchema);
