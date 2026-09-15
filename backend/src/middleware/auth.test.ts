import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express';

const TEST_PASSWORD = 'test-password-123';

describe('password hashing (bcrypt)', () => {
  test('the configured AUTH_PASSWORD_HASH fixture matches the known test password', async () => {
    const matches = await bcrypt.compare(TEST_PASSWORD, process.env.AUTH_PASSWORD_HASH!);
    assert.equal(matches, true);
  });

  test('rejects an incorrect password against the same hash', async () => {
    const matches = await bcrypt.compare('wrong-password', process.env.AUTH_PASSWORD_HASH!);
    assert.equal(matches, false);
  });

  test('never produces the same hash twice for the same password (random salt)', async () => {
    const hashA = await bcrypt.hash(TEST_PASSWORD, 10);
    const hashB = await bcrypt.hash(TEST_PASSWORD, 10);
    assert.notEqual(hashA, hashB);
    assert.equal(await bcrypt.compare(TEST_PASSWORD, hashA), true);
    assert.equal(await bcrypt.compare(TEST_PASSWORD, hashB), true);
  });
});

describe('session token (JWT)', () => {
  test('signSessionToken produces a token that verifies with the configured secret', async () => {
    const { signSessionToken } = await import('./auth');
    const token = signSessionToken();
    assert.doesNotThrow(() => jwt.verify(token, process.env.JWT_SECRET!));
  });

  test('a token signed with a different secret fails verification', () => {
    const forged = jwt.sign({ sub: 'demo-user' }, 'a-completely-different-secret');
    assert.throws(() => jwt.verify(forged, process.env.JWT_SECRET!));
  });

  test('an expired token fails verification', () => {
    const expired = jwt.sign({ sub: 'demo-user' }, process.env.JWT_SECRET!, { expiresIn: -1 });
    assert.throws(() => jwt.verify(expired, process.env.JWT_SECRET!));
  });
});

describe('requireAuth middleware', () => {
  function mockReq(cookieToken?: string): Request {
    return { cookies: cookieToken ? { repomind_session: cookieToken } : {} } as unknown as Request;
  }

  test('throws a 401 AppError when no session cookie is present', async () => {
    const { requireAuth } = await import('./auth');
    const { AppError } = await import('../middleware/errorHandler');
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    assert.throws(() => requireAuth(mockReq(), {} as Response, next), AppError);
    assert.equal(nextCalled, false);
  });

  test('throws a 401 AppError for a malformed/invalid token', async () => {
    const { requireAuth } = await import('./auth');
    const { AppError } = await import('../middleware/errorHandler');
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    assert.throws(() => requireAuth(mockReq('not-a-real-jwt'), {} as Response, next), AppError);
    assert.equal(nextCalled, false);
  });

  test('throws a 401 AppError for an expired token', async () => {
    const { requireAuth } = await import('./auth');
    const { AppError } = await import('../middleware/errorHandler');
    const expired = jwt.sign({ sub: 'demo-user' }, process.env.JWT_SECRET!, { expiresIn: -1 });
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    assert.throws(() => requireAuth(mockReq(expired), {} as Response, next), AppError);
    assert.equal(nextCalled, false);
  });

  test('calls next() for a valid, unexpired token', async () => {
    const { requireAuth, signSessionToken } = await import('./auth');
    const token = signSessionToken();
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    assert.doesNotThrow(() => requireAuth(mockReq(token), {} as Response, next));
    assert.equal(nextCalled, true);
  });
});

describe('session cookie flags', () => {
  function mockResponse() {
    const calls: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
    const res = {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        calls.push({ name, value, options });
      },
    } as unknown as Response;
    return { res, calls };
  }

  test('always sets HttpOnly and SameSite=lax, regardless of environment', async () => {
    const { setSessionCookie } = await import('./auth');
    const { res, calls } = mockResponse();
    setSessionCookie(res, 'fake-token');

    assert.equal(calls.length, 1);
    assert.equal(calls[0].options.httpOnly, true);
    assert.equal(calls[0].options.sameSite, 'lax');
  });

  test('sets secure as the logical negation of config.isDev', async () => {
    const { setSessionCookie } = await import('./auth');
    const { config } = await import('../config');
    const { res, calls } = mockResponse();
    setSessionCookie(res, 'fake-token');

    assert.equal(calls[0].options.secure, !config.isDev);
  });
});
