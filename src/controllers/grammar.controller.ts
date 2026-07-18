import { NextFunction, Request, Response } from 'express';
import * as service from '../services/grammar.service';
import { ApiResponse } from '../utils/ApiResponse';

export const topics = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.getTopics(req.user!.userId)); } catch (e) { next(e); } };
export const topic = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.getTopic(req.user!.userId, req.params.slug as string)); } catch (e) { next(e); } };
export const answer = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.submitAnswer(req.user!.userId, req.body.exerciseId, req.body.answer)); } catch (e) { next(e); } };
export const mistakes = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.getMistakes(req.user!.userId)); } catch (e) { next(e); } };
