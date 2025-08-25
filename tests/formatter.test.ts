import 'reflect-metadata';
import { OutputFormatter } from '../src/output/formatter';
import { AssignmentResult } from '../src/types';

describe('OutputFormatter', () => {
  let outputFormatter: OutputFormatter;

  beforeEach(() => {
    outputFormatter = new OutputFormatter();
  });
  const sampleResult: AssignmentResult = {
    teams: [
      {
        team_id: 1,
        players: [
          {
            player_id: 1,
            composite_score: 0.8,
            current_team_id: 1,
            current_team_name: 'Team_A',
          } as any,
        ],
        total_score: 0.8,
        average_score: 0.8,
        size: 1,
      },
    ],
    total_players: 1,
    target_teams: 1,
    seed: 42,
    fairness_stats: {
      score_standard_deviation: 0,
      score_range: { min: 0.8, max: 0.8 },
      size_balance: { min_size: 1, max_size: 1, size_difference: 0 },
      justification: 'Perfectly balanced.',
    },
  };

  describe('formatCSV', () => {
    it('should format output as CSV', () => {
      const csv = outputFormatter.formatCSV(sampleResult);
      expect(csv).toContain('player_id,new_team_id,composite_score,old_team_id,old_team_name');
      expect(csv).toContain('1,1,0.8000,1,"Team_A"');
    });
  });

  describe('formatSimpleList', () => {
    it('should format output as a simple list', () => {
      const list = outputFormatter.formatSimpleList(sampleResult);
      expect(list).toContain('1,1,0.8000');
    });
  });

  describe('formatTeamAssignments', () => {
    it('should format output as a detailed summary', () => {
      const summary = outputFormatter.formatTeamAssignments(sampleResult);
      expect(summary).toContain('TEAM REASSIGNMENT RESULTS');
      expect(summary).toContain('Team 1');
    });
  });
});
