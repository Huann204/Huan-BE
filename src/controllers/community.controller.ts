import { NextFunction, Request, Response } from 'express';
import * as service from '../services/community.service';
import { ApiResponse } from '../utils/ApiResponse';

export const search = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.searchUsers(req.user!.userId, String(req.query.q ?? ''))); } catch (e) { next(e); } };
export const network = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.getNetwork(req.user!.userId)); } catch (e) { next(e); } };
export const requestFriend = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.created(res, await service.sendFriendRequest(req.user!.userId, req.body.userId)); } catch (e) { next(e); } };
export const respondFriend = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.respondFriendRequest(req.user!.userId, req.params.id as string, req.body.action)); } catch (e) { next(e); } };
export const removeFriend = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { await service.removeFriend(req.user!.userId, req.params.id as string); ApiResponse.success(res, null); } catch (e) { next(e); } };
export const challenges = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.listChallenges(req.user!.userId)); } catch (e) { next(e); } };
export const createChallenge = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.created(res, await service.createChallenge(req.user!.userId, req.body.opponentId, req.body.targetXp)); } catch (e) { next(e); } };
export const respondChallenge = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try { ApiResponse.success(res, await service.respondChallenge(req.user!.userId, req.params.id as string, req.body.action)); } catch (e) { next(e); } };
