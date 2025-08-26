import { injectable } from 'tsyringe';
import { EventParser } from './parsers/eventParser';
import { MessageParser } from './parsers/messageParser';
import { SpendParser } from './parsers/spendParser';
import { EventRecord, MessageRecord, SpendRecord } from '../types';
import { logger } from '../utils/logger';

export interface LevelBData {
  events: EventRecord[];
  messages: MessageRecord[];
  spends: SpendRecord[];
}

export interface LevelBDataPaths {
  events?: string;
  messages?: string;
  spends?: string;
}

export interface LevelBSummary {
  events_summary: {
    total_count: number;
    unique_players: number;
    date_range: { earliest: number; latest: number };
    engagement_types: Set<string>;
    total_points_used: number;
  };
  messages_summary: {
    total_count: number;
    unique_players: number;
    total_characters: number;
    reply_rate: number;
  };
  spends_summary: {
    total_count: number;
    unique_players: number;
    total_points_spent: number;
    categories: Set<string>;
    consumable_rate: number;
  };
}

/**
 * Orchestrates Level B data parsing by delegating to specialized parsers
 * Follows Single Responsibility Principle - coordinates parsing without doing the work
 * 
 * This demonstrates proper separation of concerns:
 * - Each parser handles one data type
 * - This orchestrator manages the workflow
 * - Clear, testable, maintainable architecture
 */
@injectable()
export class LevelBDataOrchestrator {
  constructor(
    private readonly eventParser: EventParser,
    private readonly messageParser: MessageParser,
    private readonly spendParser: SpendParser
  ) {}

  /**
   * Parse all Level B data files
   */
  async parseAllLevelBData(paths?: LevelBDataPaths): Promise<LevelBData> {
    logger.log('🔄 Loading Level B raw data...');

    const [events, messages, spends] = await Promise.all([
      this.eventParser.parseEventsFromFile(paths?.events || 'data/level_b_events.csv'),
      this.messageParser.parseMessagesFromFile(paths?.messages || 'data/level_b_messages.csv'),
      this.spendParser.parseSpendFromFile(paths?.spends || 'data/level_b_spend.csv'),
    ]);

    logger.log(`📊 Level B Data Summary:`);
    logger.log(`   • Events: ${events.length} records`);
    logger.log(`   • Messages: ${messages.length} records`);
    logger.log(`   • Spends: ${spends.length} records`);

    return { events, messages, spends };
  }

  /**
   * Generate summary statistics for Level B data
   */
  getLevelBSummary(events: EventRecord[], messages: MessageRecord[], spends: SpendRecord[]): LevelBSummary {
    return {
      events_summary: this.generateEventsSummary(events),
      messages_summary: this.generateMessagesSummary(messages),
      spends_summary: this.generateSpendsSummary(spends),
    };
  }

  private generateEventsSummary(events: EventRecord[]): LevelBSummary['events_summary'] {
    if (events.length === 0) {
      return {
        total_count: 0,
        unique_players: 0,
        date_range: { earliest: 0, latest: 0 },
        engagement_types: new Set(),
        total_points_used: 0,
      };
    }

    const uniquePlayers = new Set(events.map(e => e.player_id)).size;
    const timestamps = events.map(e => e.ts);
    const engagementTypes = new Set(events.map(e => e.engagement_kind));
    const totalPointsUsed = events.reduce((sum, e) => sum + e.points_used, 0);

    return {
      total_count: events.length,
      unique_players: uniquePlayers,
      date_range: {
        earliest: Math.min(...timestamps),
        latest: Math.max(...timestamps),
      },
      engagement_types: engagementTypes,
      total_points_used: totalPointsUsed,
    };
  }

  private generateMessagesSummary(messages: MessageRecord[]): LevelBSummary['messages_summary'] {
    if (messages.length === 0) {
      return {
        total_count: 0,
        unique_players: 0,
        total_characters: 0,
        reply_rate: 0,
      };
    }

    const uniquePlayers = new Set(messages.map(m => m.player_id)).size;
    const totalCharacters = messages.reduce((sum, m) => sum + m.text_length, 0);
    const replies = messages.filter(m => m.is_message_reply).length;
    const replyRate = (replies / messages.length) * 100;

    return {
      total_count: messages.length,
      unique_players: uniquePlayers,
      total_characters: totalCharacters,
      reply_rate: Math.round(replyRate * 100) / 100,
    };
  }

  private generateSpendsSummary(spends: SpendRecord[]): LevelBSummary['spends_summary'] {
    if (spends.length === 0) {
      return {
        total_count: 0,
        unique_players: 0,
        total_points_spent: 0,
        categories: new Set(),
        consumable_rate: 0,
      };
    }

    const uniquePlayers = new Set(spends.map(s => s.player_id)).size;
    const totalPointsSpent = spends.reduce((sum, s) => sum + s.points_spent, 0);
    const categories = new Set(spends.map(s => s.item_category));
    const consumables = spends.filter(s => s.is_consumable).length;
    const consumableRate = (consumables / spends.length) * 100;

    return {
      total_count: spends.length,
      unique_players: uniquePlayers,
      total_points_spent: totalPointsSpent,
      categories: categories,
      consumable_rate: Math.round(consumableRate * 100) / 100,
    };
  }
}