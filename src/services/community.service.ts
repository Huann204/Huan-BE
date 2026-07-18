import { Types } from 'mongoose';
import Friendship from '../models/friendship.model';
import PeerChallenge from '../models/peerChallenge.model';
import PracticeSession from '../models/practiceSession.model';
import User from '../models/user.model';
import { ApiError } from '../utils/ApiError';
import { createNotification } from './notification.service';

const publicUser = (user: { _id: Types.ObjectId; name: string; avatar?: string; level?: string }) => {
  const parts = user.name.trim().split(/\s+/);
  return { id: user._id.toString(), displayName: parts.length > 1 ? `${parts[0]} ${parts.at(-1)?.[0]}.` : parts[0], avatar: user.avatar ?? null, level: user.level ?? 'A0' };
};
const safePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const searchUsers = async (userId: string, query: string) => {
  if (query.trim().length < 2) return [];
  const users = await User.find({ _id: { $ne: userId }, isActive: true, name: { $regex: safePattern(query.trim()), $options: 'i' } }).limit(12);
  return users.map(publicUser);
};

const relationQuery = (first: string, second: string) => ({ $or: [{ requester: first, recipient: second }, { requester: second, recipient: first }] });
const challengeQuery = (first: string, second: string) => ({ $or: [{ creator: first, opponent: second }, { creator: second, opponent: first }] });

export const sendFriendRequest = async (userId: string, recipientId: string) => {
  if (userId === recipientId) throw ApiError.badRequest('You cannot add yourself');
  const [recipient, existing, sender] = await Promise.all([User.findOne({ _id: recipientId, isActive: true }), Friendship.findOne(relationQuery(userId, recipientId)), User.findById(userId)]);
  if (!recipient) throw ApiError.notFound('User not found');
  if (existing && existing.status !== 'rejected') throw ApiError.badRequest('A friend relationship already exists');
  const friendship = existing
    ? await Friendship.findByIdAndUpdate(existing._id, { requester: userId, recipient: recipientId, status: 'pending' }, { new: true })
    : await Friendship.create({ requester: userId, recipient: recipientId });
  await createNotification({ user: recipientId, actor: userId, type: 'friend_request', title: { vi: 'Lời mời kết bạn', en: 'Friend request' }, message: { vi: `${sender?.name ?? 'Một người học'} muốn kết bạn với bạn.`, en: `${sender?.name ?? 'A learner'} wants to connect with you.` }, link: '/community' });
  return { id: friendship!._id.toString(), status: friendship!.status };
};

export const respondFriendRequest = async (userId: string, friendshipId: string, action: 'accept' | 'reject') => {
  const friendship = await Friendship.findOne({ _id: friendshipId, recipient: userId, status: 'pending' });
  if (!friendship) throw ApiError.notFound('Friend request not found');
  friendship.status = action === 'accept' ? 'accepted' : 'rejected';
  await friendship.save();
  if (action === 'accept') {
    const user = await User.findById(userId);
    await createNotification({ user: friendship.requester.toString(), actor: userId, type: 'friend_accepted', title: { vi: 'Đã chấp nhận lời mời', en: 'Friend request accepted' }, message: { vi: `${user?.name ?? 'Người học'} đã chấp nhận lời mời của bạn.`, en: `${user?.name ?? 'A learner'} accepted your request.` }, link: '/community' });
  }
  return { id: friendship._id.toString(), status: friendship.status };
};

export const removeFriend = async (userId: string, friendshipId: string) => {
  const result = await Friendship.deleteOne({ _id: friendshipId, $or: [{ requester: userId }, { recipient: userId }] });
  if (!result.deletedCount) throw ApiError.notFound('Friendship not found');
};

export const getNetwork = async (userId: string) => {
  const relations = await Friendship.find({ $or: [{ requester: userId }, { recipient: userId }] }).sort({ updatedAt: -1 });
  const userIds = [...new Set(relations.flatMap((item) => [item.requester.toString(), item.recipient.toString()]).filter((id) => id !== userId))];
  const users = await User.find({ _id: { $in: userIds }, isActive: true });
  const byId = new Map(users.map((user) => [user._id.toString(), publicUser(user)]));
  const other = (relation: typeof relations[number]) => byId.get(relation.requester.toString() === userId ? relation.recipient.toString() : relation.requester.toString());
  return {
    friends: relations.filter((item) => item.status === 'accepted').flatMap((item) => { const user = other(item); return user ? [{ friendshipId: item._id.toString(), ...user }] : []; }),
    incoming: relations.filter((item) => item.status === 'pending' && item.recipient.toString() === userId).flatMap((item) => { const user = other(item); return user ? [{ friendshipId: item._id.toString(), ...user }] : []; }),
    outgoing: relations.filter((item) => item.status === 'pending' && item.requester.toString() === userId).flatMap((item) => { const user = other(item); return user ? [{ friendshipId: item._id.toString(), ...user }] : []; }),
  };
};

export const createChallenge = async (userId: string, opponentId: string, targetXp: number) => {
  const friendship = await Friendship.findOne({ ...relationQuery(userId, opponentId), status: 'accepted' });
  if (!friendship) throw ApiError.badRequest('You can only challenge a friend');
  if (await PeerChallenge.exists({ ...challengeQuery(userId, opponentId), status: { $in: ['pending', 'active'] } })) throw ApiError.badRequest('An active challenge already exists');
  const endsAt = new Date(); endsAt.setDate(endsAt.getDate() + 7);
  const challenge = await PeerChallenge.create({ creator: userId, opponent: opponentId, targetXp, endsAt });
  const creator = await User.findById(userId);
  await createNotification({ user: opponentId, actor: userId, type: 'challenge_invite', title: { vi: 'Thử thách XP mới', en: 'New XP challenge' }, message: { vi: `${creator?.name ?? 'Một người bạn'} thách bạn đạt ${targetXp} XP.`, en: `${creator?.name ?? 'A friend'} challenged you to earn ${targetXp} XP.` }, link: '/community' });
  return { id: challenge._id.toString(), status: challenge.status };
};

export const respondChallenge = async (userId: string, id: string, action: 'accept' | 'decline') => {
  const challenge = await PeerChallenge.findOne({ _id: id, opponent: userId, status: 'pending' });
  if (!challenge) throw ApiError.notFound('Challenge not found');
  challenge.status = action === 'accept' ? 'active' : 'declined';
  if (action === 'accept') { challenge.startsAt = new Date(); challenge.endsAt = new Date(Date.now() + 7 * 86400000); }
  await challenge.save();
  if (action === 'accept') await createNotification({ user: challenge.creator.toString(), actor: userId, type: 'challenge_accepted', title: { vi: 'Thử thách đã bắt đầu', en: 'Challenge started' }, message: { vi: 'Bạn của bạn đã chấp nhận thử thách XP.', en: 'Your friend accepted the XP challenge.' }, link: '/community' });
  return { id: challenge._id.toString(), status: challenge.status };
};

export const listChallenges = async (userId: string) => {
  const challenges = await PeerChallenge.find({ $or: [{ creator: userId }, { opponent: userId }], status: { $in: ['pending', 'active'] } }).sort({ createdAt: -1 }).limit(20);
  return Promise.all(challenges.map(async (challenge) => {
    const ids = [challenge.creator, challenge.opponent];
    const [users, scores] = await Promise.all([
      User.find({ _id: { $in: ids } }),
      PracticeSession.aggregate<{ _id: Types.ObjectId; xp: number }>([{ $match: { user: { $in: ids }, completedAt: { $gte: challenge.startsAt, $lte: challenge.endsAt } } }, { $group: { _id: '$user', xp: { $sum: '$xpEarned' } } }]),
    ]);
    const userMap = new Map(users.map((user) => [user._id.toString(), publicUser(user)]));
    const scoreMap = new Map(scores.map((score) => [score._id.toString(), score.xp]));
    return { id: challenge._id.toString(), status: challenge.status, targetXp: challenge.targetXp, startsAt: challenge.startsAt, endsAt: challenge.endsAt, creator: { ...userMap.get(challenge.creator.toString())!, xp: scoreMap.get(challenge.creator.toString()) ?? 0 }, opponent: { ...userMap.get(challenge.opponent.toString())!, xp: scoreMap.get(challenge.opponent.toString()) ?? 0 }, canRespond: challenge.opponent.toString() === userId && challenge.status === 'pending' };
  }));
};


