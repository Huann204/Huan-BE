import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

interface InteractionResponse {
  error?: { message?: string };
  steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
}

const canonicalMimeTypes: Record<string, string> = {
  'audio/wav': 'audio/wav',
  'audio/x-wav': 'audio/wav',
  'audio/wave': 'audio/wav',
  'audio/mpeg': 'audio/mpeg',
  'audio/mp3': 'audio/mpeg',
  'audio/mp4': 'audio/m4a',
  'audio/m4a': 'audio/m4a',
  'audio/x-m4a': 'audio/m4a',
  'audio/ogg': 'audio/ogg',
  'application/ogg': 'audio/ogg',
};

export const parseAudioDataUrl = (dataUrl: string) => {
  const commaIndex = dataUrl.indexOf(',');
  if (!dataUrl.startsWith('data:') || commaIndex < 6) throw ApiError.badRequest('Unsupported audio format');
  const header = dataUrl.slice(5, commaIndex);
  const parts = header.split(';').map((part) => part.trim().toLowerCase());
  if (!parts.includes('base64')) throw ApiError.badRequest('Audio must be base64 encoded');
  const mimeType = canonicalMimeTypes[parts[0]];
  if (!mimeType) throw ApiError.badRequest(`Unsupported audio format: ${parts[0] || 'unknown'}`);
  const data = dataUrl.slice(commaIndex + 1);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data)) throw ApiError.badRequest('Invalid audio data');
  const bytes = Buffer.from(data, 'base64');
  if (!bytes.length || bytes.length > 6 * 1024 * 1024) throw ApiError.badRequest('Audio must be smaller than 6 MB');
  return { mimeType, data, size: bytes.length };
};

export const generateAudioStructured = async <T>(prompt: string, dataUrl: string, schema: Record<string, unknown>): Promise<T> => {
  if (!env.GEMINI_API_KEY) throw new ApiError('Gemini is not configured on the server.', 503);
  const audio = parseAudioDataUrl(dataUrl);
  let response: Response;
  try {
    response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        model: env.GEMINI_MODEL,
        store: false,
        input: [
          { type: 'text', text: prompt },
          { type: 'audio', data: audio.data, mime_type: audio.mimeType },
        ],
        response_format: { type: 'text', mime_type: 'application/json', schema },
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') throw new ApiError('Audio analysis timed out. Please try a shorter recording.', 504);
    throw new ApiError('Unable to connect to Gemini audio analysis.', 502);
  }
  const interaction = await response.json() as InteractionResponse;
  if (!response.ok) throw new ApiError(`Gemini audio error: ${interaction.error?.message ?? 'Request rejected'}`, response.status === 429 ? 429 : 502);
  const text = interaction.steps?.filter((step) => step.type === 'model_output').flatMap((step) => step.content ?? []).filter((item) => item.type === 'text').map((item) => item.text ?? '').join('');
  if (!text) throw new ApiError('Gemini returned an empty audio analysis.', 502);
  try { return JSON.parse(text) as T; } catch { throw new ApiError('Gemini returned invalid audio analysis.', 502); }
};
