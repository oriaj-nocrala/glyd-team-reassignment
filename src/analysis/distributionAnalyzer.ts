import { injectable } from 'tsyringe';
import { AssignmentResult } from '../types';

export interface ScoreDistribution {
  overall_stats: {
    mean: number;
    median: number;
    std_dev: number;
    min: number;
    max: number;
    quartiles: { q1: number; q2: number; q3: number };
  };
  team_distributions: {
    team_id: number;
    score_histogram: { range: string; count: number }[];
  }[];
}

export interface PlayerMovement {
  total_moves: number;
  movement_rate: number;
  moves_by_team: { from_team: string; to_team: number; count: number }[];
  top_movers: { player_id: number; score: number; from: string; to: number }[];
}

/**
 * Responsible for analyzing score distributions and player movements
 * Focused on statistical analysis and data visualization support
 */
@injectable()
export class DistributionAnalyzer {
  /**
   * Generate score distribution analysis
   */
  analyzeScoreDistribution(result: AssignmentResult): ScoreDistribution {
    // Collect all scores
    const allScores = result.teams.flatMap((team) =>
      team.players.map((player) => player.composite_score)
    );

    if (allScores.length === 0) {
      throw new Error('No scores to analyze');
    }

    const overallStats = this.calculateOverallStats(allScores);
    const teamDistributions = this.calculateTeamDistributions(result);

    return {
      overall_stats: overallStats,
      team_distributions: teamDistributions,
    };
  }

  /**
   * Generate player movement analysis
   */
  analyzePlayerMovement(result: AssignmentResult): PlayerMovement {
    const moves: { player_id: number; score: number; from: string; to: number }[] = [];
    const movementsByTeam = new Map<string, Map<number, number>>();

    // Collect all moves
    result.teams.forEach((team) => {
      team.players.forEach((player) => {
        if (player.current_team_id !== team.team_id) {
          const fromTeam = player.current_team_name || `Team ${player.current_team_id}`;
          
          moves.push({
            player_id: player.player_id,
            score: player.composite_score,
            from: fromTeam,
            to: team.team_id,
          });

          this.trackTeamMovement(movementsByTeam, fromTeam, team.team_id);
        }
      });
    });

    return {
      total_moves: moves.length,
      movement_rate: (moves.length / result.total_players) * 100,
      moves_by_team: this.convertMovementMapToArray(movementsByTeam),
      top_movers: this.getTopMovers(moves),
    };
  }

  private calculateOverallStats(allScores: number[]): ScoreDistribution['overall_stats'] {
    const sortedScores = [...allScores].sort((a, b) => a - b);
    const mean = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
    const variance = allScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / allScores.length;
    const stdDev = Math.sqrt(variance);

    const median = this.calculateMedian(sortedScores);
    const quartiles = this.calculateQuartiles(sortedScores);

    return {
      mean,
      median,
      std_dev: stdDev,
      min: Math.min(...allScores),
      max: Math.max(...allScores),
      quartiles,
    };
  }

  private calculateTeamDistributions(result: AssignmentResult): ScoreDistribution['team_distributions'] {
    return result.teams.map((team) => ({
      team_id: team.team_id,
      score_histogram: this.createScoreHistogram(team.players.map((p) => p.composite_score)),
    }));
  }

  private calculateMedian(sortedScores: number[]): number {
    const length = sortedScores.length;
    return length % 2 === 0
      ? (sortedScores[length / 2 - 1] + sortedScores[length / 2]) / 2
      : sortedScores[Math.floor(length / 2)];
  }

  private calculateQuartiles(sortedScores: number[]): { q1: number; q2: number; q3: number } {
    const q1Index = Math.floor(sortedScores.length * 0.25);
    const q3Index = Math.floor(sortedScores.length * 0.75);
    
    return {
      q1: sortedScores[q1Index],
      q2: this.calculateMedian(sortedScores),
      q3: sortedScores[q3Index],
    };
  }

  private createScoreHistogram(scores: number[], bins: number = 5): { range: string; count: number }[] {
    if (scores.length === 0) {
      return [];
    }

    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const binWidth = (max - min) / bins;

    const histogram: { range: string; count: number }[] = [];

    for (let i = 0; i < bins; i++) {
      const rangeStart = min + i * binWidth;
      const rangeEnd = i === bins - 1 ? max : min + (i + 1) * binWidth;

      const count = scores.filter(
        (score) => score >= rangeStart && (i === bins - 1 ? score <= rangeEnd : score < rangeEnd)
      ).length;

      histogram.push({
        range: `${rangeStart.toFixed(3)}-${rangeEnd.toFixed(3)}`,
        count,
      });
    }

    return histogram;
  }

  private trackTeamMovement(
    movementsByTeam: Map<string, Map<number, number>>,
    fromTeam: string,
    toTeamId: number
  ): void {
    if (!movementsByTeam.has(fromTeam)) {
      movementsByTeam.set(fromTeam, new Map());
    }
    const toTeamMap = movementsByTeam.get(fromTeam)!;
    toTeamMap.set(toTeamId, (toTeamMap.get(toTeamId) || 0) + 1);
  }

  private convertMovementMapToArray(
    movementsByTeam: Map<string, Map<number, number>>
  ): { from_team: string; to_team: number; count: number }[] {
    const movesByTeam: { from_team: string; to_team: number; count: number }[] = [];
    
    movementsByTeam.forEach((toTeamMap, fromTeam) => {
      toTeamMap.forEach((count, toTeam) => {
        movesByTeam.push({ from_team: fromTeam, to_team: toTeam, count });
      });
    });

    return movesByTeam.sort((a, b) => b.count - a.count);
  }

  private getTopMovers(
    moves: { player_id: number; score: number; from: string; to: number }[]
  ): { player_id: number; score: number; from: string; to: number }[] {
    return moves.sort((a, b) => b.score - a.score).slice(0, 10);
  }
}