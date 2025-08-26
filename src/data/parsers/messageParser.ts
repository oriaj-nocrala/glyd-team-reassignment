import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import { injectable } from 'tsyringe';
import { InvalidCsvError } from '../../errors';
import { MessageRecord, MessageCSVRow } from '../../types';
import { logger } from '../../utils/logger';

/**
 * Specialized parser for message data
 * Handles both CSV and Excel formats with proper error handling
 * Follows Single Responsibility Principle - only parses messages
 */
@injectable()
export class MessageParser {
  /**
   * Parse messages file (CSV or Excel) and return array of messages
   */
  async parseMessagesFromFile(filePath: string): Promise<MessageRecord[]> {
    const extension = path.extname(filePath).toLowerCase();
    
    switch (extension) {
      case '.csv':
        return this.parseMessagesFromCSV(filePath);
      case '.xlsx':
        return this.parseMessagesFromExcel(filePath);
      default:
        throw new InvalidCsvError(`Unsupported file format: ${extension}. Supported formats: .csv, .xlsx`, []);
    }
  }

  /**
   * Parse messages CSV file
   */
  async parseMessagesFromCSV(filePath: string): Promise<MessageRecord[]> {
    return new Promise((resolve, reject) => {
      const messages: MessageRecord[] = [];
      const invalidRows: { row: MessageCSVRow; error: Error }[] = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row: MessageCSVRow) => {
          try {
            const message = this.parseMessageRow(row);
            messages.push(message);
          } catch (error) {
            invalidRows.push({ row, error: error as Error });
          }
        })
        .on('end', () => {
          if (invalidRows.length > 0) {
            reject(new InvalidCsvError(`Failed to parse ${invalidRows.length} message rows from CSV`, invalidRows));
            return;
          }
          
          logger.log(`Successfully parsed ${messages.length} messages from CSV`);
          resolve(messages);
        })
        .on('error', (error) => {
          reject(new Error(`Failed to parse CSV messages: ${error.message}`));
        });
    });
  }

  /**
   * Parse messages Excel file
   */
  async parseMessagesFromExcel(filePath: string): Promise<MessageRecord[]> {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: MessageCSVRow[] = XLSX.utils.sheet_to_json(worksheet);
      
      const messages: MessageRecord[] = [];
      const invalidRows: { row: MessageCSVRow; error: Error }[] = [];
      
      jsonData.forEach((row) => {
        try {
          const message = this.parseMessageRow(row);
          messages.push(message);
        } catch (error) {
          invalidRows.push({ row, error: error as Error });
        }
      });
      
      if (invalidRows.length > 0) {
        throw new InvalidCsvError(`Failed to parse ${invalidRows.length} message rows from Excel`, invalidRows);
      }
      
      logger.log(`Successfully parsed ${messages.length} messages from Excel`);
      return messages;
    } catch (error) {
      if (error instanceof InvalidCsvError) throw error;
      throw new Error(`Failed to parse Excel messages: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse and validate a single message row
   */
  private parseMessageRow(row: MessageCSVRow): MessageRecord {
    const id = parseInt(row.id);
    const playerId = parseInt(row.player_id);
    const ts = parseInt(row.ts);
    const textLength = parseInt(row.text_length);

    // Validation
    if (isNaN(id) || isNaN(playerId) || isNaN(ts) || isNaN(textLength)) {
      throw new Error('Invalid numeric values in message row');
    }

    // Parse boolean fields
    const isMessageReply = row.is_message_reply === 'true' || row.is_message_reply === '1';
    const messageReplyToId = row.message_reply_to_id ? parseInt(row.message_reply_to_id) : undefined;

    // Validate reply consistency
    if (isMessageReply && (messageReplyToId === undefined || isNaN(messageReplyToId))) {
      throw new Error('Message marked as reply but missing valid message_reply_to_id');
    }

    return {
      id,
      player_id: playerId,
      ts,
      text_length: textLength,
      is_message_reply: isMessageReply,
      message_reply_to_id: messageReplyToId,
    };
  }
}