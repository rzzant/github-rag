// Preloaded via `--import` before any test file runs. Sets dummy env vars
// so config.ts's fail-fast validation (see A.1) doesn't reject the test
// process. Never written to .env - only visible to this test run.
process.env.MONGODB_URI ??= 'mongodb://localhost:27017/test';
process.env.GEMINI_API_KEY ??= 'test-key-not-a-real-secret';
process.env.AUTH_EMAIL ??= 'test@example.com';
// Real bcrypt hash of the fixed test fixture password "test-password-123"
// (see src/middleware/auth.test.ts). Not a real credential.
process.env.AUTH_PASSWORD_HASH ??= '$2b$12$nOTX9Jdryd.OIvJzaEZAduMIPlWMjwNyg.9Emhoal4XHJtuJxQySa';
process.env.JWT_SECRET ??= 'test-jwt-secret-not-a-real-secret-16chars';
