import { Types } from 'mongoose';
import { grammarCatalog } from '../data/grammarCatalog';
import GrammarExercise, { IGrammarExercise } from '../models/grammarExercise.model';
import GrammarMistake from '../models/grammarMistake.model';
import GrammarProgress from '../models/grammarProgress.model';
import GrammarTopic from '../models/grammarTopic.model';
import LearningProgress from '../models/learningProgress.model';
import { ApiError } from '../utils/ApiError';

export const ensureGrammarContent = async () => {
  const [topicCount, exerciseCount] = await Promise.all([GrammarTopic.countDocuments({ isPublished: true }), GrammarExercise.countDocuments({ isPublished: true })]);
  const expectedExercises = grammarCatalog.reduce((sum, topic) => sum + topic.exercises.length, 0);
  if (topicCount >= grammarCatalog.length && exerciseCount >= expectedExercises) return;
  await GrammarTopic.bulkWrite(grammarCatalog.map(({ exercises: _exercises, ...topic }, index) => ({ updateOne: { filter: { slug: topic.slug }, update: { $set: { ...topic, order: index + 1, isPublished: true } }, upsert: true } })));
  const topics = await GrammarTopic.find({ slug: { $in: grammarCatalog.map((topic) => topic.slug) } });
  const ids = new Map(topics.map((topic) => [topic.slug, topic._id]));
  await GrammarExercise.bulkWrite(grammarCatalog.flatMap((topic) => topic.exercises.map((exercise, index) => ({ updateOne: { filter: { slug: exercise.slug }, update: { $set: { topic: ids.get(topic.slug), slug: exercise.slug, type: exercise.type, prompt: exercise.prompt, options: exercise.options ?? [], correctAnswer: exercise.answer, explanation: exercise.explanation, order: index + 1, isPublished: true } }, upsert: true } }))));
};

export const getTopics = async (userId: string) => {
  await ensureGrammarContent();
  const [topics, progress] = await Promise.all([GrammarTopic.find({ isPublished: true }).sort({ level: 1, order: 1 }), GrammarProgress.find({ user: userId })]);
  const byTopic = new Map(progress.map((item) => [item.topic.toString(), item]));
  return Promise.all(topics.map(async (topic) => ({ id: topic._id.toString(), slug: topic.slug, title: topic.title, description: topic.description, level: topic.level, icon: topic.icon, exerciseCount: await GrammarExercise.countDocuments({ topic: topic._id, isPublished: true }), mastery: byTopic.get(topic._id.toString())?.mastery ?? 0, attempted: byTopic.get(topic._id.toString())?.attempted ?? 0 })));
};

const publicExercise = (exercise: IGrammarExercise | null) => {
  if (!exercise) throw ApiError.notFound('Exercise not found');
  return { id: exercise._id.toString(), type: exercise.type, prompt: exercise.prompt, options: exercise.options, order: exercise.order };
};

export const getTopic = async (userId: string, slug: string) => {
  await ensureGrammarContent();
  const topic = await GrammarTopic.findOne({ slug, isPublished: true });
  if (!topic) throw ApiError.notFound('Grammar topic not found');
  const [exercises, progress] = await Promise.all([GrammarExercise.find({ topic: topic._id, isPublished: true }).sort({ order: 1 }), GrammarProgress.findOne({ user: userId, topic: topic._id })]);
  return { topic: { id: topic._id.toString(), slug: topic.slug, title: topic.title, description: topic.description, theory: topic.theory, examples: topic.examples, level: topic.level, icon: topic.icon }, exercises: exercises.map(publicExercise), progress: { mastery: progress?.mastery ?? 0, completedExerciseIds: progress?.completedExercises.map(String) ?? [] } };
};

const normalize = (value: string) => value.trim().toLowerCase().replace(/[.!?]+$/g, '').replace(/\s+/g, ' ');

export const submitAnswer = async (userId: string, exerciseId: string, answer: string) => {
  const exercise = await GrammarExercise.findOne({ _id: exerciseId, isPublished: true });
  if (!exercise) throw ApiError.notFound('Exercise not found');
  const correct = normalize(answer) === normalize(exercise.correctAnswer);
  const update: { $inc: { attempted: number; correct: number }; $set: { lastPracticedAt: Date }; $addToSet?: { completedExercises: Types.ObjectId } } = { $inc: { attempted: 1, correct: correct ? 1 : 0 }, $set: { lastPracticedAt: new Date() } };
  if (correct) update.$addToSet = { completedExercises: exercise._id };
  const progress = await GrammarProgress.findOneAndUpdate({ user: userId, topic: exercise.topic }, { ...update, $setOnInsert: { user: userId, topic: exercise.topic } }, { new: true, upsert: true });
  const total = await GrammarExercise.countDocuments({ topic: exercise.topic, isPublished: true });
  progress.mastery = Math.round((progress.completedExercises.length / total) * 100);
  await progress.save();
  if (correct) {
    await GrammarMistake.updateOne({ user: userId, exercise: exercise._id }, { resolvedAt: new Date(), lastAttemptAt: new Date() });
  } else {
    await GrammarMistake.findOneAndUpdate({ user: userId, exercise: exercise._id }, { $set: { topic: exercise.topic, lastAnswer: answer, resolvedAt: null, lastAttemptAt: new Date() }, $inc: { attempts: 1 }, $setOnInsert: { user: userId, exercise: exercise._id } }, { upsert: true });
  }
  await LearningProgress.findOneAndUpdate({ user: userId }, { $inc: { xp: correct ? 10 : 2 }, $setOnInsert: { user: userId } }, { upsert: true });
  return { correct, correctAnswer: exercise.correctAnswer, explanation: exercise.explanation, mastery: progress.mastery, xpEarned: correct ? 10 : 2 };
};

export const getMistakes = async (userId: string) => {
  const mistakes = await GrammarMistake.find({ user: userId, resolvedAt: null }).sort({ lastAttemptAt: -1 }).limit(100);
  const [exercises, topics] = await Promise.all([GrammarExercise.find({ _id: { $in: mistakes.map((item) => item.exercise) } }), GrammarTopic.find({ _id: { $in: mistakes.map((item) => item.topic) } })]);
  const exerciseMap = new Map(exercises.map((item) => [item._id.toString(), item])); const topicMap = new Map(topics.map((item) => [item._id.toString(), item]));
  return mistakes.flatMap((mistake) => { const exercise = exerciseMap.get(mistake.exercise.toString()); const topic = topicMap.get(mistake.topic.toString()); return exercise && topic ? [{ id: mistake._id.toString(), attempts: mistake.attempts, lastAnswer: mistake.lastAnswer, topic: { slug: topic.slug, title: topic.title }, exercise: publicExercise(exercise) }] : []; });
};


