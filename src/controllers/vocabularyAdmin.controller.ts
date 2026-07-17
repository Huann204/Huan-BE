import { NextFunction, Request, Response } from 'express';
import * as service from '../services/vocabularyAdmin.service';
import { ApiResponse } from '../utils/ApiResponse';

export const listContent = async (_req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.listContent()); } catch (e) { next(e); } };
export const createTopic = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.created(res, await service.createTopic(req.body)); } catch (e) { next(e); } };
export const updateTopic = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.updateTopic(req.params.id as string, req.body)); } catch (e) { next(e); } };
export const archiveTopic = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.archiveTopic(req.params.id as string)); } catch (e) { next(e); } };
export const listWords = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.listWords(req.params.topicId as string)); } catch (e) { next(e); } };
export const createWord = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.created(res, await service.createWord(req.body)); } catch (e) { next(e); } };
export const updateWord = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.updateWord(req.params.id as string, req.body)); } catch (e) { next(e); } };
export const archiveWord = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.archiveWord(req.params.id as string)); } catch (e) { next(e); } };
export const importWords = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.importWords(req.body.items), 'Vocabulary imported'); } catch (e) { next(e); } };
