import { DataValidator } from '../src/data/validator';
import { InvalidTeamConstraintsError } from '../src/errors';

describe('DataValidator', () => {
  describe('validateTeamConstraints', () => {
    it('should not throw for valid team configurations', () => {
      expect(() => DataValidator.validateTeamConstraints(12, 3)).not.toThrow();
    });

    it('should throw for too few teams', () => {
      expect(() => DataValidator.validateTeamConstraints(10, 1)).toThrow(InvalidTeamConstraintsError);
    });

    it('should throw for more teams than players', () => {
      expect(() => DataValidator.validateTeamConstraints(5, 10)).toThrow(InvalidTeamConstraintsError);
    });

    it('should throw for configurations with too few players per team', () => {
      expect(() => DataValidator.validateTeamConstraints(8, 5)).toThrow(InvalidTeamConstraintsError);
    });

    it('should not throw for edge cases', () => {
      expect(() => DataValidator.validateTeamConstraints(4, 2)).not.toThrow();
      expect(() => DataValidator.validateTeamConstraints(7, 3)).not.toThrow();
    });
  });

  describe('calculateExpectedTeamSizes', () => {
    it('should calculate even distribution', () => {
      const sizes = DataValidator.calculateExpectedTeamSizes(12, 3);
      expect(sizes).toEqual([4, 4, 4]);
    });

    it('should distribute remainder players evenly', () => {
      const sizes = DataValidator.calculateExpectedTeamSizes(10, 3);
      expect(sizes).toEqual([4, 3, 3]); // 10 = 3*3 + 1, so first team gets extra
    });

    it('should handle various remainders', () => {
      const sizes1 = DataValidator.calculateExpectedTeamSizes(11, 4);
      expect(sizes1).toEqual([3, 3, 3, 2]); // 11 = 4*2 + 3, so first 3 teams get extra

      const sizes2 = DataValidator.calculateExpectedTeamSizes(13, 3);
      expect(sizes2).toEqual([5, 4, 4]); // 13 = 3*4 + 1, so first team gets extra
    });

    it('should maintain max difference of 1', () => {
      const testCases = [
        [7, 3], // 3, 2, 2
        [8, 3], // 3, 3, 2
        [11, 4], // 3, 3, 3, 2
        [17, 5], // 4, 3, 3, 3, 4
        [100, 7], // Should be balanced
      ];

      testCases.forEach(([totalPlayers, targetTeams]) => {
        const sizes = DataValidator.calculateExpectedTeamSizes(totalPlayers, targetTeams);
        const minSize = Math.min(...sizes);
        const maxSize = Math.max(...sizes);

        expect(maxSize - minSize).toBeLessThanOrEqual(1);
        expect(sizes.reduce((sum, size) => sum + size, 0)).toBe(totalPlayers);
      });
    });
  });

  describe('checkDuplicateIds', () => {
    it('should detect no duplicates in clean data', () => {
      const players = [{ player_id: 1 } as any, { player_id: 2 } as any, { player_id: 3 } as any];

      const result = DataValidator.checkDuplicateIds(players);
      expect(result.hasDuplicates).toBe(false);
      expect(result.duplicates).toEqual([]);
    });

    it('should detect duplicate player IDs', () => {
      const players = [
        { player_id: 1 } as any,
        { player_id: 2 } as any,
        { player_id: 1 } as any,
        { player_id: 3 } as any,
        { player_id: 2 } as any,
      ];

      const result = DataValidator.checkDuplicateIds(players);
      expect(result.hasDuplicates).toBe(true);
      expect(result.duplicates.sort()).toEqual([1, 2]);
    });

    it('should handle empty array', () => {
      const result = DataValidator.checkDuplicateIds([]);
      expect(result.hasDuplicates).toBe(false);
      expect(result.duplicates).toEqual([]);
    });
  });

  describe('cleanPlayerData', () => {
    it('should ensure non-negative values', () => {
      const dirtyPlayers = [
        {
          player_id: 1,
          historical_events_participated: -5,
          historical_event_engagements: -10,
          historical_points_earned: -100,
          historical_points_spent: 200,
          historical_messages_sent: -50,
          current_total_points: -75,
          days_active_last_30: -5,
          current_streak_value: -2,
          last_active_ts: '2025-08-01',
          current_team_id: 1,
          current_team_name: 'Team_1',
        },
      ];

      const cleaned = DataValidator.cleanPlayerData(dirtyPlayers);

      expect(cleaned[0].historical_events_participated).toBe(0);
      expect(cleaned[0].historical_event_engagements).toBe(0);
      expect(cleaned[0].historical_points_earned).toBe(0);
      expect(cleaned[0].historical_points_spent).toBe(200); // Positive value unchanged
      expect(cleaned[0].historical_messages_sent).toBe(0);
      expect(cleaned[0].current_total_points).toBe(0);
      expect(cleaned[0].days_active_last_30).toBe(0);
      expect(cleaned[0].current_streak_value).toBe(0);
    });

    it('should cap days_active_last_30 at 30', () => {
      const players = [
        {
          player_id: 1,
          days_active_last_30: 35,
          historical_events_participated: 10,
          historical_event_engagements: 50,
          historical_points_earned: 1000,
          historical_points_spent: 500,
          historical_messages_sent: 100,
          current_total_points: 500,
          current_streak_value: 5,
          last_active_ts: '2025-08-01',
          current_team_id: 1,
          current_team_name: 'Team_1',
        },
      ];

      const cleaned = DataValidator.cleanPlayerData(players);
      expect(cleaned[0].days_active_last_30).toBe(30);
    });

    it('should preserve valid values', () => {
      const players = [
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
        },
      ];

      const cleaned = DataValidator.cleanPlayerData(players);
      expect(cleaned[0]).toEqual(players[0]);
    });
  });
});
