import { TeamShuffler } from '../src/assignment/shuffler';
import { Player } from '../src/types';

describe('TeamShuffler', () => {
  const samplePlayers: Player[] = Array.from({ length: 20 }, (_, i) => ({
    player_id: i + 1,
    historical_events_participated: 10 + i * 2,
    historical_event_engagements: 50 + i * 5,
    historical_points_earned: 1000 + i * 100,
    historical_points_spent: 500 + i * 50,
    historical_messages_sent: 100 + i * 10,
    current_total_points: 500 + i * 50,
    days_active_last_30: 15 + (i % 15),
    current_streak_value: 5 + (i % 5),
    last_active_ts: '2025-08-01',
    current_team_id: (i % 4) + 1,
    current_team_name: `House_${(i % 4) + 1}`,
  }));

  describe('assignTeams', () => {
    it('should create the correct number of teams', async () => {
      const players = samplePlayers.slice(0, 20);
      const shuffler = new TeamShuffler(42);
      const result = await shuffler.assignTeams(players, 4);

      expect(result.teams).toHaveLength(4);
      expect(result.target_teams).toBe(4);
    });

    it('should assign all players to teams', async () => {
      const players = samplePlayers.slice(0, 15);
      const shuffler = new TeamShuffler(42);
      const result = await shuffler.assignTeams(players, 3);

      const totalAssignedPlayers = result.teams.reduce((sum, team) => sum + team.players.length, 0);
      expect(totalAssignedPlayers).toBe(players.length);
    });

    it('should maintain balanced team sizes (max difference of 1)', async () => {
      const players = samplePlayers.slice(0, 17); // 17 players / 3 teams = 6,6,5
      const shuffler = new TeamShuffler(42);
      const result = await shuffler.assignTeams(players, 3);

      const teamSizes = result.teams.map((team) => team.size);
      const minSize = Math.min(...teamSizes);
      const maxSize = Math.max(...teamSizes);

      expect(maxSize - minSize).toBeLessThanOrEqual(1);
    });

    it('should produce deterministic results with same seed', async () => {
      const players = samplePlayers.slice(0, 12);

      const shuffler1 = new TeamShuffler(42);
      const result1 = await shuffler1.assignTeams(players, 3);

      const shuffler2 = new TeamShuffler(42);
      const result2 = await shuffler2.assignTeams(players, 3);

      // Same seed should produce same results
      expect(result1.seed).toBe(result2.seed);

      // Compare team compositions
      for (let i = 0; i < result1.teams.length; i++) {
        const team1PlayerIds = result1.teams[i].players.map((p) => p.player_id).sort();
        const team2PlayerIds = result2.teams[i].players.map((p) => p.player_id).sort();
        expect(team1PlayerIds).toEqual(team2PlayerIds);
      }
    });

    it('should produce different results with different seeds', async () => {
      // Create fixed players to ensure different data seeds
      const players1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((id) => ({
        player_id: id,
        historical_events_participated: id,
        historical_event_engagements: id * 5,
        historical_points_earned: id * 100,
        historical_points_spent: id * 50,
        historical_messages_sent: id * 10,
        current_total_points: id * 25,
        days_active_last_30: id % 30,
        current_streak_value: id % 10,
        last_active_ts: '2025-08-01',
        current_team_id: (id % 4) + 1,
        current_team_name: `House_${(id % 4) + 1}`,
      }));

      const players2 = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].map((id) => ({
        player_id: id,
        historical_events_participated: id,
        historical_event_engagements: id * 5,
        historical_points_earned: id * 100,
        historical_points_spent: id * 50,
        historical_messages_sent: id * 10,
        current_total_points: id * 25,
        days_active_last_30: id % 30,
        current_streak_value: id % 10,
        last_active_ts: '2025-08-01',
        current_team_id: (id % 4) + 1,
        current_team_name: `House_${(id % 4) + 1}`,
      }));

      const shuffler1 = new TeamShuffler(42);
      const result1 = await shuffler1.assignTeams(players1, 3);

      const shuffler2 = new TeamShuffler(42);
      const result2 = await shuffler2.assignTeams(players2, 3);

      // Different player data should produce different results even with same seed
      expect(result1.seed).not.toBe(result2.seed);
    });

    it('should handle minimum team size (2 teams)', async () => {
      const players = samplePlayers.slice(0, 10);
      const shuffler = new TeamShuffler(42);
      const result = await shuffler.assignTeams(players, 2);

      expect(result.teams).toHaveLength(2);
      expect(result.teams[0].size + result.teams[1].size).toBe(10);
    });

    it('should include fairness statistics', async () => {
      const players = samplePlayers.slice(0, 12);
      const shuffler = new TeamShuffler(42);
      const result = await shuffler.assignTeams(players, 3);

      expect(result.fairness_stats).toBeDefined();
      expect(result.fairness_stats).toHaveProperty('score_standard_deviation');
      expect(result.fairness_stats).toHaveProperty('score_range');
      expect(result.fairness_stats).toHaveProperty('size_balance');
      expect(result.fairness_stats).toHaveProperty('justification');

      expect(typeof result.fairness_stats.score_standard_deviation).toBe('number');
      expect(typeof result.fairness_stats.justification).toBe('string');
      expect(result.fairness_stats.size_balance.size_difference).toBeLessThanOrEqual(1);
    });
  });

  describe('generateAssignmentSummary', () => {
    it('should generate a readable summary', async () => {
      const players = samplePlayers.slice(0, 9);
      const shuffler = new TeamShuffler(42);
      const result = await shuffler.assignTeams(players, 3);

      const summary = TeamShuffler.generateAssignmentSummary(result);

      expect(summary).toContain('TEAM ASSIGNMENT SUMMARY');
      expect(summary).toContain('Total Players: 9');
      expect(summary).toContain('Target Teams: 3');
      expect(summary).toContain('Team 1:');
      expect(summary).toContain('Team 2:');
      expect(summary).toContain('Team 3:');
      expect(summary).toContain('Fairness Statistics');
    });
  });

  describe('exportAssignments', () => {
    it('should export assignments in correct format', async () => {
      const players = samplePlayers.slice(0, 6);
      const shuffler = new TeamShuffler(42);
      const result = await shuffler.assignTeams(players, 2);

      const exports = TeamShuffler.exportAssignments(result);

      expect(exports).toHaveLength(6);

      exports.forEach((assignment) => {
        expect(assignment).toHaveProperty('player_id');
        expect(assignment).toHaveProperty('new_team_id');
        expect(assignment).toHaveProperty('composite_score');
        expect(assignment).toHaveProperty('old_team_id');
        expect(assignment).toHaveProperty('old_team_name');

        expect(typeof assignment.player_id).toBe('number');
        expect(typeof assignment.new_team_id).toBe('number');
        expect(typeof assignment.composite_score).toBe('number');
        expect(assignment.new_team_id).toBeGreaterThan(0);
        expect(assignment.new_team_id).toBeLessThanOrEqual(2);
      });

      // Should be sorted by player_id
      for (let i = 0; i < exports.length - 1; i++) {
        expect(exports[i].player_id).toBeLessThan(exports[i + 1].player_id);
      }
    });
  });
});
