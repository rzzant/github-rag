import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from '@google/generative-ai';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

// Bounded retry policy for transient Gemini failures (rate limits / server overload).
// Total attempts = MAX_RETRIES + 1. Backoff doubles each attempt: 500ms, 1000ms.
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 429 = rate limited, 503 = model/service temporarily overloaded. Both are
// worth a short retry. Everything else (400 bad request, 401/403 bad API key,
// 404 unknown model) is a permanent error - retrying it would only waste time
// and delay a useful error message to the user.
function isRetryableStatus(status?: number): boolean {
  return status === 429 || status === 503;
}

// Converts a raw Gemini error into a clean, classified AppError. Never
// forwards the raw SDK message verbatim - it can include internal request
// URLs and JSON error payloads.
function classifyGeminiError(error: unknown, action: string): AppError {
  if (error instanceof GoogleGenerativeAIFetchError) {
    switch (error.status) {
      case 429:
        return new AppError(429, `Gemini API rate limit exceeded while ${action}. Please wait a moment and try again.`);
      case 401:
      case 403:
        return new AppError(401, 'Gemini API key is missing, invalid, or unauthorized. Check GEMINI_API_KEY.');
      case 400:
      case 404:
        return new AppError(400, `Gemini rejected the request while ${action} (invalid model or request). Check GEMINI_MODEL / GEMINI_EMBEDDING_MODEL.`);
      default:
        return new AppError(502, `Gemini API error while ${action}.`);
    }
  }
  return new AppError(500, `Failed while ${action}.`);
}

// Runs a Gemini SDK call with bounded retry/backoff for transient failures.
// Shared by both EmbeddingService and GeminiService below.
async function callGeminiWithRetry<T>(fn: () => Promise<T>, action: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const retryable = error instanceof GoogleGenerativeAIFetchError && isRetryableStatus(error.status);

      if (!retryable || attempt >= MAX_RETRIES) {
        logger.error(`Gemini call failed permanently while ${action} (attempt ${attempt + 1})`, error);
        throw classifyGeminiError(error, action);
      }

      const delay = BASE_DELAY_MS * 2 ** attempt;
      logger.warn(`Gemini call failed while ${action} (attempt ${attempt + 1}), retrying in ${delay}ms`, error);
      await sleep(delay);
    }
  }
}

export class EmbeddingService {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.model = config.GEMINI_EMBEDDING_MODEL;
  }

  async embedText(text: string): Promise<number[]> {
    return callGeminiWithRetry(async () => {
      const model = this.genAI.getGenerativeModel({ model: this.model });
      const result = await model.embedContent(text);
      return result.embedding.values;
    }, 'generating embedding');
  }

  async embedBatch(texts: string[], batchSize = 5): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    for (const text of batch) {
      const embedding = await this.embedText(text);
      embeddings.push(embedding);
      await this.delay(100);
    }

    if (i + batchSize < texts.length) {
      await this.delay(500);
    }
  }

  return embeddings;
}

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.model = config.GEMINI_MODEL;
  }

  async generate(prompt: string, systemInstruction?: string): Promise<string> {
    return callGeminiWithRetry(async () => {
      const model = this.genAI.getGenerativeModel({
        model: this.model,
        systemInstruction: systemInstruction || undefined,
      });

      const result = await model.generateContent(prompt);
      return result.response.text();
    }, 'generating response');
  }

  async generateWithContext(
    question: string,
    context: string,
    systemInstruction: string
  ): Promise<string> {
    const prompt = `Context from the repository:\n\n${context}\n\n---\n\nUser question: ${question}`;
    return this.generate(prompt, systemInstruction);
  }
}

export const embeddingService = new EmbeddingService();
export const geminiService = new GeminiService();
