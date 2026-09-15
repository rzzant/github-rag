import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { config } from './config';
import { connectDatabase } from './config/database';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

const app = express();

// crossOriginResourcePolicy disabled: default 'same-origin' blocks the
// Vercel frontend from receiving responses cross-origin. CORS below is the
// actual origin control; helmet's other defaults (X-Content-Type-Options,
// X-Frame-Options, HSTS, etc.) are unaffected by this.
app.use(helmet({ crossOriginResourcePolicy: false }));

app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.use('/api', routes);

app.use(errorHandler);

async function start() {
  try {
    await connectDatabase();
  } catch (error) {
    logger.error(
      'Failed to connect to MongoDB at startup. RepoMind cannot serve requests without it. Check MONGODB_URI and that MongoDB is running.',
      error
    );
    process.exit(1);
  }

  app.listen(config.PORT, '0.0.0.0', () => {
    logger.info(`Server running on 0.0.0.0:${config.PORT}`);
  });
}

// Only auto-start the server when this file is run directly (`tsx src/index.ts`,
// `node dist/index.js`) - not when imported as a module, e.g. by tests
// importing `app` to make requests against it directly. Without this guard,
// importing this file without a live MongoDB would trigger A.1's fail-fast
// process.exit(1) in the background, killing whatever process imported it.
if (require.main === module) {
  start();
}

export default app;