import { Router } from 'express';
import { repositoryController } from '../controllers/repository.controller';
import { chatController } from '../controllers/chat.controller';
import { docsController } from '../controllers/docs.controller';
import { authController } from '../controllers/auth.controller';
import { validateParams } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { loginRateLimiter, expensiveOperationRateLimiter } from '../middleware/rateLimit';
import { repositoryIdParamSchema, repositorySessionParamSchema } from '../utils/validation';

const router = Router();

const requireRepositoryId = validateParams(repositoryIdParamSchema);
const requireSessionId = validateParams(repositorySessionParamSchema);

// Health check - must stay public and unauthenticated: Render's health
// checks hit this without any session cookie.
router.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes - login is intentionally public (that's the whole point);
// logout/me require an existing session. Login is rate-limited since
// there is exactly one valid password in this single-demo-user app.
router.post('/auth/login', loginRateLimiter, authController.login);
router.post('/auth/logout', requireAuth, authController.logout);
router.get('/auth/me', requireAuth, authController.me);

// Everything below this line requires a valid session. This is a single-
// demo-user app - requireAuth is the entire authorization boundary;
// there's no per-resource ownership to check because there is only ever
// one authenticated identity.
router.use(requireAuth);

// Repository routes
router.post('/repositories', expensiveOperationRateLimiter, repositoryController.index);
router.get('/repositories', repositoryController.list);
router.get('/repositories/:id', requireRepositoryId, repositoryController.get);
router.get('/repositories/:id/status', requireRepositoryId, repositoryController.getStatus);
router.post(
  '/repositories/:id/reindex',
  requireRepositoryId,
  expensiveOperationRateLimiter,
  repositoryController.reindex
);
router.delete('/repositories/:id', requireRepositoryId, repositoryController.delete);
router.get('/repositories/:id/architecture', requireRepositoryId, repositoryController.getArchitecture);

// Chat routes
router.post(
  '/repositories/:id/chat',
  requireRepositoryId,
  expensiveOperationRateLimiter,
  chatController.send
);
router.get('/repositories/:id/chat/sessions', requireRepositoryId, chatController.listSessions);
router.get('/repositories/:id/chat/sessions/:sessionId', requireSessionId, chatController.getSession);
router.delete('/repositories/:id/chat/sessions/:sessionId', requireSessionId, chatController.deleteSession);

// Documentation routes
router.post(
  '/repositories/:id/docs',
  requireRepositoryId,
  expensiveOperationRateLimiter,
  docsController.generate
);
router.get('/repositories/:id/docs', requireRepositoryId, docsController.list);
router.get('/repositories/:id/docs/:type', requireRepositoryId, docsController.get);

export default router;
