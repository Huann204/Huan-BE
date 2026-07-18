import GrammarExercise from '../models/grammarExercise.model';
import GrammarTopic from '../models/grammarTopic.model';
import { ApiError } from '../utils/ApiError';
import { ensureGrammarContent } from './grammar.service';

export const listTopics = async (): Promise<unknown[]> => { await ensureGrammarContent(); const topics = await GrammarTopic.find().sort({ level: 1, order: 1 }); return Promise.all(topics.map(async (topic) => ({ ...topic.toJSON(), exerciseCount: await GrammarExercise.countDocuments({ topic: topic._id }) }))); };
export const createTopic = (input: Record<string, unknown>) => GrammarTopic.create(input);
export const updateTopic = async (id: string, input: Record<string, unknown>) => { const value = await GrammarTopic.findByIdAndUpdate(id, input, { new: true, runValidators: true }); if (!value) throw ApiError.notFound('Grammar topic not found'); return value; };
export const archiveTopic = async (id: string) => { const value = await GrammarTopic.findByIdAndUpdate(id, { isPublished: false }, { new: true }); if (!value) throw ApiError.notFound('Grammar topic not found'); await GrammarExercise.updateMany({ topic: id }, { isPublished: false }); return value; };
export const listExercises = (topicId: string) => GrammarExercise.find({ topic: topicId }).sort({ order: 1 });
export const createExercise = (input: Record<string, unknown>) => GrammarExercise.create(input);
export const updateExercise = async (id: string, input: Record<string, unknown>) => { const value = await GrammarExercise.findByIdAndUpdate(id, input, { new: true, runValidators: true }); if (!value) throw ApiError.notFound('Exercise not found'); return value; };
export const archiveExercise = async (id: string) => { const value = await GrammarExercise.findByIdAndUpdate(id, { isPublished: false }, { new: true }); if (!value) throw ApiError.notFound('Exercise not found'); return value; };


