import { NextFunction, Request, Response } from 'express';
import { chat } from '../services/aiTutor.service';
import { ApiResponse } from '../utils/ApiResponse';

export const sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    ApiResponse.success(res, await chat(req.user!.userId, req.body.message, req.body.history ?? []));
  } catch (error) {
    next(error);
  }
};
