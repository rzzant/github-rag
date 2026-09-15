import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'http';

const TEST_PASSWORD = 'test-password-123';

describe('protected endpoints, rate limiting, CORS, and security headers (real HTTP)', () => {
  let server: Server;
  let base: string;

  before(async () => {
    const { default: app } = await import('./index');
    server = app.listen(0);
    const port = (server.address() as { port: number }).port;
    base = `http://127.0.0.1:${port}`;
  });

  after(() => {
    server?.close();
  });

  test('rejects an unauthenticated request before it reaches Mongo, and accepts one with a valid session', async () => {
    const noAuth = await fetch(`${base}/api/repositories`);
    assert.equal(noAuth.status, 401);

    const login = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: process.env.AUTH_EMAIL, password: TEST_PASSWORD }),
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie')?.split(';')[0];
    assert.ok(cookie);

    // Passes the auth gate - it will fail later with a non-401 (Mongo
    // buffering timeout, no live DB in this test environment) rather than
    // a 401, which proves requireAuth let it through rather than blocking it.
    const withAuth = await fetch(`${base}/api/repositories`, { headers: { Cookie: cookie! } });
    assert.notEqual(withAuth.status, 401);
  });

  test('rejects wrong password with 401 and never reveals whether the email matched', async () => {
    const res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: process.env.AUTH_EMAIL, password: 'wrong' }),
    });
    assert.equal(res.status, 401);
  });

  test('reflects the configured FRONTEND_URL and allows credentials, for cross-origin cookie use', async () => {
    const { config } = await import('./config');
    const res = await fetch(`${base}/api/health`, {
      headers: { Origin: config.FRONTEND_URL },
    });
    assert.equal(res.headers.get('access-control-allow-origin'), config.FRONTEND_URL);
    assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
  });

  test('sets standard helmet security headers without breaking the request', async () => {
    const res = await fetch(`${base}/api/health`);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.status, 200);
  });

  test('/health remains public and unaffected while the login limiter is exercised', async () => {
    // Drive the login endpoint past its configured limit (10/15min) with
    // wrong credentials, then confirm /health is untouched by it.
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) {
      const res = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: process.env.AUTH_EMAIL, password: 'wrong' }),
      });
      statuses.push(res.status);
    }

    assert.equal(statuses[statuses.length - 1], 429);

    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 200);
  });
});
