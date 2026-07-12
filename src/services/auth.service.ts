import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import type { IUser } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenPair {
  token: string;
  refreshToken: string;
}

export interface AuthPayload {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  token: string;
  refreshToken: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const signToken = (userId: string, role: string): string =>
  jwt.sign({ userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

const signRefreshToken = (userId: string): string =>
  jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

const buildAuthPayload = (user: IUser, tokens: TokenPair): AuthPayload => ({
  user: {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  },
  token: tokens.token,
  refreshToken: tokens.refreshToken,
});

// ─── Register ─────────────────────────────────────────────────────────────────

export const register = async (input: RegisterInput): Promise<AuthPayload> => {
  const existing = await User.findOne({ email: input.email });
  if (existing) throw ApiError.badRequest('Email already in use');

  const user = await User.create({
    name: input.name,
    email: input.email,
    password: input.password,
  });

  const token = signToken(user._id.toString(), user.role);
  const refreshToken = signRefreshToken(user._id.toString());

  // Lưu refresh token vào DB
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return buildAuthPayload(user, { token, refreshToken });
};

// ─── Login ────────────────────────────────────────────────────────────────────

export const login = async (input: LoginInput): Promise<AuthPayload> => {
  // select('+password +refreshToken') vì cả hai đều có select: false
  const user = await User.findOne({ email: input.email, isActive: true }).select(
    '+password +refreshToken'
  );

  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const isMatch = await user.comparePassword(input.password);
  if (!isMatch) throw ApiError.unauthorized('Invalid email or password');

  const token = signToken(user._id.toString(), user.role);
  const refreshToken = signRefreshToken(user._id.toString());

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return buildAuthPayload(user, { token, refreshToken });
};

// ─── Refresh token ────────────────────────────────────────────────────────────

export const refresh = async (incomingRefreshToken: string): Promise<TokenPair> => {
  let payload: { userId: string };

  try {
    payload = jwt.verify(incomingRefreshToken, env.JWT_REFRESH_SECRET) as { userId: string };
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(payload.userId).select('+refreshToken');
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw ApiError.unauthorized('Refresh token has been revoked');
  }

  const token = signToken(user._id.toString(), user.role);
  const refreshToken = signRefreshToken(user._id.toString());

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { token, refreshToken };
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logout = async (userId: string): Promise<void> => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};
