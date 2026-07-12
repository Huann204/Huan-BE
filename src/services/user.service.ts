import User from '../models/user.model';
import { IUser, PaginationMeta, PaginationQuery } from '../types';
import { ApiError } from '../utils/ApiError';

// ─── Get all users (paginated) ────────────────────────────────────────────────
export const findAll = async (
  query: PaginationQuery
): Promise<{ users: IUser[]; meta: PaginationMeta }> => {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 10));
  const skip = (page - 1) * limit;

  const sortField = query.sort || 'createdAt';
  const sortOrder = query.order === 'asc' ? 1 : -1;

  const [users, total] = await Promise.all([
    User.find({ isActive: true })
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit),
    User.countDocuments({ isActive: true }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    users,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

// ─── Get one by ID ────────────────────────────────────────────────────────────
export const findById = async (id: string): Promise<IUser> => {
  const user = await User.findById(id);
  if (!user || !user.isActive) throw ApiError.notFound('User not found');
  return user;
};

// ─── Get one by email (includes password for auth) ────────────────────────────
export const findByEmail = async (email: string): Promise<IUser | null> => {
  return User.findOne({ email, isActive: true }).select('+password');
};

// ─── Create ───────────────────────────────────────────────────────────────────
export const create = async (
  data: Pick<IUser, 'name' | 'email' | 'password' | 'role'>
): Promise<IUser> => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw ApiError.badRequest('Email already in use');
  return User.create(data);
};

// ─── Update ───────────────────────────────────────────────────────────────────
export const update = async (
  id: string,
  data: Partial<Pick<IUser, 'name' | 'avatar'>>
): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

// ─── Soft delete ──────────────────────────────────────────────────────────────
export const remove = async (id: string): Promise<void> => {
  const user = await User.findByIdAndUpdate(id, { isActive: false });
  if (!user) throw ApiError.notFound('User not found');
};
