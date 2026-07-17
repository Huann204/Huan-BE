import VocabularyTopic from '../models/vocabularyTopic.model';
import VocabularyWord from '../models/vocabularyWord.model';
import { ApiError } from '../utils/ApiError';
import { ensureLearningContent } from './learning.service';

export const listContent = async () => {
  await ensureLearningContent();
  const topics = await VocabularyTopic.find().sort({ order: 1 });
  return Promise.all(topics.map(async (topic) => ({
    id: topic._id.toString(), slug: topic.slug, title: topic.title, description: topic.description,
    emoji: topic.emoji, color: topic.color, order: topic.order, isPublished: topic.isPublished,
    wordCount: await VocabularyWord.countDocuments({ topic: topic._id }),
  })));
};

export const createTopic = (input: Record<string, unknown>) => VocabularyTopic.create(input);

export const updateTopic = async (id: string, input: Record<string, unknown>) => {
  const topic = await VocabularyTopic.findByIdAndUpdate(id, input, { new: true, runValidators: true });
  if (!topic) throw ApiError.notFound('Topic not found');
  return topic;
};

export const archiveTopic = async (id: string) => {
  const topic = await VocabularyTopic.findByIdAndUpdate(id, { isPublished: false }, { new: true });
  if (!topic) throw ApiError.notFound('Topic not found');
  await VocabularyWord.updateMany({ topic: id }, { isPublished: false });
  return topic;
};

export const listWords = async (topicId: string) =>
  VocabularyWord.find({ topic: topicId }).sort({ order: 1 });

export const createWord = async (input: Record<string, unknown>) => VocabularyWord.create(input);

export const updateWord = async (id: string, input: Record<string, unknown>) => {
  const word = await VocabularyWord.findByIdAndUpdate(id, input, { new: true, runValidators: true });
  if (!word) throw ApiError.notFound('Word not found');
  return word;
};

export const archiveWord = async (id: string) => {
  const word = await VocabularyWord.findByIdAndUpdate(id, { isPublished: false }, { new: true });
  if (!word) throw ApiError.notFound('Word not found');
  return word;
};

interface ImportWord {
  topicSlug: string; slug: string; word: string; phonetic?: string;
  meaning: { vi: string; en: string }; example?: string; exampleMeaning?: string; emoji?: string; order?: number;
}

export const importWords = async (items: ImportWord[]) => {
  const topics = await VocabularyTopic.find({ slug: { $in: [...new Set(items.map((item) => item.topicSlug))] } });
  const topicIds = new Map(topics.map((topic) => [topic.slug, topic._id]));
  const valid = items.filter((item) => topicIds.has(item.topicSlug));
  if (!valid.length) throw ApiError.badRequest('No valid topic slugs found');
  const result = await VocabularyWord.bulkWrite(valid.map(({ topicSlug, ...item }) => ({
    updateOne: {
      filter: { topic: topicIds.get(topicSlug), word: item.word },
      update: { $set: { ...item, topic: topicIds.get(topicSlug), phonetic: item.phonetic ?? '', example: item.example ?? '', exampleMeaning: item.exampleMeaning ?? '', emoji: item.emoji ?? 'đŸ“', isPublished: true } },
      upsert: true,
    },
  })));
  return { processed: valid.length, upserted: result.upsertedCount, updated: result.modifiedCount };
};


