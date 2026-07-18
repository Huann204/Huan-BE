import { NextFunction, Request, Response } from 'express';
import * as service from '../services/grammarAdmin.service';
import { ApiResponse } from '../utils/ApiResponse';

export const topics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.listTopics()); } catch(e) { next(e); } };
export const createTopic = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.created(res, await service.createTopic(req.body)); } catch(e) { next(e); } };
export const updateTopic = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.updateTopic(req.params.id as string, req.body)); } catch(e) { next(e); } };
export const archiveTopic = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.archiveTopic(req.params.id as string)); } catch(e) { next(e); } };
export const exercises = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.listExercises(req.params.topicId as string)); } catch(e) { next(e); } };
export const createExercise = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.created(res, await service.createExercise(req.body)); } catch(e) { next(e); } };
export const updateExercise = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.updateExercise(req.params.id as string, req.body)); } catch(e) { next(e); } };
export const archiveExercise = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.archiveExercise(req.params.id as string)); } catch(e) { next(e); } };
