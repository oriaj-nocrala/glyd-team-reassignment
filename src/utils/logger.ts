/**
 * Simple logging utility that respects test environment
 */
export const logger = {
  log: (message: string, ...args: unknown[]): void => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(message, ...args);
    }
  },
  
  warn: (message: string, ...args: unknown[]): void => {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(message, ...args);
    }
  },
  
  error: (message: string, ...args: unknown[]): void => {
    if (process.env.NODE_ENV !== 'test') {
      console.error(message, ...args);
    }
  }
};