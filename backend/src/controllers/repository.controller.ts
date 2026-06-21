import { Request, Response } from 'express';
import { z } from 'zod';
import { Repository } from '../models/Repository';
import { indexingService } from '../services/indexing.service';
import { architectureService } from '../services/architecture.service';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { chromaService } from '../services/chroma.service';
import { githubService } from '../services/github.service';

const indexSchema = z.object({
  url: z.string().url(),
});

export const repositoryController = {
  index: asyncHandler(async (req: Request, res: Response) => {
    const { url } = indexSchema.parse(req.body);
    const repository = await indexingService.indexRepository(url);

    res.status(202).json({
      success: true,
      data: repository,
      message: 'Repository indexing started',
    });
  }),

  list: asyncHandler(async (_req: Request, res: Response) => {
    const repositories = await Repository.find()
      .sort({ updatedAt: -1 })
      .select('-localPath');

    res.json({ success: true, data: repositories });
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const repository = await Repository.findById(req.params.id).select('-localPath');
    if (!repository) throw new AppError(404, 'Repository not found');

    res.json({ success: true, data: repository });
  }),

  getStatus: asyncHandler(async (req: Request, res: Response) => {
    const repository = await Repository.findById(req.params.id).select(
      'status statusMessage fileCount chunkCount error indexedAt'
    );
    if (!repository) throw new AppError(404, 'Repository not found');

    res.json({ success: true, data: repository });
  }),

  reindex: asyncHandler(async (req: Request, res: Response) => {
    const repository = await indexingService.reindex(req.params.id);

    res.json({
      success: true,
      data: repository,
      message: 'Reindexing started',
    });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const repository = await Repository.findById(req.params.id);
    if (!repository) throw new AppError(404, 'Repository not found');

    await chromaService.deleteCollection(repository.collectionName);
    await githubService.deleteLocalRepo(repository.owner, repository.repo);
    await Repository.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Repository deleted' });
  }),

  getArchitecture: asyncHandler(async (req: Request, res: Response) => {
    const repository = await Repository.findById(req.params.id);
    if (!repository) throw new AppError(404, 'Repository not found');
    if (repository.status !== 'ready') {
      throw new AppError(400, 'Repository is not ready yet');
    }

    const architecture = await architectureService.analyze(repository.localPath);
    res.json({ success: true, data: architecture });
  }),
};
