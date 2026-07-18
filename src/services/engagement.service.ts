import { Types } from 'mongoose';
import DailyReward from '../models/dailyReward.model';
import LearningProgress from '../models/learningProgress.model';
import PracticeSession from '../models/practiceSession.model';
import { ApiError } from '../utils/ApiError';

const dateKey = (date = new Date()) => date.toISOString().slice(0, 10);
const startOfDay = (date = new Date()) => { const value = new Date(date); value.setHours(0, 0, 0, 0); return value; };

const getProgress = (userId: string) => LearningProgress.findOneAndUpdate(
  { user: new Types.ObjectId(userId) },
  { $setOnInsert: { user: new Types.ObjectId(userId) } },
  { new: true, upsert: true, setDefaultsOnInsert: true }
);

export const getSummary = async (userId: string) => {
  const since = startOfDay(); since.setDate(since.getDate() - 13);
  const [progress, sessions, claimed] = await Promise.all([
    getProgress(userId),
    PracticeSession.find({ user: userId, completedAt: { $gte: since } }).sort({ completedAt: 1 }),
    DailyReward.exists({ user: userId, date: dateKey() }),
  ]);
  const activity = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(since); date.setDate(date.getDate() + index);
    const key = dateKey(date);
    const daySessions = sessions.filter((session) => dateKey(session.completedAt) === key);
    return { date: key, minutes: daySessions.reduce((sum, item) => sum + item.minutes, 0), xp: daySessions.reduce((sum, item) => sum + item.xpEarned, 0), sessions: daySessions.length };
  });
  const today = activity.at(-1)!;
  const perfectSession = sessions.some((session) => session.correct === session.total);
  const achievementRules = [
    { id: 'first-step', icon: '🌱', title: { vi: 'Bước đầu tiên', en: 'First step' }, description: { vi: 'Hoàn thành buổi học đầu tiên', en: 'Complete your first session' }, unlocked: progress.sessions >= 1 },
    { id: 'three-day-streak', icon: '🔥', title: { vi: 'Bền bỉ 3 ngày', en: 'Three-day streak' }, description: { vi: 'Duy trì chuỗi học 3 ngày', en: 'Maintain a 3-day streak' }, unlocked: progress.streak >= 3 },
    { id: 'word-builder', icon: '🧠', title: { vi: 'Xây vốn từ', en: 'Word builder' }, description: { vi: 'Bắt đầu học 20 từ', en: 'Start learning 20 words' }, unlocked: progress.words.length >= 20 },
    { id: 'perfect-score', icon: '🎯', title: { vi: 'Điểm tuyệt đối', en: 'Perfect score' }, description: { vi: 'Hoàn thành một lượt không sai', en: 'Finish a session without mistakes' }, unlocked: perfectSession },
    { id: 'ten-sessions', icon: '🏅', title: { vi: 'Người học chăm chỉ', en: 'Dedicated learner' }, description: { vi: 'Hoàn thành 10 buổi học', en: 'Complete 10 sessions' }, unlocked: progress.sessions >= 10 },
    { id: 'five-hundred-xp', icon: '⚡', title: { vi: '500 XP', en: '500 XP' }, description: { vi: 'Tích lũy 500 điểm', en: 'Earn 500 experience points' }, unlocked: progress.xp >= 500 },
  ];
  return {
    activity,
    dailyChallenge: { targetMinutes: progress.dailyGoal, currentMinutes: today.minutes, completed: today.minutes >= progress.dailyGoal, claimed: Boolean(claimed), rewardXp: 25 },
    achievements: achievementRules,
    unlockedCount: achievementRules.filter((item) => item.unlocked).length,
    totalAchievements: achievementRules.length,
  };
};

export const claimDailyReward = async (userId: string) => {
  const progress = await getProgress(userId);
  const todayMinutesResult = await PracticeSession.aggregate<{ minutes: number }>([
    { $match: { user: new Types.ObjectId(userId), completedAt: { $gte: startOfDay() } } },
    { $group: { _id: null, minutes: { $sum: '$minutes' } } },
  ]);
  const minutes = todayMinutesResult[0]?.minutes ?? 0;
  if (minutes < progress.dailyGoal) throw ApiError.badRequest('Daily challenge is not complete');
  try {
    await DailyReward.create({ user: userId, date: dateKey(), xpAwarded: 25 });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) throw ApiError.badRequest('Reward already claimed');
    throw error;
  }
  progress.xp += 25;
  await progress.save();
  return { xpAwarded: 25, totalXp: progress.xp };
};

const periodStart = (period: 'week' | 'month' | 'all') => {
  if (period === 'all') return new Date(0);
  const value = startOfDay();
  value.setDate(value.getDate() - (period === 'week' ? 6 : 29));
  return value;
};

export const getLeaderboard = async (period: 'week' | 'month' | 'all', userId: string) => {
  const rows = await PracticeSession.aggregate<{
    _id: Types.ObjectId; xp: number; minutes: number; sessions: number; correct: number; total: number;
    user: Array<{ name: string; avatar?: string; level?: string; isActive: boolean }>;
  }>([
    { $match: { completedAt: { $gte: periodStart(period) } } },
    { $group: { _id: '$user', xp: { $sum: '$xpEarned' }, minutes: { $sum: '$minutes' }, sessions: { $sum: 1 }, correct: { $sum: '$correct' }, total: { $sum: '$total' } } },
    { $sort: { xp: -1, minutes: -1 } },
    { $limit: 100 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $match: { 'user.0.isActive': true } },
  ]);
  return rows.map((row, index) => {
    const account = row.user[0];
    const parts = account.name.trim().split(/\s+/);
    const displayName = parts.length > 1 ? `${parts[0]} ${parts.at(-1)?.[0]}.` : parts[0];
    return { rank: index + 1, userId: row._id.toString(), displayName, avatar: account.avatar ?? null, level: account.level ?? 'A0', xp: row.xp, minutes: row.minutes, sessions: row.sessions, accuracy: row.total ? Math.round((row.correct / row.total) * 100) : 0, currentUser: row._id.toString() === userId };
  });
};
