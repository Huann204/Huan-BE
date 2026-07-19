import { NextFunction, Request, Response } from 'express';
import * as service from '../services/aiSkills.service';
import { ApiResponse } from '../utils/ApiResponse';

export const writingPrompt = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.writingPrompt(req.user!.userId, req.body)); } catch (error) { next(error); } };
export const speakingPrompt = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.speakingPrompt(req.user!.userId, req.body)); } catch (error) { next(error); } };
export const reviewSpeaking = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.reviewSpeaking(req.user!.userId, req.body)); } catch (error) { next(error); } };
export const conversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.conversation(req.user!.userId, req.body)); } catch (error) { next(error); } };
