import { config } from '../config';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function serializeMeta(meta: unknown): string {
  if (meta instanceof Error) {
    return JSON.stringify({
      name: meta.name,
      message: meta.message,
      stack: meta.stack,
    });
  }
  return JSON.stringify(meta);
}

function formatMessage(level: LogLevel, message: string, meta?: unknown): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta !== undefined ? ` ${serializeMeta(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

export const logger = {
  info(message: string, meta?: unknown) {
    console.log(formatMessage('info', message, meta));
  },
  warn(message: string, meta?: unknown) {
    console.warn(formatMessage('warn', message, meta));
  },
  error(message: string, meta?: unknown) {
    console.error(formatMessage('error', message, meta));
  },
  debug(message: string, meta?: unknown) {
    if (config.isDev) {
      console.debug(formatMessage('debug', message, meta));
    }
  },
};
