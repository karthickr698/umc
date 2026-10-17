import { Types } from 'mongoose';
import { RefreshTokenModel } from '../models/refresh-token.model.js';

export async function create(userId: string, expiresAt: Date): Promise<string> {
  const doc = await RefreshTokenModel.create({ userId: new Types.ObjectId(userId), expiresAt });
  return doc.id;
}

/** Deletes the session if it exists and is unexpired; resolves to whether one was consumed. */
export async function consume(id: string, userId: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(id)) return false;
  const deleted = await RefreshTokenModel.findOneAndDelete({
    _id: id,
    userId,
    expiresAt: { $gt: new Date() },
  }).lean();
  return deleted !== null;
}

export async function deleteById(id: string): Promise<void> {
  if (!Types.ObjectId.isValid(id)) return;
  await RefreshTokenModel.deleteOne({ _id: id });
}

export async function deleteAllForUser(userId: string): Promise<void> {
  await RefreshTokenModel.deleteMany({ userId });
}
