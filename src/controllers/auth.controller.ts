import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { ApiResponse } from '../utils/ApiResponse';
import { env } from '../config/env';

// sameSite: 'none' + secure: true required for cross-domain cookies on production
// (frontend and backend on different Vercel domains)
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày
  path: '/',
};

// POST /auth/register
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken, ...data } = await authService.register(req.body);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    ApiResponse.created(res, data, 'Registered successfully');
  } catch (err) {
    next(err);
  }
};

// POST /auth/login
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken, ...data } = await authService.login(req.body);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    ApiResponse.success(res, data, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// POST /auth/refresh
export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const incomingToken = req.cookies?.refreshToken as string | undefined;
    if (!incomingToken) {
      res.status(401).json({ success: false, message: 'No refresh token provided' });
      return;
    }

    const tokens = await authService.refresh(incomingToken);
    res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
    ApiResponse.success(res, { token: tokens.token }, 'Token refreshed');
  } catch (err) {
    next(err);
  }
};

// POST /auth/logout
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.userId) {
      await authService.logout(req.user.userId);
    }
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
    });
    ApiResponse.success(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

// GET /auth/me
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, role } = req.user!;
    ApiResponse.success(res, { id: userId, role });
  } catch (err) {
    next(err);
  }
};
