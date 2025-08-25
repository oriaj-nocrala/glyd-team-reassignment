import { MetricsCalculator } from '../src/analysis/metrics';
import { Player } from '../src/types';

describe('MetricsCalculator', () => {
  const samplePlayers: Player[] = [
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
      current_team_name: 'Team_1'
    },
    {
      player_id: 2,
      historical_events_participated: 5,
      historical_event_engagements: 25,
      historical_points_earned: 500,
      historical_points_spent: 200,
      historical_messages_sent: 50,
      current_total_points: 300,
      days_active_last_30: 10,
      current_streak_value: 2,
      last_active_ts: '2025-08-01',
      current_team_id: 1,
      current_team_name: 'Team_1'
    },
    {
      player_id: 3,
      historical_events_participated: 20,
      historical_event_engagements: 100,
      historical_points_earned: 2000,
      historical_points_spent: 1000,
      historical_messages_sent: 200,
      current_total_points: 1000,
      days_active_last_30: 25,
      current_streak_value: 10,
      last_active_ts: '2025-08-01',
      current_team_id: 2,
      current_team_name: 'Team_2'
    }
  ];

  describe('calculatePlayerScores', () => {
    it('should calculate composite scores for all players', () => {
      const playersWithScores = MetricsCalculator.calculatePlayerScores(samplePlayers);
      
      expect(playersWithScores).toHaveLength(3);
      
      playersWithScores.forEach(player => {
        expect(player).toHaveProperty('composite_score');
        expect(typeof player.composite_score).toBe('number');
        expect(player.composite_score).toBeGreaterThanOrEqual(0);
        expect(player.composite_score).toBeLessThanOrEqual(1);
      });
    });

    it('should assign higher scores to more engaged players', () => {
      const playersWithScores = MetricsCalculator.calculatePlayerScores(samplePlayers);
      
      // Player 3 has highest engagement metrics, should have highest score
      const player3Score = playersWithScores.find(p => p.player_id === 3)?.composite_score;
      const player1Score = playersWithScores.find(p => p.player_id === 1)?.composite_score;
      const player2Score = playersWithScores.find(p => p.player_id === 2)?.composite_score;
      
      expect(player3Score).toBeGreaterThan(player1Score!);
      expect(player1Score).toBeGreaterThan(player2Score!);
    });

    it('should handle empty array', () => {
      const result = MetricsCalculator.calculatePlayerScores([]);
      expect(result).toEqual([]);
    });
  });

  describe('rankPlayersByScore', () => {
    it('should rank players by composite score descending', () => {
      const playersWithScores = MetricsCalculator.calculatePlayerScores(samplePlayers);
      const ranked = MetricsCalculator.rankPlayersByScore(playersWithScores);
      
      for (let i = 0; i < ranked.length - 1; i++) {
        expect(ranked[i].composite_score).toBeGreaterThanOrEqual(ranked[i + 1].composite_score);
      }
    });

    it('should break ties using player_id ascending', () => {
      // Create players with identical metrics to force score ties
      const identicalPlayers = [
        { ...samplePlayers[0], player_id: 5 },
        { ...samplePlayers[0], player_id: 3 },
        { ...samplePlayers[0], player_id: 7 }
      ];
      
      const playersWithScores = MetricsCalculator.calculatePlayerScores(identicalPlayers);
      const ranked = MetricsCalculator.rankPlayersByScore(playersWithScores);
      
      // Should be ordered by player_id: 3, 5, 7
      expect(ranked[0].player_id).toBe(3);
      expect(ranked[1].player_id).toBe(5);
      expect(ranked[2].player_id).toBe(7);
    });
  });

  describe('calculateTeamBalance', () => {
    it('should calculate balance metrics for teams', () => {
      const playersWithScores = MetricsCalculator.calculatePlayerScores(samplePlayers);
      
      const teams = [
        { players: [playersWithScores[0], playersWithScores[1]] },
        { players: [playersWithScores[2]] }
      ];
      
      const balance = MetricsCalculator.calculateTeamBalance(teams);
      
      expect(balance).toHaveProperty('mean_scores');
      expect(balance).toHaveProperty('score_variance');
      expect(balance).toHaveProperty('balance_coefficient');
      
      expect(balance.mean_scores).toHaveLength(2);
      expect(typeof balance.score_variance).toBe('number');
      expect(typeof balance.balance_coefficient).toBe('number');
      
      expect(balance.balance_coefficient).toBeGreaterThanOrEqual(0);
      expect(balance.balance_coefficient).toBeLessThanOrEqual(1);
    });
  });
});