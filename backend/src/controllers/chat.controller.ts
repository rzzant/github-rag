import { Request, Response } from 'express';
import { z } from 'zod';
import { Repository } from '../models/Repository';
import { ChatSession } from '../models/ChatSession';
import { ragService } from '../services/rag.service';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  mode: z.enum(['explain', 'architecture', 'function', 'api', 'onboarding']).default('explain'),
  sessionId: z.string().optional(),
});

export const chatController = {
  send: asyncHandler(async (req: Request, res: Response) => {
    const { message, mode, sessionId } = chatSchema.parse(req.body);
    const repository = await Repository.findById(req.params.id);
    if (!repository) throw new AppError(404, 'Repository not found');
    if (repository.status !== 'ready') {
      throw new AppError(400, 'Repository is not ready for chat yet');
    }

    const response = await ragService.chat(repository.collectionName, message, mode);

    let session;
    if (sessionId) {
      session = await ChatSession.findById(sessionId);
    }

    if (!session) {
      session = await ChatSession.create({
        repositoryId: repository._id,
        title: message.slice(0, 60),
        messages: [],
      });
    }

    session.messages.push(
      { role: 'user', content: message, createdAt: new Date() },
      {
        role: 'assistant',
        content: response.answer,
        citations: response.citations,
        createdAt: new Date(),
      }
    );
    await session.save();

    res.json({
      success: true,
      data: {
        answer: response.answer,
        citations: response.citations,
        sessionId: session._id,
      },
    });
  }),

  listSessions: asyncHandler(async (req: Request, res: Response) => {
    const sessions = await ChatSession.find({ repositoryId: req.params.id })
      .sort({ updatedAt: -1 })
      .select('title createdAt updatedAt messages');

    const summaries = sessions.map((s) => ({
      _id: s._id,
      title: s.title,
      messageCount: s.messages.length,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    res.json({ success: true, data: summaries });
  }),

  getSession: asyncHandler(async (req: Request, res: Response) => {
    const session = await ChatSession.findById(req.params.sessionId);
    if (!session) throw new AppError(404, 'Chat session not found');

    res.json({ success: true, data: session });
  }),

  deleteSession: asyncHandler(async (req: Request, res: Response) => {
    await ChatSession.findByIdAndDelete(req.params.sessionId);
    res.json({ success: true, message: 'Session deleted' });
  }),
};
