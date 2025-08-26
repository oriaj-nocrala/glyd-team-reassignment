import { injectable } from 'tsyringe';
import { Team, FairnessStats } from '../types';
import { ActivityAnalyzer } from './activityAnalyzer';

type BalanceQuality = 'excellent' | 'good' | 'fair' | 'poor';

export interface ExtendedFairnessStats extends FairnessStats {
  coefficient_of_variation: number;
  gini_coefficient: number;
  balance_score: number;
}

/**
 * Responsible for analyzing team balance and fairness
 * Implements advanced balance metrics and quality assessment
 */
@injectable()
export class BalanceAnalyzer {
  constructor(private readonly activityAnalyzer: ActivityAnalyzer) {}

  /**
   * Calculate comprehensive fairness statistics with activity analysis
   */
  calculateFairnessStats(teams: Team[]): ExtendedFairnessStats {
    if (teams.length === 0) {
      throw new Error('No teams provided for fairness analysis');
    }

    const teamAverages = teams.map((team) => team.average_score);
    const teamSizes = teams.map((team) => team.size);

    // Basic statistics
    const mean = this.calculateMean(teamAverages);
    const stdDev = this.calculateStandardDeviation(teamAverages, mean);

    // Advanced metrics
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;
    const giniCoefficient = this.calculateGiniCoefficient(teamAverages);
    const balanceScore = this.calculateBalanceScore(stdDev, coefficientOfVariation, teamSizes);

    // Activity analysis
    const activityStats = this.activityAnalyzer.calculateActivityStats(teams);

    // Quality assessment
    const balanceQuality = this.assessBalanceQuality(stdDev, this.calculateSizeDifference(teamSizes));
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
        size_difference: this.calculateSizeDifference(teamSizes),
      },
      justification,
      activity_stats: activityStats,
      coefficient_of_variation: coefficientOfVariation,
      gini_coefficient: giniCoefficient,
      balance_score: balanceScore,
    };
  }

  private calculateMean(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private calculateStandardDeviation(values: number[], mean: number): number {
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateSizeDifference(teamSizes: number[]): number {
    return Math.max(...teamSizes) - Math.min(...teamSizes);
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
    const sizeBalance = this.calculateSizeDifference(teamSizes) <= 1 ? 1 : 0; // Perfect if diff <= 1

    // Weighted average
    const overallBalance = scoreBalance * 0.4 + variationBalance * 0.3 + sizeBalance * 0.3;

    return Math.round(overallBalance * 100);
  }

  /**
   * Assess balance quality level
   */
  private assessBalanceQuality(scoreStdDev: number, sizeDifference: number): BalanceQuality {
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
    quality: BalanceQuality,
    scoreStdDev: number,
    teamSizes: number[]
  ): string {
    const sizesStr = teamSizes.join(', ');
    const stdDevPercent = (scoreStdDev * 100).toFixed(1);

    const messages = {
      excellent: `Teams are excellently balanced with ${stdDevPercent}% score deviation and equal sizes (${sizesStr}). Snake draft ensured optimal distribution.`,
      good: `Teams are well-balanced with ${stdDevPercent}% score deviation and sizes (${sizesStr}). Minor differences are within acceptable limits.`,
      fair: `Teams show fair balance with ${stdDevPercent}% score deviation. Team sizes (${sizesStr}) differ by at most 1 player as required.`,
      poor: `Team balance could be improved. Score deviation is ${stdDevPercent}% with sizes (${sizesStr}). Consider different distribution strategy.`,
    };

    return messages[quality] || `Team balance assessment: ${stdDevPercent}% score deviation, sizes: ${sizesStr}`;
  }
}