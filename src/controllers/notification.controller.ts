import { NextFunction, Request, Response } from 'express';
import * as service from '../services/notification.service';
import { ApiResponse } from '../utils/ApiResponse';

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.list(req.user!.userId)); } catch (e) { next(e); } };
export const read = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { await service.markRead(req.user!.userId, req.params.id as string); ApiResponse.success(res, null); } catch (e) { next(e); } };
export const readAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { await service.markAllRead(req.user!.userId); ApiResponse.success(res, null); } catch (e) { next(e); } };
