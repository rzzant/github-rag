import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  // Local Chroma
  CHROMA_HOST: z.string().default('localhost'),
  CHROMA_PORT: z.coerce.number().default(8000),

  // Chroma Cloud
  CHROMA_API_KEY: z.string().optional(),
  CHROMA_TENANT: z.string().optional(),
  CHROMA_DATABASE: z.string().optional(),
  CHROMA_URL: z.string().optional(),

  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  GEMINI_EMBEDDING_MODEL: z.string().default('text-embedding-004'),

  REPOS_DIR: z.string().default('./data/repos'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // Single-demo-user auth. AUTH_PASSWORD_HASH is a bcrypt hash, never a
  // plaintext password - generate it with:
  //   npm run hash-password -- "your-password-here"
  AUTH_EMAIL: z.string().min(1, 'AUTH_EMAIL is required'),
  AUTH_PASSWORD_HASH: z.string().min(1, 'AUTH_PASSWORD_HASH is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET is required and should be a long random string'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const isDev = parsed.data.NODE_ENV === 'development';

export const config = {
  ...parsed.data,

  reposDir: path.resolve(parsed.data.REPOS_DIR),

  chromaUrl:
    parsed.data.CHROMA_URL ??
    `http://${parsed.data.CHROMA_HOST}:${parsed.data.CHROMA_PORT}`,

  chromaCloud: Boolean(
    parsed.data.CHROMA_API_KEY &&
    parsed.data.CHROMA_TENANT &&
    parsed.data.CHROMA_DATABASE
  ),

  isDev,
};
