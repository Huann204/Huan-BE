import AiGeneration from '../models/aiGeneration.model';
import WordSet from '../models/wordSet.model';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

interface GeneratedWordSet {
  title: string;
  description: string;
  words: Array<{
    word: string;
    phonetic: string;
    meaningVi: string;
    definitionEn: string;
    example: string;
    exampleMeaning: string;
  }>;
}

interface InteractionResponse {
  status?: string;
  error?: { message?: string };
  steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
}

const responseSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'A short English title for the vocabulary set.' },
    description: { type: 'string', description: 'A concise Vietnamese description of what the learner will practise.' },
    words: {
      type: 'array',
      description: 'Unique, useful English vocabulary items ordered from easier to harder.',
      items: {
        type: 'object',
        properties: {
          word: { type: 'string' },
          phonetic: { type: 'string', description: 'IPA pronunciation, or an empty string if uncertain.' },
          meaningVi: { type: 'string', description: 'Natural Vietnamese meaning.' },
          definitionEn: { type: 'string', description: 'Simple English definition suitable for the requested CEFR level.' },
          example: { type: 'string', description: 'Natural English example sentence.' },
          exampleMeaning: { type: 'string', description: 'Accurate Vietnamese translation of the example.' },
        },
        required: ['word', 'phonetic', 'meaningVi', 'definitionEn', 'example', 'exampleMeaning'],
        additionalProperties: false,
      },
    },
  },
  required: ['title', 'description', 'words'],
  additionalProperties: false,
};

const trim = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);

const validateOutput = (value: unknown, requestedCount: number): GeneratedWordSet => {
  if (!value || typeof value !== 'object') throw new Error('Invalid AI output');
  const candidate = value as Partial<GeneratedWordSet>;
  if (!Array.isArray(candidate.words)) throw new Error('AI did not return words');
  const unique = new Map<string, GeneratedWordSet['words'][number]>();
  for (const item of candidate.words) {
    const word = trim(item?.word, 100);
    const meaningVi = trim(item?.meaningVi, 200);
    const definitionEn = trim(item?.definitionEn, 300);
    if (!word || !meaningVi || !definitionEn) continue;
    unique.set(word.toLowerCase(), {
      word,
      phonetic: trim(item.phonetic, 100),
      meaningVi,
      definitionEn,
      example: trim(item.example, 500),
      exampleMeaning: trim(item.exampleMeaning, 500),
    });
  }
  const words = [...unique.values()].slice(0, requestedCount);
  if (words.length < Math.min(5, requestedCount)) throw new Error('AI returned too few valid words');
  return {
    title: trim(candidate.title, 120) || 'AI Vocabulary Set',
    description: trim(candidate.description, 500),
    words,
  };
};

const checkQuota = async (userId: string) => {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [hourly, daily] = await Promise.all([
    AiGeneration.countDocuments({ user: userId, createdAt: { $gte: hourAgo } }),
    AiGeneration.countDocuments({ user: userId, createdAt: { $gte: dayAgo } }),
  ]);
  if (hourly >= 5) throw new ApiError('AI generation limit reached. Try again in an hour.', 429);
  if (daily >= 20) throw new ApiError('Daily AI generation limit reached.', 429);
};

export const generateWordSet = async (userId: string, input: { topic: string; level: Level; count: number; notes?: string }) => {
  if (!env.GEMINI_API_KEY) throw new ApiError('Gemini is not configured on the server.', 503);
  await checkQuota(userId);

  const topic = trim(input.topic, 120);
  const notes = trim(input.notes, 300);
  const prompt = [
    'Create a practical English vocabulary set for a Vietnamese learner.',
    `Topic: ${topic}. CEFR level: ${input.level}. Exact number of words: ${input.count}.`,
    'Prefer common, useful words and phrases. Do not include offensive, unsafe, trademark-spam, or duplicate content.',
    'Definitions and examples must be factually correct and appropriate for the CEFR level.',
    notes ? `Additional learner request: ${notes}` : '',
  ].filter(Boolean).join('\n');

  await AiGeneration.create({ user: userId, feature: 'word_set', model: env.GEMINI_MODEL, topic, itemCount: input.count });

  let response: Response;
  try {
    response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        model: env.GEMINI_MODEL,
        store: false,
        input: prompt,
        response_format: { type: 'text', mime_type: 'application/json', schema: responseSchema },
      }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') throw new ApiError('Gemini request timed out. Please try again.', 504);
    throw new ApiError('Unable to connect to Gemini.', 502);
  }

  const interaction = await response.json() as InteractionResponse;
  if (!response.ok) {
    const upstream = interaction.error?.message ?? 'Gemini rejected the request.';
    throw new ApiError(`Gemini error: ${upstream}`, response.status === 429 ? 429 : 502);
  }
  const text = interaction.steps
    ?.filter((step) => step.type === 'model_output')
    .flatMap((step) => step.content ?? [])
    .filter((content) => content.type === 'text')
    .map((content) => content.text ?? '')
    .join('');
  if (!text) throw new ApiError('Gemini returned an empty response.', 502);

  let generated: GeneratedWordSet;
  try {
    generated = validateOutput(JSON.parse(text), input.count);
  } catch {
    throw new ApiError('Gemini returned invalid vocabulary data. Please try again.', 502);
  }

  const set = await WordSet.create({
    owner: userId,
    title: generated.title,
    description: generated.description,
    visibility: 'private',
    moderationStatus: 'not_required',
    words: generated.words.map((word, index) => ({
      word: word.word,
      phonetic: word.phonetic,
      meaning: { vi: word.meaningVi, en: word.definitionEn },
      example: word.example,
      exampleMeaning: word.exampleMeaning,
      imageUrl: null,
      order: index + 1,
    })),
  });
  return { id: set._id.toString(), title: set.title, wordCount: set.words.length };
};
