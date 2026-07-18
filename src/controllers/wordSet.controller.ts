import { NextFunction, Request, Response } from 'express';
import * as service from '../services/wordSet.service';
import { ApiResponse } from '../utils/ApiResponse';

export const mine = async (req: Request, res: Response, next: NextFunction) => { try { ApiResponse.success(res, await service.mine(req.user!.userId)); } catch (e) { next(e); } };
export const discover = async (req: Request, res: Response, next: NextFunction) => { try { ApiResponse.success(res, await service.discover(req.user!.userId, String(req.query.q ?? ''))); } catch (e) { next(e); } };
export const detail = async (req: Request, res: Response, next: NextFunction) => { try { ApiResponse.success(res, await service.detail(req.user!.userId, req.params.id as string)); } catch (e) { next(e); } };
export const create = async (req: Request, res: Response, next: NextFunction) => { try { ApiResponse.created(res, await service.create(req.user!.userId, req.body)); } catch (e) { next(e); } };
export const update = async (req: Request, res: Response, next: NextFunction) => { try { ApiResponse.success(res, await service.update(req.user!.userId, req.params.id as string, req.body)); } catch (e) { next(e); } };
export const remove = async (req: Request, res: Response, next: NextFunction) => { try { await service.remove(req.user!.userId, req.params.id as string); ApiResponse.success(res, null); } catch (e) { next(e); } };
export const addWord = async (req: Request, res: Response, next: NextFunction) => { try { ApiResponse.created(res, await service.addWord(req.user!.userId, req.params.id as string, req.body)); } catch (e) { next(e); } };
export const updateWord = async (req: Request, res: Response, next: NextFunction) => { try { ApiResponse.success(res, await service.updateWord(req.user!.userId, req.params.id as string, req.params.wordId as string, req.body)); } catch (e) { next(e); } };
export const removeWord = async (req: Request, res: Response, next: NextFunction) => { try { await service.removeWord(req.user!.userId, req.params.id as string, req.params.wordId as string); ApiResponse.success(res, null); } catch (e) { next(e); } };
export const copy = async (req: Request, res: Response, next: NextFunction) => { try { ApiResponse.created(res, await service.copy(req.user!.userId, req.params.id as string)); } catch (e) { next(e); } };
export const completePractice = async (req: Request, res: Response, next: NextFunction) => { try { ApiResponse.created(res, await service.completePractice(req.user!.userId, req.params.id as string, req.body)); } catch (e) { next(e); } };
export const moderationQueue = async (req: Request, res: Response, next: NextFunction) => { try { ApiResponse.success(res, await service.moderationQueue(String(req.query.status ?? 'pending'))); } catch (e) { next(e); } };
export const moderate = async (req: Request, res: Response, next: NextFunction) => { try { ApiResponse.success(res, await service.moderate(req.user!.userId, req.params.id as string, req.body.action, req.body.note)); } catch (e) { next(e); } };
