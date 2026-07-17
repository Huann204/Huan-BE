import LearningProgress from '../models/learningProgress.model';
import User from '../models/user.model';
import type { EnglishLevel, IUser, LearningGoal } from '../types';
import { ApiError } from '../utils/ApiError';

export interface ProfileInput {
  name?: string;
  avatar?: string;
  level?: EnglishLevel;
  learningGoal?: LearningGoal;
  dailyGoal?: number;
  timezone?: string;
  bio?: string;
  onboardingCompleted?: boolean;
}

const publicProfile = (user: IUser | null) => {
  if (!user) throw ApiError.notFound('User not found');
  return {
    id: user._id.toString(), name: user.name, email: user.email, role: user.role,
    avatar: user.avatar ?? null, level: user.level, learningGoal: user.learningGoal,
    dailyGoal: user.dailyGoal, timezone: user.timezone, bio: user.bio ?? '',
    onboardingCompleted: user.onboardingCompleted, createdAt: user.createdAt,
  };
};

export const getProfile = async (userId: string) => publicProfile(await User.findById(userId));

export const updateProfile = async (userId: string, input: ProfileInput) => {
  const user = await User.findByIdAndUpdate(userId, input, { new: true, runValidators: true });
  if (!user) throw ApiError.notFound('User not found');
  if (input.dailyGoal) {
    await LearningProgress.findOneAndUpdate(
      { user: userId },
      { $set: { dailyGoal: input.dailyGoal }, $setOnInsert: { user: userId } },
      { upsert: true }
    );
  }
  return publicProfile(user);
};
