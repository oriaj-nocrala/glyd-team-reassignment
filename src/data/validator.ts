import { InvalidTeamConstraintsError } from '../errors';
import { Player } from '../types';


export class DataValidator {
  /**
   * Clean and normalize player data
   */
  static cleanPlayerData(players: Player[]): Player[] {
    return players.map((player) => ({
      ...player,
      // Ensure non-negative values for metrics
      historical_events_participated: Math.max(0, player.historical_events_participated),
      historical_event_engagements: Math.max(0, player.historical_event_engagements),
      historical_points_earned: Math.max(0, player.historical_points_earned),
      historical_points_spent: Math.max(0, player.historical_points_spent),
      historical_messages_sent: Math.max(0, player.historical_messages_sent),
      current_total_points: Math.max(0, player.current_total_points),
      days_active_last_30: Math.max(0, Math.min(30, player.days_active_last_30)), // Cap at 30 days
      current_streak_value: Math.max(0, player.current_streak_value),
    }));
  }

  /**
   * Remove outliers based on statistical thresholds
   */
  static removeOutliers(
    players: Player[],
    threshold: number = 3
  ): {
    cleaned: Player[];
    outliers: Player[];
  } {
    const cleaned: Player[] = [];
    const outliers: Player[] = [];

    // Calculate Z-scores for engagement metric
    const engagements = players.map((p) => p.historical_event_engagements);
    const mean = engagements.reduce((a, b) => a + b, 0) / engagements.length;
    const std = Math.sqrt(
      engagements.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / engagements.length
    );

    players.forEach((player) => {
      const zScore = Math.abs((player.historical_event_engagements - mean) / std);

      if (zScore <= threshold) {
        cleaned.push(player);
      } else {
        outliers.push(player);
      }
    });

    return { cleaned, outliers };
  }

  /**
   * Validate team assignment constraints
   */
  static validateTeamConstraints(
    totalPlayers: number,
    targetTeams: number
  ): void {
    if (targetTeams < 2) {
      throw new InvalidTeamConstraintsError('Number of teams must be at least 2');
    }

    if (targetTeams > totalPlayers) {
      throw new InvalidTeamConstraintsError(
        `Cannot create ${targetTeams} teams with only ${totalPlayers} players`
      );
    }

    if (totalPlayers < targetTeams * 2) {
      throw new InvalidTeamConstraintsError(
        `Too few players (${totalPlayers}) for ${targetTeams} teams. Need at least ${targetTeams * 2} players`
      );
    }

    const maxTeamSizeDiff =
      Math.ceil(totalPlayers / targetTeams) - Math.floor(totalPlayers / targetTeams);
    if (maxTeamSizeDiff > 1) {
      throw new InvalidTeamConstraintsError(
        `Team size difference would exceed 1 player (${maxTeamSizeDiff})`
      );
    }
  }

  /**
   * Calculate expected team sizes for balanced distribution
   */
  static calculateExpectedTeamSizes(totalPlayers: number, targetTeams: number): number[] {
    const baseSize = Math.floor(totalPlayers / targetTeams);
    const remainder = totalPlayers % targetTeams;

    const teamSizes: number[] = [];

    for (let i = 0; i < targetTeams; i++) {
      // Distribute remainder players evenly across first teams
      teamSizes.push(baseSize + (i < remainder ? 1 : 0));
    }

    return teamSizes;
  }

  /**
   * Check for duplicate player IDs
   */
  static checkDuplicateIds(players: Player[]): {
    hasDuplicates: boolean;
    duplicates: number[];
  } {
    const seenIds = new Set<number>();
    const duplicates = new Set<number>();

    players.forEach((player) => {
      if (seenIds.has(player.player_id)) {
        duplicates.add(player.player_id);
      } else {
        seenIds.add(player.player_id);
      }
    });

    return {
      hasDuplicates: duplicates.size > 0,
      duplicates: Array.from(duplicates),
    };
  }
}
