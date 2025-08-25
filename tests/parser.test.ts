import 'reflect-metadata';
import { DataParser } from '../src/data/parser';
import mock from 'mock-fs';

describe('DataParser', () => {
  let dataParser: DataParser;

  beforeEach(() => {
    dataParser = new DataParser();
  });

  afterEach(() => {
    mock.restore();
  });

  describe('parsePlayersFromCSV', () => {
    it('should parse valid CSV data correctly', async () => {
      const csvData = `player_id,historical_events_participated,historical_event_engagements,current_total_points,days_active_last_30,current_streak_value,last_active_ts,current_team_id,current_team_name
1,10,50,500,15,5,2025-08-01,1,Team_1`;

      mock({
        'data/players.csv': csvData,
      });

      const players = await dataParser.parsePlayersFromCSV('data/players.csv');

      expect(players).toHaveLength(1);
      expect(players[0].player_id).toBe(1);
      expect(players[0].current_total_points).toBe(500);
    });

    it('should reject with an error for invalid rows', async () => {
      const csvData = `player_id,current_total_points
1,500
invalid,100`;

      mock({
        'data/players.csv': csvData,
      });

      await expect(dataParser.parsePlayersFromCSV('data/players.csv')).rejects.toThrow(
        'Failed to parse 1 rows.'
      );
    });

    it('should handle an empty CSV file', async () => {
      const csvData = `player_id,current_total_points`;

      mock({
        'data/players.csv': csvData,
      });

      const players = await dataParser.parsePlayersFromCSV('data/players.csv');
      expect(players).toHaveLength(0);
    });
  });
});
