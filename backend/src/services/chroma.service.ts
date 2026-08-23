import { ChromaClient, Collection, IncludeEnum } from 'chromadb';
import { config } from '../config';
import { SourceChunk } from '../types';
import { embeddingService } from './embedding.service';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export class ChromaService {
  private client: ChromaClient;
  private collections: Map<string, Collection> = new Map();

  constructor() {
    this.client = new ChromaClient({ path: config.chromaUrl });
  }

  async getOrCreateCollection(name: string): Promise<Collection> {
    if (this.collections.has(name)) {
      return this.collections.get(name)!;
    }

    try {
      const collection = await this.client.getOrCreateCollection({
        name,
        metadata: { 'hnsw:space': 'cosine' },
      });
      this.collections.set(name, collection);
      return collection;
    } catch (error) {
      logger.error('ChromaDB collection error', error);
      throw new AppError(500, `ChromaDB error: ${(error as Error).message}`);
    }
  }

  async addChunks(collectionName: string, chunks: SourceChunk[]): Promise<void> {
    if (chunks.length === 0) return;

    const collection = await this.getOrCreateCollection(collectionName);
    const batchSize = 20;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const texts = batch.map(
        (c) => `File: ${c.filePath} (lines ${c.startLine}-${c.endLine})\nLanguage: ${c.language}\n\n${c.content}`
      );

      const embeddings = await embeddingService.embedBatch(texts, 5);

      await collection.add({
        ids: batch.map((c) => c.id),
        embeddings,
        documents: texts,
        metadatas: batch.map((c) => ({
          filePath: c.filePath,
          startLine: c.startLine,
          endLine: c.endLine,
          language: c.language,
        })),
      });

      logger.debug(`Indexed batch ${i / batchSize + 1} (${batch.length} chunks)`);
    }

    logger.info(`Indexed ${chunks.length} chunks in collection ${collectionName}`);
  }

  async query(
    collectionName: string,
    queryText: string,
    nResults = 8
  ): Promise<Array<{
    filePath: string;
    startLine: number;
    endLine: number;
    content: string;
    score: number;
    language: string;
  }>> {
    const collection = await this.getOrCreateCollection(collectionName);
    const queryEmbedding = await embeddingService.embedText(queryText);

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults,
      include: [
  IncludeEnum.Documents,
  IncludeEnum.Metadatas,
  IncludeEnum.Distances,
],
    });

    const documents = results.documents?.[0] || [];
    const metadatas = results.metadatas?.[0] || [];
    const distances = results.distances?.[0] || [];

    return documents.map((doc, i) => {
      const meta = metadatas[i] as Record<string, string | number>;
      return {
        filePath: String(meta.filePath),
        startLine: Number(meta.startLine),
        endLine: Number(meta.endLine),
        language: String(meta.language),
        content: doc || '',
        score: 1 - (distances[i] || 0),
      };
    });
  }

  async deleteCollection(collectionName: string): Promise<void> {
    try {
      await this.client.deleteCollection({ name: collectionName });
      this.collections.delete(collectionName);
    } catch {
      logger.warn(`Could not delete collection ${collectionName}`);
    }
  }

  async getChunkCount(collectionName: string): Promise<number> {
    try {
      const collection = await this.getOrCreateCollection(collectionName);
      return await collection.count();
    } catch {
      return 0;
    }
  }
}

export const chromaService = new ChromaService();
