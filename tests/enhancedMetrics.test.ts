import { EnhancedMetricsCalculator } from '../src/analysis/enhancedMetrics';
import { EnhancedPlayer } from '../src/types';

describe('EnhancedMetricsCalculator', () => {
  const samplePlayers: EnhancedPlayer[] = [
    {
      player_id: 1,
      historical_events_participated: 10,
      historical_event_engagements: 50,
      historical_points_earned: 1000,
      historical_points_spent: 500,
      historical_messages_sent: 100,
      current_total_points: 500,
      days_active_last_30: 15,
      current_streak_value: 5,
      last_active_ts: '2025-08-01',
      current_team_id: 1,
      current_team_name: 'Team_1',
      event_variety_score: 0.5,
      high_value_events_ratio: 0.5,
      engagement_consistency: 0.5,
      recent_event_activity: 0.5,
      message_engagement_ratio: 0.5,
      conversation_participation: 0.5,
      message_length_avg: 0.5,
      reply_engagement_rate: 0.5,
      spending_efficiency: 0.5,
      consumable_usage_rate: 0.5,
      spending_frequency: 0.5,
      investment_vs_consumption: 0.5,
    },
  ];

  describe('calculateEnhancedPlayerScores', () => {
    it('should calculate enhanced scores for all players', () => {
      const playersWithScores =
        EnhancedMetricsCalculator.calculateEnhancedPlayerScores(samplePlayers);
      expect(playersWithScores).toHaveLength(1);
      expect(playersWithScores[0]).toHaveProperty('composite_score');
      expect(playersWithScores[0]).toHaveProperty('level_a_score');
      expect(playersWithScores[0]).toHaveProperty('level_b_score');
    });
  });
});
