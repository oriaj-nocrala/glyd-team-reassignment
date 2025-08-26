import { injectable } from 'tsyringe';
import { Team } from '../types';

export interface ActivityStats {
  overall_active_last_7_days_percentage: number;
  teams_active_last_7_days_percentage: {
    team_id: number;
    percentage: number;
  }[];
  note?: string;
}

/**
 * Responsible for analyzing player activity patterns
 * Focused on activity-related metrics and calculations
 */
@injectable()
export class ActivityAnalyzer {
  /**
   * Calculate activity statistics using days_active_last_30 as proxy for 7-day activity
   */
  calculateActivityStats(teams: Team[]): ActivityStats {
    // Use days_active_last_30 as proxy - assume players with >7 days active in last 30 were likely active in last 7
    const isActiveProxy = (player: { days_active_last_30: number }): boolean => {
      return player.days_active_last_30 >= 7;
    };

    const overallPercentage = this.calculateOverallActivityPercentage(teams, isActiveProxy);
    const teamPercentages = this.calculateTeamActivityPercentages(teams, isActiveProxy);

    return {
      overall_active_last_7_days_percentage: this.roundToTwoDecimals(overallPercentage),
      teams_active_last_7_days_percentage: teamPercentages,
      note: 'Estimated from days_active_last_30 >= 7 as proxy for recent activity',
    };
  }

  private calculateOverallActivityPercentage(
    teams: Team[],
    isActiveProxy: (player: { days_active_last_30: number }) => boolean
  ): number {
    const allPlayers = teams.flatMap(team => team.players);
    const totalPlayers = allPlayers.length;
    
    if (totalPlayers === 0) return 0;
    
    const activePlayersOverall = allPlayers.filter(isActiveProxy).length;
    return (activePlayersOverall / totalPlayers) * 100;
  }

  private calculateTeamActivityPercentages(
    teams: Team[],
    isActiveProxy: (player: { days_active_last_30: number }) => boolean
  ): { team_id: number; percentage: number }[] {
    return teams.map(team => {
      const teamActiveCount = team.players.filter(isActiveProxy).length;
      const teamPercentage = team.size > 0 ? (teamActiveCount / team.size) * 100 : 0;
      
      return {
        team_id: team.team_id,
        percentage: this.roundToTwoDecimals(teamPercentage),
      };
    });
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }
}