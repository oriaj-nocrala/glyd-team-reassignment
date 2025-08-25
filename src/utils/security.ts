import * as path from 'path';
import * as fs from 'fs';
import { createHash } from 'crypto';

/**
 * Allowed file extensions for security validation
 */
export type AllowedExtension = '.csv' | '.json' | '.xlsx';

/**
 * Security event types for logging
 */
export type SecurityEventType = 
  | 'path_validated' 
  | 'path_validation_failed'
  | 'rate_limit_exceeded'
  | 'content_validation_failed'
  | 'file_access_denied'
  | 'malicious_content_detected';

/**
 * Rate limiting client information
 */
export interface RateLimitClient {
  readonly count: number;
  readonly windowStart: number;
}

/**
 * Security configuration with strict typing
 */
export const SECURITY_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_EXTENSIONS: ['.csv', '.json', '.xlsx'] as const satisfies readonly AllowedExtension[],
  MAX_PATH_LENGTH: 260,
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  RATE_LIMIT_MAX_FILES: 10,
} as const;

/**
 * Rate limiting tracker with proper typing
 */
const rateLimitTracker = new Map<string, RateLimitClient>();

/**
 * Advanced path validation with comprehensive security checks
 */
export function validatePathSecure(filePath: string, isOutput: boolean = false): string {
  // Input validation
  if (typeof filePath !== 'string' || filePath.length === 0) {
    throw new Error('Invalid file path: must be a non-empty string');
  }

  if (filePath.length > SECURITY_CONFIG.MAX_PATH_LENGTH) {
    throw new Error('File path too long');
  }

  // Sanitize input - remove dangerous characters
  const sanitizedPath = filePath.replace(/[<>:"|?*\x00-\x1f]/g, ''); // eslint-disable-line no-control-regex
  
  // Resolve path and normalize
  const resolvedPath = path.resolve(sanitizedPath);
  const normalizedPath = path.normalize(resolvedPath);
  
  // Check for path traversal attempts
  if (normalizedPath !== resolvedPath) {
    throw new Error('Path traversal attempt detected');
  }

  const projectRoot = path.resolve(process.cwd());
  
  // Enhanced directory traversal protection
  if (!normalizedPath.startsWith(projectRoot + path.sep) && normalizedPath !== projectRoot) {
    throw new Error('Access denied: path outside project directory');
  }

  // Check for symbolic link attacks (if file exists)
  if (fs.existsSync(normalizedPath)) {
    const stats = fs.lstatSync(normalizedPath);
    if (stats.isSymbolicLink()) {
      const realPath = fs.realpathSync(normalizedPath);
      if (!realPath.startsWith(projectRoot + path.sep)) {
        throw new Error('Access denied: symbolic link points outside project directory');
      }
    }
    
    // File size validation
    if (stats.isFile() && stats.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
      throw new Error('File too large');
    }
  }

  // Extension validation
  const ext = path.extname(normalizedPath).toLowerCase() as AllowedExtension;
  if (!SECURITY_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`File extension not allowed: ${ext}`);
  }

  // Check file exists for input files
  if (!isOutput && !fs.existsSync(normalizedPath)) {
    throw new Error('Input file not found');
  }

  return normalizedPath;
}

/**
 * Rate limiting for file operations with strict typing
 */
export function checkRateLimit(clientId: string = 'default'): void {
  const now = Date.now();
  const existingClient = rateLimitTracker.get(clientId);
  const client: RateLimitClient = existingClient || { count: 0, windowStart: now };

  // Reset window if expired
  if (now - client.windowStart > SECURITY_CONFIG.RATE_LIMIT_WINDOW) {
    const resetClient: RateLimitClient = { count: 0, windowStart: now };
    rateLimitTracker.set(clientId, resetClient);
    return;
  }

  // Check limit
  if (client.count >= SECURITY_CONFIG.RATE_LIMIT_MAX_FILES) {
    throw new Error('Rate limit exceeded: too many file operations');
  }

  const updatedClient: RateLimitClient = { 
    count: client.count + 1, 
    windowStart: client.windowStart 
  };
  rateLimitTracker.set(clientId, updatedClient);
}

/**
 * Secure file content validation
 */
export function validateFileContent(content: string): void {
  // Check for potential script injection
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      throw new Error('Potentially malicious content detected');
    }
  }

  // Check content length
  if (content.length > SECURITY_CONFIG.MAX_FILE_SIZE) {
    throw new Error('Content too large');
  }
}

/**
 * Generate secure hash for integrity checking
 */
export function generateFileHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Sanitize data for logging to prevent log injection
 */
export function sanitizeForLog(data: unknown): string {
  let stringData: string;
  if (typeof data !== 'string') {
    stringData = String(data);
  } else {
    stringData = data;
  }
  
  // First escape newlines and carriage returns, then remove other control characters
  return stringData
    .replace(/\n/g, '\\n') // Escape newlines
    .replace(/\r/g, '\\r') // Escape carriage returns
    .replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '') // eslint-disable-line no-control-regex
    .substring(0, 1000); // Limit length
}

/**
 * Security audit log with typed events
 */
export function securityLog(event: SecurityEventType, details: Record<string, unknown> = {}): void {
  const timestamp = new Date().toISOString();
  const sanitizedDetails = Object.entries(details)
    .map(([key, value]) => `${key}="${sanitizeForLog(value)}"`)
    .join(' ');
    
  console.warn(`[SECURITY] ${timestamp} event="${event}" ${sanitizedDetails}`);
}