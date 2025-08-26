import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import { injectable } from 'tsyringe';
import { InvalidCsvError } from '../../errors';
import { EventRecord, EventCSVRow } from '../../types';
import { logger } from '../../utils/logger';

/**
 * Specialized parser for event data
 * Handles both CSV and Excel formats with proper error handling
 * Follows Single Responsibility Principle - only parses events
 */
@injectable()
export class EventParser {
  /**
   * Parse events file (CSV or Excel) and return array of events
   */
  async parseEventsFromFile(filePath: string): Promise<EventRecord[]> {
    const extension = path.extname(filePath).toLowerCase();
    
    switch (extension) {
      case '.csv':
        return this.parseEventsFromCSV(filePath);
      case '.xlsx':
        return this.parseEventsFromExcel(filePath);
      default:
        throw new InvalidCsvError(`Unsupported file format: ${extension}. Supported formats: .csv, .xlsx`, []);
    }
  }

  /**
   * Parse events CSV file
   */
  async parseEventsFromCSV(filePath: string): Promise<EventRecord[]> {
    return new Promise((resolve, reject) => {
      const events: EventRecord[] = [];
      const invalidRows: { row: EventCSVRow; error: Error }[] = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row: EventCSVRow) => {
          try {
            const event = this.parseEventRow(row);
            events.push(event);
          } catch (error) {
            invalidRows.push({ row, error: error as Error });
          }
        })
        .on('end', () => {
          if (invalidRows.length > 0) {
            reject(new InvalidCsvError(`Failed to parse ${invalidRows.length} event rows from CSV`, invalidRows));
            return;
          }
          
          logger.log(`Successfully parsed ${events.length} events from CSV`);
          resolve(events);
        })
        .on('error', (error) => {
          reject(new Error(`Failed to parse CSV events: ${error.message}`));
        });
    });
  }

  /**
   * Parse events Excel file
   */
  async parseEventsFromExcel(filePath: string): Promise<EventRecord[]> {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: EventCSVRow[] = XLSX.utils.sheet_to_json(worksheet);
      
      const events: EventRecord[] = [];
      const invalidRows: { row: EventCSVRow; error: Error }[] = [];
      
      jsonData.forEach((row) => {
        try {
          const event = this.parseEventRow(row);
          events.push(event);
        } catch (error) {
          invalidRows.push({ row, error: error as Error });
        }
      });
      
      if (invalidRows.length > 0) {
        throw new InvalidCsvError(`Failed to parse ${invalidRows.length} event rows from Excel`, invalidRows);
      }
      
      logger.log(`Successfully parsed ${events.length} events from Excel`);
      return events;
    } catch (error) {
      if (error instanceof InvalidCsvError) throw error;
      throw new Error(`Failed to parse Excel events: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse and validate a single event row
   */
  private parseEventRow(row: EventCSVRow): EventRecord {
    const id = parseInt(row.id);
    const playerId = parseInt(row.player_id);
    const ts = parseInt(row.ts);
    const eventId = parseInt(row.event_id);
    const eventInstanceId = parseInt(row.event_instance_id);
    const pointsUsed = parseInt(row.points_used) || 0;

    // Validation
    if (isNaN(id) || isNaN(playerId) || isNaN(ts) || isNaN(eventId) || isNaN(eventInstanceId)) {
      throw new Error('Invalid numeric values in event row');
    }

    if (!row.engagement_kind || row.engagement_kind.trim() === '') {
      throw new Error('Missing or empty engagement_kind');
    }

    return {
      id,
      player_id: playerId,
      ts,
      event_id: eventId,
      event_instance_id: eventInstanceId,
      engagement_kind: row.engagement_kind.trim(),
      points_used: pointsUsed,
    };
  }
}