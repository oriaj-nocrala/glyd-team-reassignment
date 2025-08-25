import { Player, EventRecord, MessageRecord, SpendRecord, EnhancedPlayer } from '../types';
import { logger } from '../utils/logger';


export class FeatureEngineering {
  /**
   * Enhance players with Level B derived features
   */
  static enhancePlayersWithLevelB(
    players: Player[],
    events: EventRecord[],
    messages: MessageRecord[],
    spends: SpendRecord[]
  ): EnhancedPlayer[] {
    logger.log('🔬 Engineering advanced features from Level B data...');

    // Create lookup maps for efficient processing
    const eventsByPlayer = this.groupEventsByPlayer(events);
    const messagesByPlayer = this.groupMessagesByPlayer(messages);
    const spendsByPlayer = this.groupSpendsByPlayer(spends);

    const enhancedPlayers = players.map((player) => {
      const playerEvents = eventsByPlayer.get(player.player_id) || [];
      const playerMessages = messagesByPlayer.get(player.player_id) || [];
      const playerSpends = spendsByPlayer.get(player.player_id) || [];

      return {
        ...player,
        // Event quality metrics
        ...this.calculateEventQualityMetrics(playerEvents, events),
        // Communication metrics
        ...this.calculateCommunicationMetrics(playerMessages, messages),
        // Spending behavior metrics
        ...this.calculateSpendingMetrics(playerSpends, spends),
      };
    });

    logger.log(`✨ Enhanced ${enhancedPlayers.length} players with Level B features`);
    return enhancedPlayers;
  }

  /**
   * Group events by player ID for efficient lookup
   */
  private static groupEventsByPlayer(events: EventRecord[]): Map<number, EventRecord[]> {
    const grouped = new Map<number, EventRecord[]>();

    events.forEach((event) => {
      if (!grouped.has(event.player_id)) {
        grouped.set(event.player_id, []);
      }
      grouped.get(event.player_id)!.push(event);
    });

    return grouped;
  }

  /**
   * Group messages by player ID
   */
  private static groupMessagesByPlayer(messages: MessageRecord[]): Map<number, MessageRecord[]> {
    const grouped = new Map<number, MessageRecord[]>();

    messages.forEach((message) => {
      if (!grouped.has(message.player_id)) {
        grouped.set(message.player_id, []);
      }
      grouped.get(message.player_id)!.push(message);
    });

    return grouped;
  }

  /**
   * Group spend records by player ID
   */
  private static groupSpendsByPlayer(spends: SpendRecord[]): Map<number, SpendRecord[]> {
    const grouped = new Map<number, SpendRecord[]>();

    spends.forEach((spend) => {
      if (!grouped.has(spend.player_id)) {
        grouped.set(spend.player_id, []);
      }
      grouped.get(spend.player_id)!.push(spend);
    });

    return grouped;
  }

  /**
   * Calculate event quality metrics from raw events
   */
  private static calculateEventQualityMetrics(
    playerEvents: EventRecord[],
    allEvents: EventRecord[]
  ): {
    event_variety_score: number;
    high_value_events_ratio: number;
    engagement_consistency: number;
    recent_event_activity: number;
  } {
    if (playerEvents.length === 0) {
      return {
        event_variety_score: 0,
        high_value_events_ratio: 0,
        engagement_consistency: 0,
        recent_event_activity: 0,
      };
    }

    // Event variety: unique engagement types and events participated
    const uniqueEngagementTypes = new Set(playerEvents.map((e) => e.engagement_kind));
    const uniqueEvents = new Set(playerEvents.map((e) => e.event_id));
    const eventVarietyScore =
      (uniqueEngagementTypes.size + uniqueEvents.size) / (playerEvents.length + 1); // Normalize by total participations

    // High-value events: events where player spent above-average points
    const avgPointsUsed = allEvents.reduce((sum, e) => sum + e.points_used, 0) / allEvents.length;
    const highValueEvents = playerEvents.filter((e) => e.points_used > avgPointsUsed);
    const highValueEventsRatio = highValueEvents.length / playerEvents.length;

    // Engagement consistency: measure temporal distribution of events
    const timestamps = playerEvents.map((e) => e.ts).sort();
    let consistency = 0;
    if (timestamps.length > 1) {
      const intervals = [];
      for (let i = 1; i < timestamps.length; i++) {
        intervals.push(timestamps[i] - timestamps[i - 1]);
      }
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      const variance =
        intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) /
        intervals.length;
      // Lower variance = higher consistency (inverted and normalized)
      consistency = Math.max(0, 1 - Math.sqrt(variance) / avgInterval);
    }

    // Recent activity: events in last 30 days (assuming recent timestamps are higher)
    const maxTimestamp = Math.max(...allEvents.map((e) => e.ts));
    const thirtyDaysAgo = maxTimestamp - 30 * 24 * 60 * 60; // 30 days in seconds
    const recentEvents = playerEvents.filter((e) => e.ts > thirtyDaysAgo);
    const recentEventActivity = recentEvents.length / Math.max(1, playerEvents.length);

    return {
      event_variety_score: Math.min(1, eventVarietyScore),
      high_value_events_ratio: highValueEventsRatio,
      engagement_consistency: consistency,
      recent_event_activity: recentEventActivity,
    };
  }

  /**
   * Calculate communication quality metrics from messages
   */
  private static calculateCommunicationMetrics(
    playerMessages: MessageRecord[],
    allMessages: MessageRecord[]
  ): {
    message_engagement_ratio: number;
    conversation_participation: number;
    message_length_avg: number;
    reply_engagement_rate: number;
  } {
    if (playerMessages.length === 0) {
      return {
        message_engagement_ratio: 0,
        conversation_participation: 0,
        message_length_avg: 0,
        reply_engagement_rate: 0,
      };
    }

    // Message engagement ratio: player's messages vs total messages
    const messageEngagementRatio = playerMessages.length / allMessages.length;

    // Conversation participation: ratio of replies to total messages
    const repliesCount = playerMessages.filter((m) => m.is_message_reply).length;
    const conversationParticipation = repliesCount / playerMessages.length;

    // Average message length
    const totalLength = playerMessages.reduce((sum, m) => sum + m.text_length, 0);
    const messageLengthAvg = totalLength / playerMessages.length;

    // Reply engagement rate: how often player's messages get replies
    const messageIds = new Set(playerMessages.map((m) => m.id));
    const repliedToCount = allMessages.filter(
      (m) => m.is_message_reply && m.message_reply_to_id && messageIds.has(m.message_reply_to_id)
    ).length;
    const replyEngagementRate = repliedToCount / playerMessages.length;

    return {
      message_engagement_ratio: Math.min(1, messageEngagementRatio * 100), // Scale up for visibility
      conversation_participation: conversationParticipation,
      message_length_avg: Math.min(1, messageLengthAvg / 100), // Normalize to 0-1
      reply_engagement_rate: replyEngagementRate,
    };
  }

  /**
   * Calculate spending behavior metrics
   */
  private static calculateSpendingMetrics(
    playerSpends: SpendRecord[],
    allSpends: SpendRecord[]
  ): {
    spending_efficiency: number;
    consumable_usage_rate: number;
    spending_frequency: number;
    investment_vs_consumption: number;
  } {
    if (playerSpends.length === 0) {
      return {
        spending_efficiency: 0,
        consumable_usage_rate: 0,
        spending_frequency: 0,
        investment_vs_consumption: 0,
      };
    }

    // Spending efficiency: points spent vs average points per transaction
    const totalPointsSpent = playerSpends.reduce((sum, s) => sum + s.points_spent, 0);
    const avgPointsPerTransaction =
      allSpends.reduce((sum, s) => sum + s.points_spent, 0) / allSpends.length;
    const playerAvgPerTransaction = totalPointsSpent / playerSpends.length;
    const spendingEfficiency = Math.min(1, playerAvgPerTransaction / avgPointsPerTransaction);

    // Consumable usage rate: how often player uses consumables they buy
    const consumableItems = playerSpends.filter((s) => s.is_consumable);
    const consumedItems = consumableItems.filter((s) => s.is_consumed);
    const consumableUsageRate =
      consumableItems.length > 0 ? consumedItems.length / consumableItems.length : 0;

    // Spending frequency: normalized by total spends in system
    const spendingFrequency = Math.min(1, playerSpends.length / (allSpends.length / 100));

    // Investment vs consumption ratio
    const durableSpends = playerSpends.filter((s) => !s.is_consumable);
    const consumableSpends = playerSpends.filter((s) => s.is_consumable);
    const investmentVsConsumption =
      durableSpends.length > 0
        ? durableSpends.length / (durableSpends.length + consumableSpends.length)
        : 0;

    return {
      spending_efficiency: spendingEfficiency,
      consumable_usage_rate: consumableUsageRate,
      spending_frequency: spendingFrequency,
      investment_vs_consumption: investmentVsConsumption,
    };
  }

  /**
   * Get feature importance analysis for Level B metrics
   */
  static analyzeLevelBFeatureImportance(enhancedPlayers: EnhancedPlayer[]): {
    event_features: { [key: string]: { mean: number; std: number; range: [number, number] } };
    communication_features: {
      [key: string]: { mean: number; std: number; range: [number, number] };
    };
    spending_features: { [key: string]: { mean: number; std: number; range: [number, number] } };
  } {
    const eventFeatures = [
      'event_variety_score',
      'high_value_events_ratio',
      'engagement_consistency',
      'recent_event_activity',
    ];
    const communicationFeatures = [
      'message_engagement_ratio',
      'conversation_participation',
      'message_length_avg',
      'reply_engagement_rate',
    ];
    const spendingFeatures = [
      'spending_efficiency',
      'consumable_usage_rate',
      'spending_frequency',
      'investment_vs_consumption',
    ];

    const calculateStats = (feature: string) => {
      const values = enhancedPlayers.map((p) => p[feature as keyof EnhancedPlayer] as number);
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const std = Math.sqrt(variance);
      const range: [number, number] = [Math.min(...values), Math.max(...values)];

      return { mean, std, range };
    };

    return {
      event_features: Object.fromEntries(
        eventFeatures.map((feature) => [feature, calculateStats(feature)])
      ),
      communication_features: Object.fromEntries(
        communicationFeatures.map((feature) => [feature, calculateStats(feature)])
      ),
      spending_features: Object.fromEntries(
        spendingFeatures.map((feature) => [feature, calculateStats(feature)])
      ),
    };
  }
}
