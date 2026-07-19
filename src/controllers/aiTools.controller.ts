import { NextFunction, Request, Response } from 'express';
import * as service from '../services/aiTools.service';
import { ApiResponse } from '../utils/ApiResponse';

export const writing = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.checkWriting(req.user!.userId, req.body)); } catch (error) { next(error); } };
export const vocabulary = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.explainVocabulary(req.user!.userId, req.body)); } catch (error) { next(error); } };
export const exercises = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.created(res, await service.generateExercises(req.user!.userId, req.body)); } catch (error) { next(error); } };
export const submitExercises = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.submitExercises(req.user!.userId, req.params.id as string, req.body.answers)); } catch (error) { next(error); } };
