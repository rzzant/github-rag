import { Request, Response } from 'express';
import { z } from 'zod';
import { Repository } from '../models/Repository';
import { GeneratedDocument, DocumentType } from '../models/Document';
import { docsService } from '../services/docs.service';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const generateSchema = z.object({
  type: z.enum(['readme', 'api_docs', 'onboarding', 'folder_structure']),
});

export const docsController = {
  generate: asyncHandler(async (req: Request, res: Response) => {
    const { type } = generateSchema.parse(req.body);
    const repository = await Repository.findById(req.params.id);
    if (!repository) throw new AppError(404, 'Repository not found');
    if (repository.status !== 'ready') {
      throw new AppError(400, 'Repository is not ready yet');
    }

    const { title, content } = await docsService.generate(
      repository.collectionName,
      repository.localPath,
      type as DocumentType
    );

    const doc = await GeneratedDocument.findOneAndUpdate(
      { repositoryId: repository._id, type },
      { title, content },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: doc });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const docs = await GeneratedDocument.find({ repositoryId: req.params.id }).sort({
      updatedAt: -1,
    });

    res.json({ success: true, data: docs });
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const doc = await GeneratedDocument.findOne({
      repositoryId: req.params.id,
      type: req.params.type,
    });
    if (!doc) throw new AppError(404, 'Document not found');

    res.json({ success: true, data: doc });
  }),
};
