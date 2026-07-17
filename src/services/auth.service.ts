import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import AuthSession from '../models/authSession.model';
import User from '../models/user.model';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import type { IUser } from '../types';

export interface RegisterInput { name: string; email: string; password: string }
export interface LoginInput { email: string; password: string }
export interface SessionContext { userAgent?: string; ipAddress?: string }
export interface TokenPair { token: string; refreshToken: string }
interface RefreshPayload { userId: string; sessionId: string }

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

const signAccessToken = (userId: string, role: string): string =>
  jwt.sign({ userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

const signRefreshToken = (userId: string, sessionId: string): string =>
  jwt.sign({ userId, sessionId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

const publicUser = (user: IUser) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar ?? null,
  level: user.level,
  learningGoal: user.learningGoal,
  dailyGoal: user.dailyGoal,
  timezone: user.timezone,
  bio: user.bio ?? '',
  onboardingCompleted: user.onboardingCompleted,
});

const createSessionTokens = async (user: IUser, context: SessionContext): Promise<TokenPair> => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  const session = await AuthSession.create({
    user: user._id,
    tokenHash: 'pending',
    userAgent: context.userAgent?.slice(0, 500) || 'Unknown device',
    ipAddress: context.ipAddress?.slice(0, 100) || 'Unknown',
    expiresAt,
  });
  const token = signAccessToken(user._id.toString(), user.role);
  const refreshToken = signRefreshToken(user._id.toString(), session._id.toString());
  session.tokenHash = hashToken(refreshToken);
  await session.save();
  return { token, refreshToken };
};

export const register = async (input: RegisterInput, context: SessionContext) => {
  if (await User.exists({ email: input.email })) throw ApiError.badRequest('Email already in use');
  const user = await User.create(input);
  return { user: publicUser(user), ...(await createSessionTokens(user, context)) };
};

export const login = async (input: LoginInput, context: SessionContext) => {
  const user = await User.findOne({ email: input.email, isActive: true }).select('+password');
  if (!user || !(await user.comparePassword(input.password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  return { user: publicUser(user), ...(await createSessionTokens(user, context)) };
};

export const refresh = async (incomingToken: string): Promise<TokenPair> => {
  let payload: RefreshPayload;
  try {
    payload = jwt.verify(incomingToken, env.JWT_REFRESH_SECRET) as RefreshPayload;
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const session = await AuthSession.findOne({
    _id: payload.sessionId,
    user: payload.userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).select('+tokenHash');
  if (!session || session.tokenHash !== hashToken(incomingToken)) {
    throw ApiError.unauthorized('Refresh session has been revoked');
  }
  const user = await User.findOne({ _id: payload.userId, isActive: true });
  if (!user) throw ApiError.unauthorized('User is no longer active');

  const token = signAccessToken(user._id.toString(), user.role);
  const refreshToken = signRefreshToken(user._id.toString(), session._id.toString());
  session.tokenHash = hashToken(refreshToken);
  session.lastUsedAt = new Date();
  await session.save();
  return { token, refreshToken };
};

const sessionIdFromToken = (refreshToken?: string): string | null => {
  if (!refreshToken) return null;
  const payload = jwt.decode(refreshToken) as Partial<RefreshPayload> | null;
  return payload?.sessionId ?? null;
};

export const logout = async (refreshToken?: string): Promise<void> => {
  const sessionId = sessionIdFromToken(refreshToken);
  if (sessionId) await AuthSession.findByIdAndUpdate(sessionId, { revokedAt: new Date() });
};

export const logoutAll = async (userId: string): Promise<void> => {
  await AuthSession.updateMany({ user: userId, revokedAt: null }, { revokedAt: new Date() });
};

export const listSessions = async (userId: string, currentRefreshToken?: string) => {
  const currentId = sessionIdFromToken(currentRefreshToken);
  const sessions = await AuthSession.find({ user: userId, revokedAt: null, expiresAt: { $gt: new Date() } })
    .sort({ lastUsedAt: -1 });
  return sessions.map((session) => ({
    id: session._id.toString(),
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    lastUsedAt: session.lastUsedAt,
    createdAt: session.createdAt,
    current: session._id.toString() === currentId,
  }));
};

export const revokeSession = async (userId: string, sessionId: string): Promise<void> => {
  const result = await AuthSession.updateOne(
    { _id: sessionId, user: userId, revokedAt: null },
    { revokedAt: new Date() }
  );
  if (!result.matchedCount) throw ApiError.notFound('Session not found');
};

export const getCurrentUser = async (userId: string) => {
  const user = await User.findOne({ _id: userId, isActive: true });
  if (!user) throw ApiError.notFound('User not found');
  return publicUser(user);
};
