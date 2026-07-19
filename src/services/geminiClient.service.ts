import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

interface InteractionResponse {
  error?: { message?: string };
  steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
}

export const generateStructured = async <T>(prompt: string, schema: Record<string, unknown>): Promise<T> => {
  if (!env.GEMINI_API_KEY) throw new ApiError('Gemini is not configured on the server.', 503);
  let response: Response;
  try {
    response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        model: env.GEMINI_MODEL,
        store: false,
        input: prompt,
        response_format: { type: 'text', mime_type: 'application/json', schema },
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
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError('Gemini returned invalid structured data.', 502);
  }
};
