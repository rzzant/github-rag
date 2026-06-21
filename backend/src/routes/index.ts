import { Router } from 'express';
import { repositoryController } from '../controllers/repository.controller';
import { chatController } from '../controllers/chat.controller';
import { docsController } from '../controllers/docs.controller';

const router = Router();

// Repository routes
router.post('/repositories', repositoryController.index);
router.get('/repositories', repositoryController.list);
router.get('/repositories/:id', repositoryController.get);
router.get('/repositories/:id/status', repositoryController.getStatus);
router.post('/repositories/:id/reindex', repositoryController.reindex);
router.delete('/repositories/:id', repositoryController.delete);
router.get('/repositories/:id/architecture', repositoryController.getArchitecture);

// Chat routes
router.post('/repositories/:id/chat', chatController.send);
router.get('/repositories/:id/chat/sessions', chatController.listSessions);
router.get('/repositories/:id/chat/sessions/:sessionId', chatController.getSession);
router.delete('/repositories/:id/chat/sessions/:sessionId', chatController.deleteSession);

// Documentation routes
router.post('/repositories/:id/docs', docsController.generate);
router.get('/repositories/:id/docs', docsController.list);
router.get('/repositories/:id/docs/:type', docsController.get);

// Health check
router.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
