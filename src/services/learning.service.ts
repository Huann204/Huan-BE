import { Types } from 'mongoose';
import { learningTopics, learningWords } from '../data/learningSeed';
import { topicImage } from '../data/vocabularyImages';
import LearningProgress, { IWordProgress } from '../models/learningProgress.model';
import PracticeSession from '../models/practiceSession.model';
import VocabularyTopic from '../models/vocabularyTopic.model';
import VocabularyWord, { IVocabularyWord } from '../models/vocabularyWord.model';
import { ApiError } from '../utils/ApiError';

export type ReviewRating = 'again' | 'hard' | 'good';

const startOfToday = (): Date => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const dateKey = (date: Date): string => date.toISOString().slice(0, 10);

const publicWord = (word: IVocabularyWord, fallbackImageUrl: string | null = null) => ({
  id: word._id.toString(),
  topicId: word.topic.toString(),
  slug: word.slug,
  word: word.word,
  phonetic: word.phonetic,
  meaning: word.meaning,
  example: word.example,
  exampleMeaning: word.exampleMeaning,
  emoji: word.emoji,
  imageUrl: word.imageUrl || fallbackImageUrl,
});

export const ensureLearningContent = async (): Promise<void> => {
  const [topicCount, wordCount] = await Promise.all([
    VocabularyTopic.countDocuments({ isPublished: true }),
    VocabularyWord.countDocuments({ isPublished: true }),
  ]);

  const contentIsComplete = topicCount >= learningTopics.length && wordCount >= learningWords.length;
  const missingImages = await VocabularyTopic.exists({
    isPublished: true,
    $or: [{ imageUrl: null }, { imageUrl: { $exists: false } }, { imageUrl: '' }],
  });
  if (contentIsComplete && !missingImages) return;

  await VocabularyTopic.bulkWrite(
    learningTopics.map((topic) => ({
      updateOne: {
        filter: { slug: topic.slug },
        update: { $set: { ...topic, imageUrl: topicImage(topic.slug), isPublished: true } },
        upsert: true,
      },
    }))
  );

  const topics = await VocabularyTopic.find({ slug: { $in: learningTopics.map((topic) => topic.slug) } });
  const topicIds = new Map(topics.map((topic) => [topic.slug, topic._id]));
  const topicImages = new Map(topics.map((topic) => [topic.slug, topic.imageUrl || topicImage(topic.slug)]));

  await VocabularyWord.bulkWrite(
    learningWords.map(({ topic, ...word }) => ({
      updateOne: {
        filter: { topic: topicIds.get(topic), word: word.word },
        update: {
          $set: {
            ...word,
            topic: topicIds.get(topic),
            imageUrl: topicImages.get(topic) ?? null,
            isPublished: true,
          },
        },
        upsert: true,
      },
    }))
  );
};

const getOrCreateProgress = (userId: string) =>
  LearningProgress.findOneAndUpdate(
    { user: new Types.ObjectId(userId) },
    { $setOnInsert: { user: new Types.ObjectId(userId) } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

export const getTopics = async (userId: string) => {
  await ensureLearningContent();
  const [topics, progress] = await Promise.all([
    VocabularyTopic.find({ isPublished: true }).sort({ order: 1 }),
    getOrCreateProgress(userId),
  ]);
  const learnedIds = new Set(progress.words.map((item) => item.word.toString()));

  return Promise.all(
    topics.map(async (topic) => {
      const wordIds = await VocabularyWord.find({ topic: topic._id, isPublished: true }).distinct('_id');
      return {
        id: topic._id.toString(),
        slug: topic.slug,
        title: topic.title,
        description: topic.description,
        emoji: topic.emoji,
        imageUrl: topic.imageUrl || topicImage(topic.slug),
        color: topic.color,
        wordCount: wordIds.length,
        learnedCount: wordIds.filter((id) => learnedIds.has(id.toString())).length,
      };
    })
  );
};

export const getTopicWords = async (userId: string, slug: string) => {
  await ensureLearningContent();
  const topic = await VocabularyTopic.findOne({ slug, isPublished: true });
  if (!topic) throw ApiError.notFound('Vocabulary topic not found');
  const [words, progress] = await Promise.all([
    VocabularyWord.find({ topic: topic._id, isPublished: true }).sort({ order: 1 }),
    getOrCreateProgress(userId),
  ]);
  const progressByWord = new Map(progress.words.map((item) => [item.word.toString(), item]));

  return words.map((word) => {
    const item = progressByWord.get(word._id.toString());
    return {
      ...publicWord(word, topic.imageUrl || topicImage(topic.slug)),
      progress: item
        ? { reviews: item.reviews, correct: item.correct, nextReview: item.nextReview }
        : null,
    };
  });
};

export const reviewWord = async (userId: string, wordId: string, rating: ReviewRating) => {
  const word = await VocabularyWord.findOne({ _id: wordId, isPublished: true });
  if (!word) throw ApiError.notFound('Vocabulary word not found');
  const progress = await getOrCreateProgress(userId);
  let item = progress.words.find((entry) => entry.word.equals(word._id));

  if (!item) {
    progress.words.push({
      word: word._id,
      interval: 0,
      nextReview: new Date(),
      reviews: 0,
      correct: 0,
    } as IWordProgress);
    item = progress.words[progress.words.length - 1];
  }

  const interval = rating === 'again' ? 0 : rating === 'hard' ? 1 : Math.max(2, item.interval * 2 || 2);
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);
  item.interval = interval;
  item.nextReview = nextReview;
  item.reviews += 1;
  item.correct += rating === 'again' ? 0 : 1;
  progress.xp += rating === 'good' ? 5 : rating === 'hard' ? 3 : 1;
  progress.markModified('words');
  await progress.save();

  return { wordId, interval, nextReview, reviews: item.reviews, correct: item.correct };
};

export const completeSession = async (
  userId: string,
  input: { correct: number; total: number; minutes?: number }
) => {
  const progress = await getOrCreateProgress(userId);
  const minutes = input.minutes ?? Math.max(3, Math.round(input.total * 0.75));
  const xpEarned = input.correct * 10;
  const today = startOfToday();
  const lastDate = progress.lastStudyDate ? dateKey(progress.lastStudyDate) : null;
  const todayKey = dateKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (lastDate !== todayKey) {
    progress.streak = lastDate === dateKey(yesterday) ? progress.streak + 1 : 1;
  }
  progress.xp += xpEarned;
  progress.sessions += 1;
  progress.minutesLearned += minutes;
  progress.lastStudyDate = new Date();

  await Promise.all([
    progress.save(),
    PracticeSession.create({ user: userId, correct: input.correct, total: input.total, minutes, xpEarned }),
  ]);
  return { xpEarned, streak: progress.streak, sessions: progress.sessions, minutesLearned: progress.minutesLearned };
};

export const setDailyGoal = async (userId: string, minutes: number) => {
  const progress = await getOrCreateProgress(userId);
  progress.dailyGoal = minutes;
  await progress.save();
  return { dailyGoal: progress.dailyGoal };
};

export const getReviewQueue = async (userId: string) => {
  await ensureLearningContent();
  const progress = await getOrCreateProgress(userId);
  const due = progress.words.filter((item) => item.nextReview <= new Date());
  const words = await VocabularyWord.find({ _id: { $in: due.map((item) => item.word) }, isPublished: true });
  const topics = await VocabularyTopic.find({ _id: { $in: words.map((word) => word.topic) } });
  const topicImages = new Map(topics.map((topic) => [topic._id.toString(), topic.imageUrl || topicImage(topic.slug)]));
  const byId = new Map(words.map((word) => [word._id.toString(), word]));
  return due.flatMap((item) => {
    const word = byId.get(item.word.toString());
    return word ? [publicWord(word, topicImages.get(word.topic.toString()) ?? null)] : [];
  });
};

export const getDashboard = async (userId: string) => {
  await ensureLearningContent();
  const [progress, todaySessions, wordCount] = await Promise.all([
    getOrCreateProgress(userId),
    PracticeSession.find({ user: userId, completedAt: { $gte: startOfToday() } }),
    VocabularyWord.countDocuments({ isPublished: true }),
  ]);
  const dayNumber = Math.floor(Date.now() / 86_400_000);
  const featured = wordCount
    ? await VocabularyWord.findOne({ isPublished: true }).sort({ order: 1, _id: 1 }).skip(dayNumber % wordCount)
    : null;
  const featuredTopic = featured ? await VocabularyTopic.findById(featured.topic) : null;
  const dueCount = progress.words.filter((item) => item.nextReview <= new Date()).length;
  return {
    xp: progress.xp,
    streak: progress.streak,
    sessions: progress.sessions,
    minutesLearned: progress.minutesLearned,
    todayMinutes: todaySessions.reduce((sum, session) => sum + session.minutes, 0),
    dailyGoal: progress.dailyGoal,
    dueCount,
    learnedWords: progress.words.length,
    featuredWord: featured
      ? publicWord(featured, featuredTopic?.imageUrl || topicImage(featuredTopic?.slug ?? ''))
      : null,
  };
};

export const getProgressReport = async (userId: string) => {
  const progress = await getOrCreateProgress(userId);
  const totalReviews = progress.words.reduce((sum, item) => sum + item.reviews, 0);
  const totalCorrect = progress.words.reduce((sum, item) => sum + item.correct, 0);
  return {
    xp: progress.xp,
    streak: progress.streak,
    sessions: progress.sessions,
    minutesLearned: progress.minutesLearned,
    learnedWords: progress.words.length,
    masteredWords: progress.words.filter((item) => item.interval >= 2 && item.correct >= 1).length,
    accuracy: totalReviews === 0 ? 0 : Math.round((totalCorrect / totalReviews) * 100),
  };
};
