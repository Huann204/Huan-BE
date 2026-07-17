import { NextFunction, Request, Response } from 'express';
import * as profileService from '../services/profile.service';
import { ApiResponse } from '../utils/ApiResponse';

export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { ApiResponse.success(res, await profileService.getProfile(req.user!.userId)); }
  catch (error) { next(error); }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { ApiResponse.success(res, await profileService.updateProfile(req.user!.userId, req.body), 'Profile updated'); }
  catch (error) { next(error); }
};
