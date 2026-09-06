import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export class EmbeddingService {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.model = config.GEMINI_EMBEDDING_MODEL;
  }

  async embedText(text: string): Promise<number[]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      logger.error('Embedding generation failed', error);
      throw new AppError(500, `Failed to generate embedding: ${(error as Error).message}`);
    }
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
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.model,
        systemInstruction: systemInstruction || undefined,
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      logger.error('Gemini generation failed', error);
      throw new AppError(500, `Failed to generate response: ${(error as Error).message}`);
    }
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
