import { validatePathSecure, checkRateLimit, securityLog } from './security';

/**
 * Legacy path validator - now uses enhanced security
 * @deprecated Use validatePathSecure directly for better security
 */
export function validatePath(filePath: string, isOutput: boolean = false): string {
  try {
    // Apply rate limiting
    checkRateLimit();
    
    // Use enhanced security validation
    const validatedPath = validatePathSecure(filePath, isOutput);
    
    // Log security event
    securityLog('path_validated', {
      path: filePath,
      isOutput,
      result: 'success'
    });
    
    return validatedPath;
  } catch (error) {
    // Log security violation
    securityLog('path_validation_failed', {
      path: filePath,
      error: error instanceof Error ? error.message : String(error),
      isOutput
    });
    
    throw error;
  }
}
