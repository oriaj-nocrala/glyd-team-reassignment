import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import { injectable } from 'tsyringe';
import { InvalidCsvError } from '../../errors';
import { SpendRecord, SpendCSVRow } from '../../types';
import { logger } from '../../utils/logger';

/**
 * Specialized parser for spend data
 * Handles both CSV and Excel formats with proper error handling
 * Follows Single Responsibility Principle - only parses spending records
 */
@injectable()
export class SpendParser {
  /**
   * Parse spend file (CSV or Excel) and return array of spend records
   */
  async parseSpendFromFile(filePath: string): Promise<SpendRecord[]> {
    const extension = path.extname(filePath).toLowerCase();
    
    switch (extension) {
      case '.csv':
        return this.parseSpendFromCSV(filePath);
      case '.xlsx':
        return this.parseSpendFromExcel(filePath);
      default:
        throw new InvalidCsvError(`Unsupported file format: ${extension}. Supported formats: .csv, .xlsx`, []);
    }
  }

  /**
   * Parse spend CSV file
   */
  async parseSpendFromCSV(filePath: string): Promise<SpendRecord[]> {
    return new Promise((resolve, reject) => {
      const spends: SpendRecord[] = [];
      const invalidRows: { row: SpendCSVRow; error: Error }[] = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row: SpendCSVRow) => {
          try {
            const spend = this.parseSpendRow(row);
            spends.push(spend);
          } catch (error) {
            invalidRows.push({ row, error: error as Error });
          }
        })
        .on('end', () => {
          if (invalidRows.length > 0) {
            reject(new InvalidCsvError(`Failed to parse ${invalidRows.length} spend rows from CSV`, invalidRows));
            return;
          }
          
          logger.log(`Successfully parsed ${spends.length} spend records from CSV`);
          resolve(spends);
        })
        .on('error', (error) => {
          reject(new Error(`Failed to parse CSV spends: ${error.message}`));
        });
    });
  }

  /**
   * Parse spend Excel file
   */
  async parseSpendFromExcel(filePath: string): Promise<SpendRecord[]> {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: SpendCSVRow[] = XLSX.utils.sheet_to_json(worksheet);
      
      const spends: SpendRecord[] = [];
      const invalidRows: { row: SpendCSVRow; error: Error }[] = [];
      
      jsonData.forEach((row) => {
        try {
          const spend = this.parseSpendRow(row);
          spends.push(spend);
        } catch (error) {
          invalidRows.push({ row, error: error as Error });
        }
      });
      
      if (invalidRows.length > 0) {
        throw new InvalidCsvError(`Failed to parse ${invalidRows.length} spend rows from Excel`, invalidRows);
      }
      
      logger.log(`Successfully parsed ${spends.length} spend records from Excel`);
      return spends;
    } catch (error) {
      if (error instanceof InvalidCsvError) throw error;
      throw new Error(`Failed to parse Excel spends: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse and validate a single spend row
   */
  private parseSpendRow(row: SpendCSVRow): SpendRecord {
    const id = parseInt(row.id);
    const playerId = parseInt(row.player_id);
    const ts = parseInt(row.ts);
    const itemId = parseInt(row.item_id);
    const pointsSpent = parseInt(row.points_spent) || 0;

    // Validation
    if (isNaN(id) || isNaN(playerId) || isNaN(ts) || isNaN(itemId)) {
      throw new Error('Invalid numeric values in spend row');
    }

    if (!row.item_category || row.item_category.trim() === '') {
      throw new Error('Missing or empty item_category');
    }

    // Parse boolean fields
    const isConsumable = row.is_consumable === 'true' || row.is_consumable === '1';
    const isConsumed = row.is_consumed === 'true' || row.is_consumed === '1';
    const consumedTs = row.consumed_ts ? parseInt(row.consumed_ts) : undefined;

    // Validate consumption consistency
    if (isConsumed && !isConsumable) {
      throw new Error('Item marked as consumed but not consumable');
    }

    if (isConsumed && (consumedTs === undefined || isNaN(consumedTs))) {
      throw new Error('Item marked as consumed but missing valid consumed_ts');
    }

    return {
      id,
      player_id: playerId,
      ts,
      item_id: itemId,
      item_category: row.item_category.trim(),
      points_spent: pointsSpent,
      is_consumable: isConsumable,
      is_consumed: isConsumed,
      consumed_ts: consumedTs,
    };
  }
}