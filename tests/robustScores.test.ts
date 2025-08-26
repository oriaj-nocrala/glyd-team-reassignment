import 'reflect-metadata';
import { MetricsCalculator } from '../src/analysis/metrics';
import { Player } from '../src/types';

describe('Robust Scores Functionality', () => {
  const createTestPlayers = (): Player[] => [
    {
      player_id: 1,
      historical_events_participated: 10,
      historical_event_engagements: 100, // Normal
      historical_points_earned: 500,
      historical_points_spent: 200,
      historical_messages_sent: 50,
      current_total_points: 1000, // Normal
      days_active_last_30: 15,
      current_streak_value: 5,
      last_active_ts: '2025-01-15',
      current_team_id: 1,
      current_team_name: 'Team Alpha',
    },
    {
      player_id: 2,
      historical_events_participated: 15,
      historical_event_engagements: 10000, // Heavy-tailed outlier
      historical_points_earned: 2000,
      historical_points_spent: 800,
      historical_messages_sent: 200,
      current_total_points: 50000, // Heavy-tailed outlier
      days_active_last_30: 20,
      current_streak_value: 8,
      last_active_ts: '2025-01-16',
      current_team_id: 2,
      current_team_name: 'Team Beta',
    },
    {
      player_id: 3,
      historical_events_participated: 5,
      historical_event_engagements: 50, // Normal
      historical_points_earned: 300,
      historical_points_spent: 100,
      historical_messages_sent: 25,
      current_total_points: 800, // Normal
      days_active_last_30: 10,
      current_streak_value: 3,
      last_active_ts: '2025-01-14',
      current_team_id: 3,
      current_team_name: 'Team Gamma',
    },
  ];

  describe('MetricsCalculator with robust scoring', () => {
    it('should calculate different scores with and without robust scoring', () => {
      const players = createTestPlayers();
      
      // Calculate scores without robust scoring
      const normalScores = MetricsCalculator.calculatePlayerScores(players, undefined, false);
      
      // Calculate scores with robust scoring
      const robustScores = MetricsCalculator.calculatePlayerScores(players, undefined, true);
      
      // Scores should be different when robust scoring is applied
      expect(normalScores).not.toEqual(robustScores);
      
      // All players should have valid composite scores in both cases
      normalScores.forEach(player => {
        expect(player.composite_score).toBeGreaterThanOrEqual(0);
        expect(player.composite_score).toBeLessThanOrEqual(1);
      });
      
      robustScores.forEach(player => {
        expect(player.composite_score).toBeGreaterThanOrEqual(0);
        expect(player.composite_score).toBeLessThanOrEqual(1);
      });
    });

    it('should reduce the impact of extreme outliers with robust scoring', () => {
      const players = createTestPlayers();
      
      // Player 2 has extreme values (10000 engagements, 50000 points)
      const normalScores = MetricsCalculator.calculatePlayerScores(players, undefined, false);
      const robustScores = MetricsCalculator.calculatePlayerScores(players, undefined, true);
      
      // Find player 2 in both result sets
      const player2Normal = normalScores.find(p => p.player_id === 2)!;
      const player2Robust = robustScores.find(p => p.player_id === 2)!;
      
      // Find player 1 (normal values) in both result sets  
      const player1Normal = normalScores.find(p => p.player_id === 1)!;
      const player1Robust = robustScores.find(p => p.player_id === 1)!;
      
      // The gap between player 2 and player 1 should be smaller with robust scoring
      const normalGap = player2Normal.composite_score - player1Normal.composite_score;
      const robustGap = player2Robust.composite_score - player1Robust.composite_score;
      
      expect(robustGap).toBeLessThan(normalGap);
    });

    it('should maintain deterministic results with robust scoring', () => {
      const players = createTestPlayers();
      
      // Calculate robust scores multiple times
      const scores1 = MetricsCalculator.calculatePlayerScores(players, undefined, true);
      const scores2 = MetricsCalculator.calculatePlayerScores(players, undefined, true);
      
      // Results should be identical (deterministic)
      expect(scores1).toEqual(scores2);
    });

    it('should handle edge cases with robust scoring', () => {
      const edgeCasePlayers: Player[] = [
        {
          ...createTestPlayers()[0],
          player_id: 1,
          historical_event_engagements: 0, // Zero value
          current_total_points: 0, // Zero value
        },
        {
          ...createTestPlayers()[0],
          player_id: 2,
          historical_event_engagements: 1, // Minimal value
          current_total_points: 1, // Minimal value
        },
      ];
      
      expect(() => {
        MetricsCalculator.calculatePlayerScores(edgeCasePlayers, undefined, true);
      }).not.toThrow();
      
      const scores = MetricsCalculator.calculatePlayerScores(edgeCasePlayers, undefined, true);
      
      // Should produce valid scores even with edge cases
      scores.forEach(player => {
        expect(player.composite_score).toBeGreaterThanOrEqual(0);
        expect(player.composite_score).toBeLessThanOrEqual(1);
        expect(Number.isNaN(player.composite_score)).toBe(false);
      });
    });

    it('should maintain ranking consistency with robust scoring', () => {
      const players = createTestPlayers();
      
      const normalScores = MetricsCalculator.calculatePlayerScores(players, undefined, false);
      const robustScores = MetricsCalculator.calculatePlayerScores(players, undefined, true);
      
      // Rank players by score
      const normalRanked = MetricsCalculator.rankPlayersByScore(normalScores);
      const robustRanked = MetricsCalculator.rankPlayersByScore(robustScores);
      
      // Top player should still be player with highest raw values (player 2)
      // but the score difference should be reduced
      expect(normalRanked[0].player_id).toBe(2);
      expect(robustRanked[0].player_id).toBe(2);
      
      // Score should be reduced for the outlier player with robust scoring
      // Allow for small floating point differences
      const scoreDifference = normalRanked[0].composite_score - robustRanked[0].composite_score;
      expect(scoreDifference).toBeGreaterThanOrEqual(0);
    });
  });
});