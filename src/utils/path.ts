import { validatePathSecure } from './securitySimplified';

/**
 * Simplified path validator appropriate for CLI tools
 * Provides essential security without CLI overhead
 */
export function validatePath(filePath: string, isOutput: boolean = false): string {
  return validatePathSecure(filePath, isOutput);
}
