import 'reflect-metadata';
import { 
  validatePathSecure,
  checkRateLimit,
  validateFileContent,
  generateFileHash,
  sanitizeForLog,
  securityLog,
  SECURITY_CONFIG 
} from '../src/utils/security';
import * as fs from 'fs';
import * as path from 'path';

describe('Security Module', () => {
  // Use project root for tests to avoid path traversal issues
  const projectRoot = process.cwd();
  const tempDir = path.join(projectRoot, 'temp-test');
  
  beforeEach(() => {
    // Create temp directory for tests within project scope
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up temp files
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('validatePathSecure', () => {
    it('should validate legitimate CSV files', () => {
      const testFile = path.join(tempDir, 'test.csv');
      fs.writeFileSync(testFile, 'header\ndata');
      
      const result = validatePathSecure(testFile);
      expect(result).toBe(path.resolve(testFile));
    });

    it('should validate legitimate JSON files', () => {
      const testFile = path.join(tempDir, 'test.json');
      fs.writeFileSync(testFile, '{"test": "data"}');
      
      const result = validatePathSecure(testFile);
      expect(result).toBe(path.resolve(testFile));
    });

    it('should reject empty file paths', () => {
      expect(() => validatePathSecure('')).toThrow('Invalid file path: must be a non-empty string');
    });

    it('should reject non-string inputs', () => {
      expect(() => validatePathSecure(null as any)).toThrow('Invalid file path: must be a non-empty string');
      expect(() => validatePathSecure(undefined as any)).toThrow('Invalid file path: must be a non-empty string');
    });

    it('should reject paths that are too long', () => {
      const longPath = 'a'.repeat(SECURITY_CONFIG.MAX_PATH_LENGTH + 1) + '.csv';
      expect(() => validatePathSecure(longPath)).toThrow('File path too long');
    });

    it('should reject disallowed file extensions', () => {
      const testFile = path.join(tempDir, 'test.exe');
      fs.writeFileSync(testFile, 'fake exe');
      expect(() => validatePathSecure(testFile)).toThrow('File extension not allowed: .exe');
      
      const jsFile = path.join(tempDir, 'test.js');
      fs.writeFileSync(jsFile, 'console.log("test");');
      expect(() => validatePathSecure(jsFile)).toThrow('File extension not allowed: .js');
    });

    it('should reject path traversal attempts', () => {
      expect(() => validatePathSecure('../../../etc/passwd.csv')).toThrow('Access denied: path outside project directory');
      expect(() => validatePathSecure('../../test.csv')).toThrow('Access denied: path outside project directory');
    });

    it('should sanitize dangerous characters', () => {
      const testFile = path.join(tempDir, 'testscript.csv'); // sanitized name
      fs.writeFileSync(testFile, 'data');
      
      // Test with dangerous chars that should be sanitized
      const dangerousPath = path.join(tempDir, 'test<script>.csv');
      const result = validatePathSecure(dangerousPath);
      expect(result).toBe(path.resolve(testFile));
    });

    it('should reject files that are too large', () => {
      const testFile = path.join(tempDir, 'large.csv');
      const largeContent = 'x'.repeat(SECURITY_CONFIG.MAX_FILE_SIZE + 1);
      fs.writeFileSync(testFile, largeContent);
      
      expect(() => validatePathSecure(testFile)).toThrow('File too large');
    });

    it('should reject non-existent input files', () => {
      const nonExistentFile = path.join(tempDir, 'nonexistent.csv');
      expect(() => validatePathSecure(nonExistentFile, false)).toThrow('Input file not found');
    });

    it('should allow non-existent output files', () => {
      const outputFile = path.join(tempDir, 'output.csv');
      expect(() => validatePathSecure(outputFile, true)).not.toThrow();
    });
  });

  describe('checkRateLimit', () => {
    it('should allow operations under the limit', () => {
      for (let i = 0; i < SECURITY_CONFIG.RATE_LIMIT_MAX_FILES; i++) {
        expect(() => checkRateLimit('test-client')).not.toThrow();
      }
    });

    it('should throw error when rate limit exceeded', () => {
      const clientId = 'test-client-exceeded';
      // Exhaust the rate limit
      for (let i = 0; i < SECURITY_CONFIG.RATE_LIMIT_MAX_FILES; i++) {
        checkRateLimit(clientId);
      }
      
      // Next call should throw
      expect(() => checkRateLimit(clientId)).toThrow('Rate limit exceeded: too many file operations');
    });

    it('should reset rate limit after window expires', () => {
      const clientId = 'test-client-window';
      const dateSpy = jest.spyOn(Date, 'now');
      let mockTime = 1000000;
      dateSpy.mockImplementation(() => mockTime);
      
      try {
        // Exhaust rate limit
        for (let i = 0; i < SECURITY_CONFIG.RATE_LIMIT_MAX_FILES; i++) {
          checkRateLimit(clientId);
        }
        
        // Move time forward past window
        mockTime += SECURITY_CONFIG.RATE_LIMIT_WINDOW + 1000;
        
        // Should now allow operations again
        expect(() => checkRateLimit(clientId)).not.toThrow();
      } finally {
        dateSpy.mockRestore();
      }
    });

    it('should track different clients separately', () => {
      // Exhaust limit for client1
      for (let i = 0; i < SECURITY_CONFIG.RATE_LIMIT_MAX_FILES; i++) {
        checkRateLimit('client1');
      }
      
      // client2 should still be able to operate
      expect(() => checkRateLimit('client2')).not.toThrow();
      
      // But client1 should be blocked
      expect(() => checkRateLimit('client1')).toThrow('Rate limit exceeded: too many file operations');
    });
  });

  describe('validateFileContent', () => {
    it('should accept clean content', () => {
      const cleanContent = 'player_id,name\n1,John\n2,Jane';
      expect(() => validateFileContent(cleanContent)).not.toThrow();
    });

    it('should reject script tags', () => {
      const maliciousContent = 'data<script>alert("xss")</script>';
      expect(() => validateFileContent(maliciousContent)).toThrow('Potentially malicious content detected');
    });

    it('should reject javascript: URLs', () => {
      const maliciousContent = 'javascript:alert("xss")';
      expect(() => validateFileContent(maliciousContent)).toThrow('Potentially malicious content detected');
    });

    it('should reject vbscript: URLs', () => {
      const maliciousContent = 'vbscript:msgbox("xss")';
      expect(() => validateFileContent(maliciousContent)).toThrow('Potentially malicious content detected');
    });

    it('should reject data URLs with HTML', () => {
      const maliciousContent = 'data:text/html,<script>alert(1)</script>';
      expect(() => validateFileContent(maliciousContent)).toThrow('Potentially malicious content detected');
    });

    it('should reject event handlers', () => {
      const maliciousContent = '<div onclick="alert(1)">test</div>';
      expect(() => validateFileContent(maliciousContent)).toThrow('Potentially malicious content detected');
    });

    it('should reject content that is too large', () => {
      const largeContent = 'x'.repeat(SECURITY_CONFIG.MAX_FILE_SIZE + 1);
      expect(() => validateFileContent(largeContent)).toThrow('Content too large');
    });
  });

  describe('generateFileHash', () => {
    it('should generate consistent hashes for same content', () => {
      const content = 'test content';
      const hash1 = generateFileHash(content);
      const hash2 = generateFileHash(content);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 is 64 hex chars
    });

    it('should generate different hashes for different content', () => {
      const content1 = 'test content 1';
      const content2 = 'test content 2';
      const hash1 = generateFileHash(content1);
      const hash2 = generateFileHash(content2);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should generate expected hash for known input', () => {
      const content = 'hello world';
      const hash = generateFileHash(content);
      // Known SHA-256 hash for "hello world"
      expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
    });
  });

  describe('sanitizeForLog', () => {
    it('should handle string inputs', () => {
      const result = sanitizeForLog('normal string');
      expect(result).toBe('normal string');
    });

    it('should convert non-string inputs to strings', () => {
      expect(sanitizeForLog(123)).toBe('123');
      expect(sanitizeForLog(true)).toBe('true');
      expect(sanitizeForLog(null)).toBe('null');
      expect(sanitizeForLog(undefined)).toBe('undefined');
      expect(sanitizeForLog({ key: 'value' })).toBe('[object Object]');
    });

    it('should remove control characters', () => {
      const maliciousInput = 'test\x00\x01\x1f\x7f\x9f';
      const result = sanitizeForLog(maliciousInput);
      expect(result).toBe('test');
    });

    it('should escape newlines and carriage returns', () => {
      const input = 'line1\nline2\rline3';
      const result = sanitizeForLog(input);
      expect(result).toBe('line1\\nline2\\rline3');
    });

    it('should limit length to 1000 characters', () => {
      const longInput = 'a'.repeat(1500);
      const result = sanitizeForLog(longInput);
      expect(result).toHaveLength(1000);
      expect(result).toBe('a'.repeat(1000));
    });

    it('should handle empty strings', () => {
      expect(sanitizeForLog('')).toBe('');
    });
  });

  describe('securityLog', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log security events with timestamp', () => {
      securityLog('path_validated');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[SECURITY\] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z event="path_validated" $/)
      );
    });

    it('should include sanitized details', () => {
      securityLog('path_validated', { user: 'admin', action: 'login' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/user="admin" action="login"/)
      );
    });

    it('should sanitize malicious details', () => {
      securityLog('content_validation_failed', { malicious: 'test\x00\ninjection' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/malicious="test\\ninjection"/)
      );
    });

    it('should handle empty details object', () => {
      securityLog('file_access_denied', {});
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[SECURITY\] .+ event="file_access_denied" $/)
      );
    });
  });

  describe('SECURITY_CONFIG', () => {
    it('should have reasonable default values', () => {
      expect(SECURITY_CONFIG.MAX_FILE_SIZE).toBe(50 * 1024 * 1024); // 50MB
      expect(SECURITY_CONFIG.ALLOWED_EXTENSIONS).toEqual(['.csv', '.json', '.xlsx']);
      expect(SECURITY_CONFIG.MAX_PATH_LENGTH).toBe(260);
      expect(SECURITY_CONFIG.RATE_LIMIT_WINDOW).toBe(60000); // 1 minute
      expect(SECURITY_CONFIG.RATE_LIMIT_MAX_FILES).toBe(10);
    });

    it('should be properly typed', () => {
      expect(SECURITY_CONFIG).toBeDefined();
      expect(typeof SECURITY_CONFIG.MAX_FILE_SIZE).toBe('number');
      expect(Array.isArray(SECURITY_CONFIG.ALLOWED_EXTENSIONS)).toBe(true);
      expect(SECURITY_CONFIG.ALLOWED_EXTENSIONS.includes('.csv')).toBe(true);
      expect(SECURITY_CONFIG.ALLOWED_EXTENSIONS.includes('.json')).toBe(true);
      expect(SECURITY_CONFIG.ALLOWED_EXTENSIONS.includes('.xlsx')).toBe(true);
    });
  });
});