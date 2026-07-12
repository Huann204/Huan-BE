import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { ApiResponse } from '../utils/ApiResponse';
import { PaginationQuery } from '../types';

// GET /users
export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query: PaginationQuery = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      sort: req.query.sort as string,
      order: req.query.order as 'asc' | 'desc',
    };
    const { users, meta } = await userService.findAll(query);
    ApiResponse.success(res, users, 'Users retrieved', 200, meta);
  } catch (err) {
    next(err);
  }
};

// GET /users/:id
export const getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.findById(req.params.id as string);
    ApiResponse.success(res, user);
  } catch (err) {
    next(err);
  }
};

// POST /users
export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.create(req.body);
    ApiResponse.created(res, user);
  } catch (err) {
    next(err);
  }
};

// PATCH /users/:id
export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.update(req.params.id as string, req.body);
    ApiResponse.success(res, user, 'User updated');
  } catch (err) {
    next(err);
  }
};

// DELETE /users/:id
export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await userService.remove(req.params.id as string);
    ApiResponse.success(res, null, 'User deleted');
  } catch (err) {
    next(err);
  }
};
