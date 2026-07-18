import { Types } from 'mongoose';
import LearningProgress from '../models/learningProgress.model';
import User from '../models/user.model';
import WordSet, { IWordSet, WordSetVisibility } from '../models/wordSet.model';
import WordSetPractice from '../models/wordSetPractice.model';
import { ApiError } from '../utils/ApiError';

const ownerView = (owner: unknown) => {
  const value = owner as { _id?: Types.ObjectId; name?: string; avatar?: string | null };
  return { id: value?._id?.toString() ?? '', name: value?.name ?? 'Learner', avatar: value?.avatar ?? null };
};

const publicSet = (set: IWordSet, includeWords = false) => ({
  id: set._id.toString(),
  title: set.title,
  description: set.description,
  coverImageUrl: set.coverImageUrl ?? set.words[0]?.imageUrl ?? null,
  visibility: set.visibility,
  moderationStatus: set.moderationStatus,
  moderationNote: set.moderationNote,
  wordCount: set.words.length,
  copyCount: set.copyCount,
  practiceCount: set.practiceCount,
  sourceSetId: set.sourceSet?.toString() ?? null,
  owner: ownerView(set.owner),
  createdAt: set.createdAt,
  updatedAt: set.updatedAt,
  ...(includeWords ? { words: set.words } : {}),
});

const findOwned = async (userId: string, id: string) => {
  const set = await WordSet.findOne({ _id: id, owner: userId });
  if (!set) throw ApiError.notFound('Word set not found');
  return set;
};

export const mine = async (userId: string) => {
  const sets = await WordSet.find({ owner: userId }).populate('owner', 'name avatar').sort({ updatedAt: -1 });
  return sets.map((set) => publicSet(set));
};

export const discover = async (userId: string, query: string) => {
  const filter: Record<string, unknown> = {
    owner: { $ne: userId },
    visibility: 'public',
    moderationStatus: 'approved',
  };
  if (query.trim()) filter.$text = { $search: query.trim() };
  const sets = await WordSet.find(filter).populate('owner', 'name avatar').sort({ copyCount: -1, updatedAt: -1 }).limit(60);
  return sets.map((set) => publicSet(set));
};

export const detail = async (userId: string, id: string) => {
  const set = await WordSet.findById(id).populate('owner', 'name avatar');
  if (!set) throw ApiError.notFound('Word set not found');
  const isOwner = ownerView(set.owner).id === userId;
  const canViewPublic = set.visibility === 'public' && set.moderationStatus === 'approved';
  if (!isOwner && !canViewPublic) throw ApiError.forbidden('This word set is private');
  return { ...publicSet(set, true), isOwner };
};

export const create = async (userId: string, input: { title: string; description?: string; coverImageUrl?: string | null; visibility?: WordSetVisibility }) => {
  const visibility = input.visibility ?? 'private';
  const set = await WordSet.create({
    owner: userId,
    title: input.title,
    description: input.description ?? '',
    coverImageUrl: input.coverImageUrl || null,
    visibility,
    moderationStatus: visibility === 'public' ? 'pending' : 'not_required',
  });
  await set.populate('owner', 'name avatar');
  return publicSet(set, true);
};

export const update = async (userId: string, id: string, input: { title?: string; description?: string; coverImageUrl?: string | null; visibility?: WordSetVisibility }) => {
  const set = await findOwned(userId, id);
  if (input.title !== undefined) set.title = input.title;
  if (input.description !== undefined) set.description = input.description;
  if (input.coverImageUrl !== undefined) set.coverImageUrl = input.coverImageUrl || null;
  if (input.visibility !== undefined) set.visibility = input.visibility;
  if (set.visibility === 'private') {
    set.moderationStatus = 'not_required';
    set.moderationNote = '';
  } else {
    set.moderationStatus = 'pending';
    set.moderationNote = '';
  }
  await set.save();
  await set.populate('owner', 'name avatar');
  return publicSet(set, true);
};

export const remove = async (userId: string, id: string) => {
  const result = await WordSet.deleteOne({ _id: id, owner: userId });
  if (!result.deletedCount) throw ApiError.notFound('Word set not found');
  await WordSetPractice.deleteMany({ wordSet: id });
};

export const addWord = async (userId: string, id: string, input: Record<string, unknown>) => {
  const set = await findOwned(userId, id);
  if (set.words.length >= 500) throw ApiError.badRequest('A word set can contain at most 500 words');
  set.words.push({ ...input, order: set.words.length + 1 } as never);
  if (set.visibility === 'public') set.moderationStatus = 'pending';
  await set.save();
  return set.words.at(-1);
};

export const updateWord = async (userId: string, id: string, wordId: string, input: Record<string, unknown>) => {
  const set = await findOwned(userId, id);
  const word = set.words.id(wordId);
  if (!word) throw ApiError.notFound('Word not found');
  Object.assign(word, input);
  if (set.visibility === 'public') set.moderationStatus = 'pending';
  await set.save();
  return word;
};

export const removeWord = async (userId: string, id: string, wordId: string) => {
  const set = await findOwned(userId, id);
  const word = set.words.id(wordId);
  if (!word) throw ApiError.notFound('Word not found');
  word.deleteOne();
  if (set.visibility === 'public') set.moderationStatus = 'pending';
  await set.save();
};

export const copy = async (userId: string, id: string) => {
  const source = await WordSet.findOne({ _id: id, visibility: 'public', moderationStatus: 'approved' });
  if (!source) throw ApiError.notFound('Public word set not found');
  if (source.owner.toString() === userId) throw ApiError.badRequest('You already own this word set');
  const clone = await WordSet.create({
    owner: userId,
    title: `${source.title} (Copy)`,
    description: source.description,
    coverImageUrl: source.coverImageUrl,
    visibility: 'private',
    moderationStatus: 'not_required',
    sourceSet: source._id,
    words: source.words.map((word) => ({
      word: word.word, phonetic: word.phonetic, meaning: word.meaning,
      example: word.example, exampleMeaning: word.exampleMeaning,
      imageUrl: word.imageUrl, order: word.order,
    })),
  });
  source.copyCount += 1;
  await source.save();
  await clone.populate('owner', 'name avatar');
  return publicSet(clone, true);
};

export const completePractice = async (userId: string, id: string, input: { mode: 'flashcard' | 'quiz'; correct: number; total: number }) => {
  const set = await WordSet.findById(id);
  if (!set) throw ApiError.notFound('Word set not found');
  const canAccess = set.owner.toString() === userId || (set.visibility === 'public' && set.moderationStatus === 'approved');
  if (!canAccess) throw ApiError.forbidden('This word set is private');
  const xpEarned = Math.max(1, input.correct * 5);
  await Promise.all([
    WordSetPractice.create({ user: userId, wordSet: id, ...input }),
    WordSet.updateOne({ _id: id }, { $inc: { practiceCount: 1 } }),
    LearningProgress.findOneAndUpdate({ user: userId }, { $inc: { xp: xpEarned, sessions: 1 } }, { upsert: true, setDefaultsOnInsert: true }),
  ]);
  return { xpEarned };
};

export const moderationQueue = async (status: string) => {
  const allowed = ['pending', 'approved', 'rejected'];
  const moderationStatus = allowed.includes(status) ? status : 'pending';
  const sets = await WordSet.find({ visibility: 'public', moderationStatus }).populate('owner', 'name avatar email').sort({ updatedAt: 1 }).limit(100);
  return sets.map((set) => publicSet(set, true));
};

export const moderate = async (adminId: string, id: string, action: 'approve' | 'reject', note?: string) => {
  const set = await WordSet.findOne({ _id: id, visibility: 'public' });
  if (!set) throw ApiError.notFound('Public word set not found');
  set.moderationStatus = action === 'approve' ? 'approved' : 'rejected';
  set.moderationNote = note ?? '';
  await set.save();
  const admin = await User.findById(adminId);
  return { id: set._id.toString(), moderationStatus: set.moderationStatus, moderatedBy: admin?.name ?? 'Admin' };
};
