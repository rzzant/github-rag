import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { config } from '../config';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { signSessionToken, setSessionCookie, clearSessionCookie } from '../middleware/auth';

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email'),
  password: z.string().min(1, 'Password is required').max(200),
});

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);

    // Constant-shape response for both "wrong email" and "wrong password" -
    // never reveal which one was incorrect, so a caller can't enumerate
    // whether AUTH_EMAIL matches without also guessing the password.
    const emailMatches = email.toLowerCase() === config.AUTH_EMAIL.toLowerCase();
    const passwordMatches = await bcrypt.compare(password, config.AUTH_PASSWORD_HASH);

    if (!emailMatches || !passwordMatches) {
      throw new AppError(401, 'Invalid email or password');
    }

    const token = signSessionToken();
    setSessionCookie(res, token);
    res.json({ success: true, data: { email: config.AUTH_EMAIL } });
  }),

  logout: asyncHandler(async (_req: Request, res: Response) => {
    clearSessionCookie(res);
    res.json({ success: true, message: 'Logged out' });
  }),

  me: asyncHandler(async (_req: Request, res: Response) => {
    // Reachable only via requireAuth, so getting here means the session is valid.
    res.json({ success: true, data: { email: config.AUTH_EMAIL } });
  }),
};
