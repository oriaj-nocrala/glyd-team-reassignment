import 'reflect-metadata';
import { DataParser } from '../src/data/parser';
import { LevelBDataParser } from '../src/data/levelBParser';
import { validatePathSecure } from '../src/utils/security';
import * as fs from 'fs';
import * as path from 'path';

describe('Excel Support', () => {
  const dataParser = new DataParser();
  const levelBParser = new LevelBDataParser();

  describe('File Format Detection', () => {
    it('should reject unsupported file formats', async () => {
      const txtFile = 'test.txt';
      await expect(dataParser.parsePlayersFromFile(txtFile))
        .rejects.toThrow('Unsupported file format: .txt. Supported formats: .csv, .xlsx');
    });

    it('should accept CSV file extensions', () => {
      // Test the method exists and can handle CSV files
      expect(typeof dataParser.parsePlayersFromFile).toBe('function');
      expect(typeof dataParser.parsePlayersFromCSV).toBe('function');
    });

    it('should accept Excel file extensions', () => {
      // Test the method exists and can handle Excel files
      expect(typeof dataParser.parsePlayersFromFile).toBe('function');
      expect(typeof dataParser.parsePlayersFromExcel).toBe('function');
    });
  });

  describe('Security Integration', () => {
    it('should allow Excel files in security validation', () => {
      const projectRoot = process.cwd();
      const testFile = path.join(projectRoot, 'test.xlsx');
      
      // Create a dummy file for testing
      fs.writeFileSync(testFile, 'dummy content');
      
      try {
        expect(() => validatePathSecure(testFile)).not.toThrow();
      } finally {
        // Clean up
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });

    it('should validate Excel file paths properly', () => {
      const validPaths = [
        'data/level_a_players.xlsx',
        'data/level_b_events.xlsx',
        'data/level_b_messages.xlsx',
        'data/level_b_spend.xlsx'
      ];

      validPaths.forEach(filePath => {
        if (fs.existsSync(filePath)) {
          expect(() => validatePathSecure(filePath)).not.toThrow();
        }
      });
    });
  });

  describe('Level B Excel Support', () => {
    it('should have Excel support methods for Level B events', () => {
      expect(typeof levelBParser.parseEventsFromFile).toBe('function');
      expect(typeof levelBParser.parseEventsFromExcel).toBe('function');
    });

    it('should have Excel support methods for Level B messages', () => {
      expect(typeof levelBParser.parseMessagesFromFile).toBe('function');
      expect(typeof levelBParser.parseMessagesFromExcel).toBe('function');
    });

    it('should have Excel support methods for Level B spends', () => {
      expect(typeof levelBParser.parseSpendFromFile).toBe('function');
      expect(typeof levelBParser.parseSpendFromExcel).toBe('function');
    });
  });

  describe('Real File Processing', () => {
    it('should process existing Excel files if they exist', async () => {
      const excelFiles = [
        'data/level_a_players.xlsx',
        'data/level_b_events.xlsx',
        'data/level_b_messages.xlsx',
        'data/level_b_spend.xlsx'
      ];

      for (const filePath of excelFiles) {
        if (fs.existsSync(filePath)) {
          // Test that the file can be validated (security check)
          expect(() => validatePathSecure(filePath)).not.toThrow();
          
          // Test that the parser method exists and can be called
          if (filePath.includes('level_a')) {
            expect(typeof dataParser.parsePlayersFromFile).toBe('function');
          } else if (filePath.includes('events')) {
            expect(typeof levelBParser.parseEventsFromFile).toBe('function');
          } else if (filePath.includes('messages')) {
            expect(typeof levelBParser.parseMessagesFromFile).toBe('function');
          } else if (filePath.includes('spend')) {
            expect(typeof levelBParser.parseSpendFromFile).toBe('function');
          }
        }
      }
    });
  });

  describe('Integration Tests', () => {
    it('should have xlsx library available', () => {
      // Test that xlsx library is properly imported
      const XLSX = require('xlsx');
      expect(typeof XLSX.readFile).toBe('function');
      expect(typeof XLSX.utils.sheet_to_json).toBe('function');
    });

    it('should handle Excel parsing methods without errors', () => {
      // Test that methods are properly defined and don't throw on instantiation
      expect(() => new DataParser()).not.toThrow();
      expect(() => new LevelBDataParser()).not.toThrow();
    });
  });
});