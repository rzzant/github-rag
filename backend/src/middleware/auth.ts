import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from './errorHandler';

const COOKIE_NAME = 'repomind_session';
const TOKEN_TTL = '7d';

// This is a single-demo-user app (see PHASE 1 decision) - the JWT payload
// carries no user id, just proof that the one known credential pair was
// presented at login. There is deliberately no multi-user data model here.
export function signSessionToken(): string {
  return jwt.sign({ sub: 'demo-user' }, config.JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true, // not readable from frontend JS - mitigates token theft via XSS
    secure: !config.isDev, // HTTPS-only in production (Render/Vercel both terminate TLS)
    sameSite: config.isDev ? 'lax' : 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

/**
 * Protects a route behind the single demo login. Reads the httpOnly
 * session cookie, verifies its signature/expiry, and rejects with a clean
 * 401 if missing or invalid - never leaks whether a cookie was present vs.
 * malformed vs. expired, since that distinction isn't useful to a caller
 * and only helps someone probing the auth boundary.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    throw new AppError(401, 'Not authenticated. Please log in.');
  }

  try {
    jwt.verify(token, config.JWT_SECRET);
    next();
  } catch {
    throw new AppError(401, 'Session expired or invalid. Please log in again.');
  }
}
