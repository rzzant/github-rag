import express from 'express';
import cors from 'cors';
import { config } from './config';
import { connectDatabase } from './config/database';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

const app = express();

app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

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

start();

export default app;