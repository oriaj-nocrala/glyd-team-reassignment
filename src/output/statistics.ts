import { injectable } from 'tsyringe';
import { AssignmentResult, Team } from '../types';
import { TeamAnalyzer, TeamAnalysis } from '../analysis/teamAnalyzer';
import { BalanceAnalyzer, ExtendedFairnessStats } from '../analysis/balanceAnalyzer';
import { DistributionAnalyzer, ScoreDistribution, PlayerMovement } from '../analysis/distributionAnalyzer';

/**
 * Coordinates statistical analysis by delegating to specialized analyzers
 * Follows Single Responsibility Principle - orchestrates analysis without doing calculations
 */
@injectable()
export class StatisticsGenerator {
  constructor(
    private readonly teamAnalyzer: TeamAnalyzer,
    private readonly balanceAnalyzer: BalanceAnalyzer,
    private readonly distributionAnalyzer: DistributionAnalyzer
  ) {}
  /**
   * Generate comprehensive team summaries
   * Delegates to TeamAnalyzer for focused analysis
   */
  generateTeamSummary(teams: Team[]): TeamAnalysis[] {
    return this.teamAnalyzer.analyzeTeams(teams);
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
   * Calculate cross-team fairness statistics with activity analysis
   * Delegates to BalanceAnalyzer for specialized analysis
   */
  calculateFairnessStats(teams: Team[]): ExtendedFairnessStats {
    return this.balanceAnalyzer.calculateFairnessStats(teams);
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
   * Delegates to DistributionAnalyzer for specialized analysis
   */
  analyzePlayerMovement(result: AssignmentResult): PlayerMovement {
    return this.distributionAnalyzer.analyzePlayerMovement(result);
  }

  /**
   * Generate score distribution analysis
   * Delegates to DistributionAnalyzer for specialized analysis
   */
  analyzeScoreDistribution(result: AssignmentResult): ScoreDistribution {
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
   * Calculate activity statistics using days_active_last_30 as proxy for 7-day activity
   */
  private calculateActivityStats(teams: Team[]): {
    overall_active_last_7_days_percentage: number;
    teams_active_last_7_days_percentage: {
      team_id: number;
      percentage: number;
    }[];
    note?: string;
  } {
    // Use days_active_last_30 as proxy - assume players with >7 days active in last 30 were likely active in last 7
    const isActiveProxy = (player: { days_active_last_30: number }): boolean => {
      return player.days_active_last_30 >= 7;
    };

    // Calculate overall percentage
    const allPlayers = teams.flatMap(team => team.players);
    const totalPlayers = allPlayers.length;
    const activePlayersOverall = allPlayers.filter(isActiveProxy).length;
    const overallPercentage = totalPlayers > 0 ? (activePlayersOverall / totalPlayers) * 100 : 0;

    // Calculate per-team percentages
    const teamPercentages = teams.map(team => {
      const teamActiveCount = team.players.filter(isActiveProxy).length;
      const teamPercentage = team.size > 0 ? (teamActiveCount / team.size) * 100 : 0;
      
      return {
        team_id: team.team_id,
        percentage: Math.round(teamPercentage * 100) / 100, // Round to 2 decimal places
      };
    });

    return {
      overall_active_last_7_days_percentage: Math.round(overallPercentage * 100) / 100,
      teams_active_last_7_days_percentage: teamPercentages,
      note: 'Estimated from days_active_last_30 >= 7 as proxy for recent activity',
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
