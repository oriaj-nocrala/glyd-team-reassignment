import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import { injectable } from 'tsyringe';
import { Player, PlayerCSVRow } from '../types';
import { logger } from '../utils/logger';
import { InvalidCsvError } from '../errors';

@injectable()
export class DataParser {
  /**
   * Parse file (CSV or Excel) and return array of players
   */
  async parsePlayersFromFile(filePath: string): Promise<Player[]> {
    const extension = path.extname(filePath).toLowerCase();
    
    switch (extension) {
      case '.csv':
        return this.parsePlayersFromCSV(filePath);
      case '.xlsx':
        return this.parsePlayersFromExcel(filePath);
      default:
        throw new InvalidCsvError(`Unsupported file format: ${extension}. Supported formats: .csv, .xlsx`, []);
    }
  }

  /**
   * Parse CSV file and return array of players
   */
  async parsePlayersFromCSV(filePath: string): Promise<Player[]> {
    return new Promise((resolve, reject) => {
      const players: Player[] = [];
      const invalidRows: { row: PlayerCSVRow; error: Error }[] = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row: PlayerCSVRow) => {
          try {
            const playerId = parseInt(row.player_id);
            if (isNaN(playerId)) {
              throw new Error('Invalid player_id');
            }
            const player: Player = {
              player_id: playerId,
              historical_events_participated: parseInt(row.historical_events_participated) || 0,
              historical_event_engagements: parseInt(row.historical_event_engagements) || 0,
              historical_points_earned: parseInt(row.historical_points_earned) || 0,
              historical_points_spent: parseInt(row.historical_points_spent) || 0,
              historical_messages_sent: parseInt(row.historical_messages_sent) || 0,
              current_total_points: parseInt(row.current_total_points) || 0,
              days_active_last_30: parseInt(row.days_active_last_30) || 0,
              current_streak_value: parseInt(row.current_streak_value) || 0,
              last_active_ts: row.last_active_ts || '',
              current_team_id: parseInt(row.current_team_id) || 0,
              current_team_name: row.current_team_name || '',
            };
            players.push(player);
          } catch (error) {
            invalidRows.push({ row, error: error as Error });
          }
        })
        .on('end', () => {
          if (invalidRows.length > 0) {
            const errorMessage = `Failed to parse ${invalidRows.length} rows.`;
            reject(new InvalidCsvError(errorMessage, invalidRows));
          } else {
            logger.log(`Successfully parsed ${players.length} players from CSV`);
            resolve(players);
          }
        })
        .on('error', (error: Error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        });
    });
  }

  /**
   * Parse Excel file and return array of players
   */
  async parsePlayersFromExcel(filePath: string): Promise<Player[]> {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0]; // Use first sheet
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert directly to JSON with header row as keys
      const rawData: PlayerCSVRow[] = XLSX.utils.sheet_to_json(worksheet);
      
      const players: Player[] = [];
      const invalidRows: { row: PlayerCSVRow; error: Error }[] = [];
      
      rawData.forEach((row) => {
        try {
          
          const playerId = parseInt(row.player_id);
          if (isNaN(playerId)) {
            throw new Error('Invalid player_id');
          }
          
          const player: Player = {
            player_id: playerId,
            historical_events_participated: parseInt(row.historical_events_participated) || 0,
            historical_event_engagements: parseInt(row.historical_event_engagements) || 0,
            historical_points_earned: parseInt(row.historical_points_earned) || 0,
            historical_points_spent: parseInt(row.historical_points_spent) || 0,
            historical_messages_sent: parseInt(row.historical_messages_sent) || 0,
            current_total_points: parseInt(row.current_total_points) || 0,
            days_active_last_30: parseInt(row.days_active_last_30) || 0,
            current_streak_value: parseInt(row.current_streak_value) || 0,
            last_active_ts: row.last_active_ts || '',
            current_team_id: parseInt(row.current_team_id) || 0,
            current_team_name: row.current_team_name || '',
          };
          
          players.push(player);
        } catch (error) {
          invalidRows.push({ row, error: error as Error });
        }
      });
      
      if (invalidRows.length > 0) {
        const errorMessage = `Failed to parse ${invalidRows.length} rows from Excel file.`;
        throw new InvalidCsvError(errorMessage, invalidRows);
      }
      
      logger.log(`Successfully parsed ${players.length} players from Excel`);
      return players;
      
    } catch (error) {
      if (error instanceof InvalidCsvError) {
        throw error;
      }
      throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate parsed player data
   */
  validatePlayers(players: Player[]): { valid: Player[]; invalid: Player[] } {
    const valid: Player[] = [];
    const invalid: Player[] = [];

    players.forEach((player) => {
      if (this.isValidPlayer(player)) {
        valid.push(player);
      } else {
        invalid.push(player);
      }
    });

    return { valid, invalid };
  }

  /**
   * Check if a player has valid required data
   */
  private isValidPlayer(player: Player): boolean {
    return (
      player.player_id > 0 &&
      typeof player.historical_events_participated === 'number' &&
      typeof player.historical_event_engagements === 'number' &&
      typeof player.current_total_points === 'number' &&
      typeof player.days_active_last_30 === 'number'
    );
  }

  /**
   * Get data summary statistics
   */
  getDataSummary(players: Player[]): {
    total_players: number;
    engagement_range: { min: number; max: number; avg: number };
    activity_range: { min: number; max: number; avg: number };
    points_range: { min: number; max: number; avg: number };
    current_teams: Set<number>;
  } {
    if (players.length === 0) {
      throw new Error('No players to analyze');
    }

    const engagements = players.map((p) => p.historical_event_engagements);
    const activities = players.map((p) => p.days_active_last_30);
    const points = players.map((p) => p.current_total_points);
    const teams = new Set(players.map((p) => p.current_team_id));

    return {
      total_players: players.length,
      engagement_range: {
        min: Math.min(...engagements),
        max: Math.max(...engagements),
        avg: engagements.reduce((a, b) => a + b, 0) / engagements.length,
      },
      activity_range: {
        min: Math.min(...activities),
        max: Math.max(...activities),
        avg: activities.reduce((a, b) => a + b, 0) / activities.length,
      },
      points_range: {
        min: Math.min(...points),
        max: Math.max(...points),
        avg: points.reduce((a, b) => a + b, 0) / points.length,
      },
      current_teams: teams,
    };
  }
}
