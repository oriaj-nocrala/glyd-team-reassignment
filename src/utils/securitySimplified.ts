import * as path from 'path';
import * as fs from 'fs';

/**
 * Simplified security validation for CLI tool context
 * Provides essential security without overengineering for local usage
 * 
 * Focus on:
 * - Path traversal protection (essential)
 * - File type validation (essential)  
 * - Input validation (essential)
 * 
 * Removed:
 * - Rate limiting (unnecessary for CLI)
 * - Verbose security logging (overkill for CLI)
 * - Complex sanitization (appropriate for web, not CLI)
 */

export type AllowedExtension = '.csv' | '.json' | '.xlsx';

export const ALLOWED_EXTENSIONS: readonly AllowedExtension[] = ['.csv', '.json', '.xlsx'] as const;
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_PATH_LENGTH = 260;

/**
 * Validate file path for security concerns
 * Essential security checks without CLI overhead
 */
export function validatePathSecure(filePath: string, isOutput: boolean = false): string {
  // Basic input validation
  if (typeof filePath !== 'string' || filePath.length === 0) {
    throw new Error('Invalid file path: must be a non-empty string');
  }

  if (filePath.length > MAX_PATH_LENGTH) {
    throw new Error(`File path too long (max ${MAX_PATH_LENGTH} characters)`);
  }

  // Resolve and normalize path
  const resolvedPath = path.resolve(filePath);
  const normalizedPath = path.normalize(resolvedPath);
  
  // Critical: prevent path traversal attacks
  const projectRoot = path.resolve(process.cwd());
  if (!normalizedPath.startsWith(projectRoot + path.sep) && normalizedPath !== projectRoot) {
    throw new Error('Access denied: path outside project directory');
  }

  // Validate file extension
  const ext = path.extname(normalizedPath).toLowerCase() as AllowedExtension;
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`Unsupported file format: ${ext}. Supported: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }

  // Check file exists for input files
  if (!isOutput && !fs.existsSync(normalizedPath)) {
    throw new Error(`File not found: ${normalizedPath}`);
  }

  // File size check for existing files
  if (fs.existsSync(normalizedPath)) {
    const stats = fs.statSync(normalizedPath);
    if (stats.size > MAX_FILE_SIZE) {
      throw new Error(`File too large (max ${MAX_FILE_SIZE / (1024 * 1024)}MB)`);
    }
  }

  return normalizedPath;
}

/**
 * Basic input sanitization for file content
 * Prevents obvious injection attacks without over-sanitizing
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  // Remove/escape potential injection patterns
  return input
    .replace(/[\r\n]/g, ' ') // Replace line breaks with spaces
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
    .substring(0, 1000); // Reasonable length limit
}

/**
 * Validate numeric input
 */
export function validateNumber(value: string, fieldName: string): number {
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`Invalid ${fieldName}: must be a number`);
  }
  return num;
}

/**
 * Validate boolean input from string
 */
export function validateBoolean(value: string): boolean {
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  throw new Error(`Invalid boolean value: ${value}`);
}