import * as fs from 'fs';
import csv from 'csv-parser';
import { InvalidCsvError } from '../errors';
import {
  EventRecord,
  MessageRecord,
  SpendRecord,
  EventCSVRow,
  MessageCSVRow,
  SpendCSVRow,
} from '../types';
import { logger } from '../utils/logger';


export class LevelBDataParser {
  /**
   * Parse events CSV file
   */
  static async parseEventsFromCSV(filePath: string): Promise<EventRecord[]> {
    return new Promise((resolve, reject) => {
      const events: EventRecord[] = [];
      const invalidRows: { row: EventCSVRow; error: Error }[] = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row: EventCSVRow) => {
          try {
            const playerId = parseInt(row.player_id);
            if (isNaN(playerId)) {
              throw new Error('Invalid player_id');
            }
            const event: EventRecord = {
              id: parseInt(row.id),
              player_id: playerId,
              ts: parseInt(row.ts),
              event_id: parseInt(row.event_id),
              event_instance_id: parseInt(row.event_instance_id),
              engagement_kind: row.engagement_kind || '',
              points_used: parseInt(row.points_used) || 0,
            };
            events.push(event);
          } catch (error) {
            invalidRows.push({ row, error: error as Error });
          }
        })
        .on('end', () => {
          if (invalidRows.length > 0) {
            const errorMessage = `Failed to parse ${invalidRows.length} event rows.`;
            reject(new InvalidCsvError(errorMessage, invalidRows));
          } else {
            logger.log(`Successfully parsed ${events.length} events from CSV`);
            resolve(events);
          }
        })
        .on('error', (error: Error) => {
          reject(new Error(`Failed to parse events CSV: ${error.message}`));
        });
    });
  }

  /**
   * Parse messages CSV file
   */
  static async parseMessagesFromCSV(filePath: string): Promise<MessageRecord[]> {
    return new Promise((resolve, reject) => {
      const messages: MessageRecord[] = [];
      const invalidRows: { row: MessageCSVRow; error: Error }[] = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row: MessageCSVRow) => {
          try {
            const playerId = parseInt(row.player_id);
            if (isNaN(playerId)) {
              throw new Error('Invalid player_id');
            }
            const message: MessageRecord = {
              id: parseInt(row.id),
              player_id: playerId,
              ts: parseInt(row.ts),
              text_length: parseInt(row.text_length) || 0,
              is_message_reply: row.is_message_reply === 'True' || row.is_message_reply === 'true',
              message_reply_to_id: row.message_reply_to_id
                ? parseInt(row.message_reply_to_id)
                : undefined,
            };
            messages.push(message);
          } catch (error) {
            invalidRows.push({ row, error: error as Error });
          }
        })
        .on('end', () => {
          if (invalidRows.length > 0) {
            const errorMessage = `Failed to parse ${invalidRows.length} message rows.`;
            reject(new InvalidCsvError(errorMessage, invalidRows));
          } else {
            logger.log(`Successfully parsed ${messages.length} messages from CSV`);
            resolve(messages);
          }
        })
        .on('error', (error: Error) => {
          reject(new Error(`Failed to parse messages CSV: ${error.message}`));
        });
    });
  }

  /**
   * Parse spend CSV file
   */
  static async parseSpendFromCSV(filePath: string): Promise<SpendRecord[]> {
    return new Promise((resolve, reject) => {
      const spends: SpendRecord[] = [];
      const invalidRows: { row: SpendCSVRow; error: Error }[] = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row: SpendCSVRow) => {
          try {
            const playerId = parseInt(row.player_id);
            if (isNaN(playerId)) {
              throw new Error('Invalid player_id');
            }
            const spend: SpendRecord = {
              id: parseInt(row.id),
              player_id: playerId,
              ts: parseInt(row.ts),
              item_id: parseInt(row.item_id),
              item_category: row.item_category || '',
              points_spent: parseInt(row.points_spent) || 0,
              is_consumable: row.is_consumable === 'True' || row.is_consumable === 'true',
              is_consumed: row.is_consumed === 'True' || row.is_consumed === 'true',
              consumed_ts: row.consumed_ts ? parseInt(row.consumed_ts) : undefined,
            };
            spends.push(spend);
          } catch (error) {
            invalidRows.push({ row, error: error as Error });
          }
        })
        .on('end', () => {
          if (invalidRows.length > 0) {
            const errorMessage = `Failed to parse ${invalidRows.length} spend rows.`;
            reject(new InvalidCsvError(errorMessage, invalidRows));
          } else {
            logger.log(`Successfully parsed ${spends.length} spend records from CSV`);
            resolve(spends);
          }
        })
        .on('error', (error: Error) => {
          reject(new Error(`Failed to parse spend CSV: ${error.message}`));
        });
    });
  }

  /**
   * Parse all Level B data files
   */
  static async parseAllLevelBData(paths?: {
    events?: string;
    messages?: string;
    spends?: string;
  }): Promise<{
    events: EventRecord[];
    messages: MessageRecord[];
    spends: SpendRecord[];
  }> {
    logger.log('🔄 Loading Level B raw data...');

    const [events, messages, spends] = await Promise.all([
      this.parseEventsFromCSV(paths?.events || 'data/level_b_events.csv'),
      this.parseMessagesFromCSV(paths?.messages || 'data/level_b_messages.csv'),
      this.parseSpendFromCSV(paths?.spends || 'data/level_b_spend.csv'),
    ]);

    logger.log(`📊 Level B Data Summary:`);
    logger.log(`   • Events: ${events.length}`);
    logger.log(`   • Messages: ${messages.length}`);
    logger.log(`   • Spend records: ${spends.length}`);

    return { events, messages, spends };
  }

  /**
   * Get Level B data summary statistics
   */
  static getLevelBSummary(
    events: EventRecord[],
    messages: MessageRecord[],
    spends: SpendRecord[]
  ): {
    events_summary: {
      unique_players: number;
      unique_events: number;
      engagement_types: Set<string>;
      total_points_used: number;
      date_range: { start: number; end: number };
    };
    messages_summary: {
      unique_players: number;
      total_text_length: number;
      reply_rate: number;
      avg_message_length: number;
    };
    spends_summary: {
      unique_players: number;
      total_points_spent: number;
      consumable_rate: number;
      consumption_rate: number;
      categories: Set<string>;
    };
  } {
    // Events analysis
    const eventPlayers = new Set(events.map((e) => e.player_id));
    const uniqueEvents = new Set(events.map((e) => e.event_id));
    const engagementTypes = new Set(events.map((e) => e.engagement_kind));
    const totalPointsUsed = events.reduce((sum, e) => sum + e.points_used, 0);
    const eventTimestamps = events.map((e) => e.ts).sort();

    // Messages analysis
    const messagePlayers = new Set(messages.map((m) => m.player_id));
    const totalTextLength = messages.reduce((sum, m) => sum + m.text_length, 0);
    const replyCount = messages.filter((m) => m.is_message_reply).length;
    const avgMessageLength = totalTextLength / messages.length;

    // Spends analysis
    const spendPlayers = new Set(spends.map((s) => s.player_id));
    const totalPointsSpent = spends.reduce((sum, s) => sum + s.points_spent, 0);
    const consumableCount = spends.filter((s) => s.is_consumable).length;
    const consumedCount = spends.filter((s) => s.is_consumed).length;
    const categories = new Set(spends.map((s) => s.item_category));

    return {
      events_summary: {
        unique_players: eventPlayers.size,
        unique_events: uniqueEvents.size,
        engagement_types: engagementTypes,
        total_points_used: totalPointsUsed,
        date_range: {
          start: eventTimestamps[0] || 0,
          end: eventTimestamps[eventTimestamps.length - 1] || 0,
        },
      },
      messages_summary: {
        unique_players: messagePlayers.size,
        total_text_length: totalTextLength,
        reply_rate: replyCount / messages.length,
        avg_message_length: avgMessageLength,
      },
      spends_summary: {
        unique_players: spendPlayers.size,
        total_points_spent: totalPointsSpent,
        consumable_rate: consumableCount / spends.length,
        consumption_rate: consumedCount / consumableCount,
        categories: categories,
      },
    };
  }
}
