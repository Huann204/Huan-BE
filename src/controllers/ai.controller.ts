import { NextFunction, Request, Response } from 'express';
import { generateWordSet } from '../services/gemini.service';
import { ApiResponse } from '../utils/ApiResponse';

export const createWordSet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    ApiResponse.created(res, await generateWordSet(req.user!.userId, req.body), 'AI word set created');
  } catch (error) {
    next(error);
  }
};
