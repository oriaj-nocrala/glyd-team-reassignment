import { injectable } from 'tsyringe';
import { Team } from '../types';

export interface TeamAnalysis {
  team_id: number;
  size: number;
  average_score: number;
  median_score: number;
  score_std_dev: number;
  score_range: { min: number; max: number };
  top_player: { id: number; score: number };
  bottom_player: { id: number; score: number };
}

/**
 * Responsible for analyzing individual team statistics
 * Follows Single Responsibility Principle - only handles team-level analysis
 */
@injectable()
export class TeamAnalyzer {
  /**
   * Generate comprehensive analysis for multiple teams
   */
  analyzeTeams(teams: Team[]): TeamAnalysis[] {
    return teams.map((team) => this.analyzeTeam(team));
  }

  /**
   * Analyze individual team statistics
   */
  analyzeTeam(team: Team): TeamAnalysis {
    if (team.players.length === 0) {
      return this.createEmptyAnalysis(team.team_id);
    }

    const scores = team.players.map((p) => p.composite_score);
    const sortedScores = [...scores].sort((a, b) => a - b);
    const sortedPlayers = [...team.players].sort((a, b) => b.composite_score - a.composite_score);

    return {
      team_id: team.team_id,
      size: team.size,
      average_score: team.average_score,
      median_score: this.calculateMedian(sortedScores),
      score_std_dev: this.calculateStandardDeviation(scores, team.average_score),
      score_range: {
        min: Math.min(...scores),
        max: Math.max(...scores),
      },
      top_player: {
        id: sortedPlayers[0].player_id,
        score: sortedPlayers[0].composite_score,
      },
      bottom_player: {
        id: sortedPlayers[sortedPlayers.length - 1].player_id,
        score: sortedPlayers[sortedPlayers.length - 1].composite_score,
      },
    };
  }

  private createEmptyAnalysis(teamId: number): TeamAnalysis {
    return {
      team_id: teamId,
      size: 0,
      average_score: 0,
      median_score: 0,
      score_std_dev: 0,
      score_range: { min: 0, max: 0 },
      top_player: { id: 0, score: 0 },
      bottom_player: { id: 0, score: 0 },
    };
  }

  private calculateMedian(sortedScores: number[]): number {
    const length = sortedScores.length;
    return length % 2 === 0
      ? (sortedScores[length / 2 - 1] + sortedScores[length / 2]) / 2
      : sortedScores[Math.floor(length / 2)];
  }

  private calculateStandardDeviation(scores: number[], mean: number): number {
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    return Math.sqrt(variance);
  }
}