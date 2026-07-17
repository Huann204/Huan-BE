import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAuthSession extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  tokenHash: string;
  userAgent: string;
  ipAddress: string;
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const authSessionSchema = new Schema<IAuthSession>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, select: false },
    userAgent: { type: String, default: 'Unknown device' },
    ipAddress: { type: String, default: 'Unknown' },
    lastUsedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

authSessionSchema.index({ user: 1, revokedAt: 1, lastUsedAt: -1 });

export default mongoose.model<IAuthSession>('AuthSession', authSessionSchema);


