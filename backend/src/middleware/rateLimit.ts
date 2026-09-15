import rateLimit from 'express-rate-limit';

// Login has exactly one valid password in this single-demo-user app, so
// brute-force protection matters more than usual. 10 attempts / 15 min
// per IP is generous for a real user, punishing for a guesser.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts. Try again later.' },
});

// Applied to endpoints that trigger real cost: cloning a repo, generating
// embeddings, or calling Gemini for chat/docs. In-memory store is fine for
// a single Render instance; this app has no horizontal scaling in scope.
export const expensiveOperationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Rate limit exceeded for this operation. Try again later.' },
});
