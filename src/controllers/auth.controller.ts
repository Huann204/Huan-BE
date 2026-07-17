import { NextFunction, Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { ApiResponse } from '../utils/ApiResponse';
import { env } from '../config/env';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/',
};

const sessionContext = (req: Request) => ({
  userAgent: req.get('user-agent'),
  ipAddress: req.ip,
});

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken, ...data } = await authService.register(req.body, sessionContext(req));
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    ApiResponse.created(res, data, 'Registered successfully');
  } catch (error) { next(error); }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken, ...data } = await authService.login(req.body, sessionContext(req));
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    ApiResponse.success(res, data, 'Login successful');
  } catch (error) { next(error); }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const incomingToken = req.cookies?.refreshToken as string | undefined;
    if (!incomingToken) {
      ApiResponse.unauthorized(res, 'No refresh token provided');
      return;
    }
    const tokens = await authService.refresh(incomingToken);
    res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
    ApiResponse.success(res, { token: tokens.token }, 'Token refreshed');
  } catch (error) { next(error); }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.logout(req.cookies?.refreshToken as string | undefined);
    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
    ApiResponse.success(res, null, 'Logged out successfully');
  } catch (error) { next(error); }
};

export const logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.logoutAll(req.user!.userId);
    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
    ApiResponse.success(res, null, 'Logged out on all devices');
  } catch (error) { next(error); }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    ApiResponse.success(res, await authService.getCurrentUser(req.user!.userId));
  } catch (error) { next(error); }
};

export const getSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    ApiResponse.success(
      res,
      await authService.listSessions(req.user!.userId, req.cookies?.refreshToken as string | undefined)
    );
  } catch (error) { next(error); }
};

export const revokeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.revokeSession(req.user!.userId, req.params.id as string);
    ApiResponse.success(res, null, 'Session revoked');
  } catch (error) { next(error); }
};
