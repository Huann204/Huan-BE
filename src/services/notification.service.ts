import Notification from '../models/notification.model';
import { ApiError } from '../utils/ApiError';

export const createNotification = (input: {
  user: string; actor?: string; type: 'friend_request' | 'friend_accepted' | 'challenge_invite' | 'challenge_accepted' | 'system';
  title: { vi: string; en: string }; message: { vi: string; en: string }; link?: string;
}) => Notification.create(input);

export const list = async (userId: string) => {
  const [items, unread] = await Promise.all([
    Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(50),
    Notification.countDocuments({ user: userId, readAt: null }),
  ]);
  return { unread, items: items.map((item) => ({ id: item._id.toString(), type: item.type, title: item.title, message: item.message, link: item.link ?? null, readAt: item.readAt, createdAt: item.createdAt })) };
};

export const markRead = async (userId: string, id: string) => {
  const result = await Notification.updateOne({ _id: id, user: userId }, { readAt: new Date() });
  if (!result.matchedCount) throw ApiError.notFound('Notification not found');
};

export const markAllRead = (userId: string) => Notification.updateMany({ user: userId, readAt: null }, { readAt: new Date() });
