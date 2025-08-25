import { injectable } from 'tsyringe';
import { AssignmentResult, Team, FairnessStats } from '../types';

@injectable()
export class StatisticsGenerator {
  /**
   * Generate comprehensive team summaries
   */
  generateTeamSummary(teams: Team[]): {
    team_id: number;
    size: number;
    average_score: number;
    median_score: number;
    score_std_dev: number;
    score_range: { min: number; max: number };
    top_player: { id: number; score: number };
    bottom_player: { id: number; score: number };
  }[] {
    return teams.map((team) => this.analyzeTeam(team));
  }

  /**
   * Analyze individual team statistics
   */
  private analyzeTeam(team: Team): {
    team_id: number;
    size: number;
    average_score: number;
    median_score: number;
    score_std_dev: number;
    score_range: { min: number; max: number };
    top_player: { id: number; score: number };
    bottom_player: { id: number; score: number };
  } {
    if (team.players.length === 0) {
      return {
        team_id: team.team_id,
        size: 0,
        average_score: 0,
        median_score: 0,
        score_std_dev: 0,
        score_range: { min: 0, max: 0 },
        top_player: { id: 0, score: 0 },
        bottom_player: { id: 0, score: 0 },
      };
    }

    const scores = team.players.map((p) => p.composite_score);
    const sortedScores = [...scores].sort((a, b) => a - b);

    // Calculate median
    const median =
      sortedScores.length % 2 === 0
        ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
        : sortedScores[Math.floor(sortedScores.length / 2)];

    // Calculate standard deviation
    const mean = team.average_score;
    const variance =
      scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // Find top and bottom players
    const sortedPlayers = [...team.players].sort((a, b) => b.composite_score - a.composite_score);
    const topPlayer = sortedPlayers[0];
    const bottomPlayer = sortedPlayers[sortedPlayers.length - 1];

    return {
      team_id: team.team_id,
      size: team.size,
      average_score: team.average_score,
      median_score: median,
      score_std_dev: stdDev,
      score_range: {
        min: Math.min(...scores),
        max: Math.max(...scores),
      },
      top_player: {
        id: topPlayer.player_id,
        score: topPlayer.composite_score,
      },
      bottom_player: {
        id: bottomPlayer.player_id,
        score: bottomPlayer.composite_score,
      },
    };
  }

  /**
   * Calculate cross-team fairness statistics
   */
  calculateFairnessStats(teams: Team[]): FairnessStats & {
    coefficient_of_variation: number;
    gini_coefficient: number;
    balance_score: number;
  } {
    if (teams.length === 0) {
      throw new Error('No teams provided for fairness analysis');
    }

    const teamAverages = teams.map((team) => team.average_score);
    const teamSizes = teams.map((team) => team.size);

    // Basic statistics
    const mean = teamAverages.reduce((sum, avg) => sum + avg, 0) / teamAverages.length;
    const variance =
      teamAverages.reduce((sum, avg) => sum + Math.pow(avg - mean, 2), 0) / teamAverages.length;
    const stdDev = Math.sqrt(variance);

    // Coefficient of variation (relative variability)
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;

    // Gini coefficient for inequality measurement
    const giniCoefficient = this.calculateGiniCoefficient(teamAverages);

    // Overall balance score (0-100, higher is better)
    const balanceScore = this.calculateBalanceScore(stdDev, coefficientOfVariation, teamSizes);

    // Generate justification
    const balanceQuality = this.assessBalanceQuality(
      stdDev,
      Math.max(...teamSizes) - Math.min(...teamSizes)
    );
    const justification = this.generateJustification(balanceQuality, stdDev, teamSizes);

    return {
      score_standard_deviation: stdDev,
      score_range: {
        min: Math.min(...teamAverages),
        max: Math.max(...teamAverages),
      },
      size_balance: {
        min_size: Math.min(...teamSizes),
        max_size: Math.max(...teamSizes),
        size_difference: Math.max(...teamSizes) - Math.min(...teamSizes),
      },
      justification,
      coefficient_of_variation: coefficientOfVariation,
      gini_coefficient: giniCoefficient,
      balance_score: balanceScore,
    };
  }

  /**
   * Calculate Gini coefficient for measuring inequality
   */
  private calculateGiniCoefficient(values: number[]): number {
    if (values.length === 0) return 0;

    const sortedValues = [...values].sort((a, b) => a - b);
    const n = sortedValues.length;
    const sum = sortedValues.reduce((acc, val) => acc + val, 0);

    if (sum === 0) return 0;

    let gini = 0;
    for (let i = 0; i < n; i++) {
      gini += (2 * (i + 1) - n - 1) * sortedValues[i];
    }

    return gini / (n * sum);
  }

  /**
   * Calculate overall balance score (0-100)
   */
  private calculateBalanceScore(stdDev: number, cv: number, teamSizes: number[]): number {
    // Score components (each 0-1)
    const scoreBalance = Math.max(0, 1 - stdDev / 0.2); // Penalize high std dev
    const variationBalance = Math.max(0, 1 - cv * 2); // Penalize high coefficient of variation
    const sizeBalance = Math.max(...teamSizes) - Math.min(...teamSizes) <= 1 ? 1 : 0; // Perfect if diff <= 1

    // Weighted average
    const overallBalance = scoreBalance * 0.4 + variationBalance * 0.3 + sizeBalance * 0.3;

    return Math.round(overallBalance * 100);
  }

  /**
   * Assess balance quality level
   */
  private assessBalanceQuality(
    scoreStdDev: number,
    sizeDifference: number
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    if (scoreStdDev < 0.05 && sizeDifference === 0) {
      return 'excellent';
    } else if (scoreStdDev < 0.1 && sizeDifference <= 1) {
      return 'good';
    } else if (scoreStdDev < 0.2 && sizeDifference <= 1) {
      return 'fair';
    } else {
      return 'poor';
    }
  }

  /**
   * Generate human-readable justification
   */
  private generateJustification(
    quality: 'excellent' | 'good' | 'fair' | 'poor',
    scoreStdDev: number,
    teamSizes: number[]
  ): string {
    const sizesStr = teamSizes.join(', ');
    const stdDevPercent = (scoreStdDev * 100).toFixed(1);

    switch (quality) {
      case 'excellent':
        return `Teams are excellently balanced with ${stdDevPercent}% score deviation and equal sizes (${sizesStr}). Snake draft ensured optimal distribution.`;

      case 'good':
        return `Teams are well-balanced with ${stdDevPercent}% score deviation and sizes (${sizesStr}). Minor differences are within acceptable limits.`;

      case 'fair':
        return `Teams show fair balance with ${stdDevPercent}% score deviation. Team sizes (${sizesStr}) differ by at most 1 player as required.`;

      case 'poor':
        return `Team balance could be improved. Score deviation is ${stdDevPercent}% with sizes (${sizesStr}). Consider different distribution strategy.`;

      default:
        return `Team balance assessment: ${stdDevPercent}% score deviation, sizes: ${sizesStr}`;
    }
  }

  /**
   * Generate player movement analysis
   */
  analyzePlayerMovement(result: AssignmentResult): {
    total_moves: number;
    movement_rate: number;
    moves_by_team: { from_team: string; to_team: number; count: number }[];
    top_movers: { player_id: number; score: number; from: string; to: number }[];
  } {
    const moves: { player_id: number; score: number; from: string; to: number }[] = [];
    const movementsByTeam: Map<string, Map<number, number>> = new Map();

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

          // Track movements by team
          if (!movementsByTeam.has(fromTeam)) {
            movementsByTeam.set(fromTeam, new Map());
          }
          const toTeamMap = movementsByTeam.get(fromTeam)!;
          toTeamMap.set(team.team_id, (toTeamMap.get(team.team_id) || 0) + 1);
        }
      });
    });

    // Convert team movements to array
    const movesByTeam: { from_team: string; to_team: number; count: number }[] = [];
    movementsByTeam.forEach((toTeamMap, fromTeam) => {
      toTeamMap.forEach((count, toTeam) => {
        movesByTeam.push({ from_team: fromTeam, to_team: toTeam, count });
      });
    });

    // Get top movers (highest scoring players who moved)
    const topMovers = moves.sort((a, b) => b.score - a.score).slice(0, 10);

    return {
      total_moves: moves.length,
      movement_rate: (moves.length / result.total_players) * 100,
      moves_by_team: movesByTeam.sort((a, b) => b.count - a.count),
      top_movers: topMovers,
    };
  }

  /**
   * Generate score distribution analysis
   */
  analyzeScoreDistribution(result: AssignmentResult): {
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
  } {
    // Collect all scores
    const allScores = result.teams.flatMap((team) =>
      team.players.map((player) => player.composite_score)
    );

    if (allScores.length === 0) {
      throw new Error('No scores to analyze');
    }

    const sortedScores = [...allScores].sort((a, b) => a - b);

    // Overall statistics
    const mean = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
    const variance =
      allScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / allScores.length;
    const stdDev = Math.sqrt(variance);

    const median =
      sortedScores.length % 2 === 0
        ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
        : sortedScores[Math.floor(sortedScores.length / 2)];

    // Quartiles
    const q1Index = Math.floor(sortedScores.length * 0.25);
    const q3Index = Math.floor(sortedScores.length * 0.75);
    const quartiles = {
      q1: sortedScores[q1Index],
      q2: median,
      q3: sortedScores[q3Index],
    };

    // Team distributions
    const teamDistributions = result.teams.map((team) => ({
      team_id: team.team_id,
      score_histogram: this.createScoreHistogram(team.players.map((p) => p.composite_score)),
    }));

    return {
      overall_stats: {
        mean,
        median,
        std_dev: stdDev,
        min: Math.min(...allScores),
        max: Math.max(...allScores),
        quartiles,
      },
      team_distributions: teamDistributions,
    };
  }

  /**
   * Create score histogram for visualization
   */
  private createScoreHistogram(
    scores: number[],
    bins: number = 5
  ): { range: string; count: number }[] {
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
}
