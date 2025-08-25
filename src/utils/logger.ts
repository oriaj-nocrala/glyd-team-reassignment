import { sanitizeForLog } from './security';

/**
 * Secure logging utility that respects test environment and prevents log injection
 */
export const logger = {
  log: (message: string, ...args: unknown[]): void => {
    if (process.env.NODE_ENV !== 'test') {
      const sanitizedMessage = sanitizeForLog(message);
      const sanitizedArgs = args.map(arg => sanitizeForLog(arg));
      console.log(sanitizedMessage, ...sanitizedArgs);
    }
  },

  warn: (message: string, ...args: unknown[]): void => {
    if (process.env.NODE_ENV !== 'test') {
      const sanitizedMessage = sanitizeForLog(message);
      const sanitizedArgs = args.map(arg => sanitizeForLog(arg));
      console.warn(sanitizedMessage, ...sanitizedArgs);
    }
  },

  error: (message: string, ...args: unknown[]): void => {
    if (process.env.NODE_ENV !== 'test') {
      const sanitizedMessage = sanitizeForLog(message);
      const sanitizedArgs = args.map(arg => sanitizeForLog(arg));
      console.error(sanitizedMessage, ...sanitizedArgs);
    }
  },

  security: (event: string, details: Record<string, unknown> = {}): void => {
    if (process.env.NODE_ENV !== 'test') {
      const timestamp = new Date().toISOString();
      const sanitizedDetails = Object.entries(details)
        .map(([key, value]) => `${key}="${sanitizeForLog(value)}"`)
        .join(' ');
      console.warn(`[SECURITY] ${timestamp} event="${event}" ${sanitizedDetails}`);
    }
  },
};
