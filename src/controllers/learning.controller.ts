import { NextFunction, Request, Response } from 'express';
import * as learningService from '../services/learning.service';
import { ApiResponse } from '../utils/ApiResponse';

export const getTopics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    ApiResponse.success(res, await learningService.getTopics(req.user!.userId));
  } catch (error) {
    next(error);
  }
};

export const getTopicWords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    ApiResponse.success(
      res,
      await learningService.getTopicWords(req.user!.userId, req.params.slug as string)
    );
  } catch (error) {
    next(error);
  }
};

export const getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    ApiResponse.success(res, await learningService.getDashboard(req.user!.userId));
  } catch (error) {
    next(error);
  }
};

export const getReviewQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    ApiResponse.success(res, await learningService.getReviewQueue(req.user!.userId));
  } catch (error) {
    next(error);
  }
};

export const submitReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    ApiResponse.success(
      res,
      await learningService.reviewWord(req.user!.userId, req.body.wordId, req.body.rating),
      'Review saved'
    );
  } catch (error) {
    next(error);
  }
};

export const completeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    ApiResponse.created(
      res,
      await learningService.completeSession(req.user!.userId, req.body),
      'Practice session completed'
    );
  } catch (error) {
    next(error);
  }
};

export const setDailyGoal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    ApiResponse.success(
      res,
      await learningService.setDailyGoal(req.user!.userId, req.body.minutes),
      'Daily goal updated'
    );
  } catch (error) {
    next(error);
  }
};

export const getProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    ApiResponse.success(res, await learningService.getProgressReport(req.user!.userId));
  } catch (error) {
    next(error);
  }
};
