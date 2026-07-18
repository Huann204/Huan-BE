import { NextFunction, Request, Response } from 'express';
import * as service from '../services/engagement.service';
import { ApiResponse } from '../utils/ApiResponse';

export const summary = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.getSummary(req.user!.userId)); } catch (e) { next(e); } };
export const claim = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.claimDailyReward(req.user!.userId), 'Daily reward claimed'); } catch (e) { next(e); } };
export const leaderboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { const period = (req.query.period ?? 'week') as 'week' | 'month' | 'all'; ApiResponse.success(res, await service.getLeaderboard(period, req.user!.userId)); } catch (e) { next(e); } };
