import mongoose, { Schema, model, type Model, type Types } from 'mongoose';

/**
 * One document per active login session. The document `_id` is the refresh JWT's `jti`;
 * deleting the document revokes the token.
 */
export interface RefreshToken {
  userId: Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<RefreshToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, versionKey: false },
);

refreshTokenSchema.index({ userId: 1 });
// MongoDB's TTL monitor purges sessions once they expire.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel: Model<RefreshToken> =
  // `models` is not a named ESM export of mongoose; read it from the default export.
  (mongoose.models.RefreshToken as Model<RefreshToken> | undefined) ??
  model<RefreshToken>('RefreshToken', refreshTokenSchema);
