import { PlayerWithScore, Team, FairnessStats } from '../types';
import { MetricsCalculator } from './metrics';

export class TeamBalancer {
  /**
   * Create balanced teams using snake draft distribution
   */
  static createBalancedTeams(playersWithScores: PlayerWithScore[], targetTeams: number): Team[] {
    // Sort players by composite score (highest first)
    const rankedPlayers = MetricsCalculator.rankPlayersByScore(playersWithScores);

    // Initialize empty teams
    const teams: Team[] = [];
    for (let i = 0; i < targetTeams; i++) {
      teams.push({
        team_id: i + 1,
        players: [],
        total_score: 0,
        average_score: 0,
        size: 0,
      });
    }

    // Snake draft distribution: alternate direction each round
    let currentTeam = 0;
    let direction = 1; // 1 for forward, -1 for backward

    rankedPlayers.forEach((player) => {
      // Add player to current team
      teams[currentTeam].players.push(player);

      // Move to next team
      currentTeam += direction;

      // If we've reached the end, reverse direction and start new round
      if (currentTeam >= targetTeams) {
        currentTeam = targetTeams - 1;
        direction = -1;
      } else if (currentTeam < 0) {
        currentTeam = 0;
        direction = 1;
      }
    });

    // Calculate team statistics
    return teams.map((team) => {
      const stats = MetricsCalculator.calculateTeamStats(team);
      return { ...team, ...stats };
    });
  }

  /**
   * Validate that team sizes are balanced (max difference of 1)
   */
  static validateTeamSizes(teams: Team[]): { isValid: boolean; message?: string } {
    if (teams.length === 0) {
      return { isValid: false, message: 'No teams provided' };
    }

    const sizes = teams.map((team) => team.size);
    const minSize = Math.min(...sizes);
    const maxSize = Math.max(...sizes);
    const sizeDifference = maxSize - minSize;

    if (sizeDifference > 1) {
      return {
        isValid: false,
        message: `Team size difference is ${sizeDifference} (max allowed: 1). Sizes: [${sizes.join(', ')}]`,
      };
    }

    return { isValid: true };
  }

  /**
   * Calculate fairness statistics for team balance
   */
  static calculateFairness(teams: Team[]): FairnessStats {
    if (teams.length === 0) {
      throw new Error('No teams to analyze');
    }

    const averageScores = teams.map((team) => team.average_score);
    const teamSizes = teams.map((team) => team.size);

    // Calculate score statistics
    const meanScore = averageScores.reduce((sum, score) => sum + score, 0) / averageScores.length;
    const scoreVariance =
      averageScores.reduce((sum, score) => sum + Math.pow(score - meanScore, 2), 0) /
      averageScores.length;
    const scoreStdDev = Math.sqrt(scoreVariance);

    const minScore = Math.min(...averageScores);
    const maxScore = Math.max(...averageScores);

    const minSize = Math.min(...teamSizes);
    const maxSize = Math.max(...teamSizes);

    // Generate justification based on balance quality
    const balanceQuality = this.assessBalanceQuality(scoreStdDev, maxSize - minSize);
    const justification = this.generateJustification(balanceQuality, scoreStdDev, teamSizes);

    return {
      score_standard_deviation: scoreStdDev,
      score_range: {
        min: minScore,
        max: maxScore,
      },
      size_balance: {
        min_size: minSize,
        max_size: maxSize,
        size_difference: maxSize - minSize,
      },
      justification,
      activity_stats: {
        overall_active_last_7_days_percentage: 0,
        teams_active_last_7_days_percentage: [],
        note: 'Activity stats not calculated in balancer - use StatisticsGenerator for detailed activity analysis',
      },
    };
  }

  /**
   * Assess overall balance quality
   */
  private static assessBalanceQuality(
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
   * Generate human-readable justification for team balance
   */
  private static generateJustification(
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
        return `Team balance could be improved. Score deviation is ${stdDevPercent}% with sizes (${sizesStr}). Consider different player distribution strategy.`;

      default:
        return `Team balance assessment: ${stdDevPercent}% score deviation, sizes: ${sizesStr}`;
    }
  }

  /**
   * Optimize team assignment using iterative improvement
   */
  static optimizeTeamBalance(
    teams: Team[],
    maxIterations: number = 100
  ): { optimized: Team[]; iterations: number; improvement: number } {
    let currentTeams = teams.map((team) => ({ ...team, players: [...team.players] }));
    let currentBalance = MetricsCalculator.calculateTeamBalance(currentTeams);
    let bestTeams = currentTeams;
    let bestBalance = currentBalance;
    let iterations = 0;

    for (let i = 0; i < maxIterations; i++) {
      iterations++;

      // Try swapping players between teams
      const improved = this.attemptPlayerSwaps(currentTeams);

      if (improved) {
        currentTeams = improved.teams;
        currentBalance = MetricsCalculator.calculateTeamBalance(currentTeams);

        // Keep track of best solution
        if (currentBalance.balance_coefficient > bestBalance.balance_coefficient) {
          bestTeams = currentTeams.map((team) => ({ ...team, players: [...team.players] }));
          bestBalance = currentBalance;
        }
      } else {
        // No improvement found, stop optimization
        break;
      }
    }

    const improvement =
      bestBalance.balance_coefficient -
      MetricsCalculator.calculateTeamBalance(teams).balance_coefficient;

    return {
      optimized: bestTeams.map((team) => {
        const stats = MetricsCalculator.calculateTeamStats(team);
        return { ...team, ...stats };
      }),
      iterations,
      improvement,
    };
  }

  /**
   * Attempt to improve balance by swapping players between teams
   */
  private static attemptPlayerSwaps(teams: Team[]): { teams: Team[] } | null {
    const currentBalance = MetricsCalculator.calculateTeamBalance(teams).balance_coefficient;

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        // Try swapping each player from team i with each player from team j
        for (let pi = 0; pi < teams[i].players.length; pi++) {
          for (let pj = 0; pj < teams[j].players.length; pj++) {
            const testTeams = this.swapPlayers(teams, i, pi, j, pj);
            const newBalance =
              MetricsCalculator.calculateTeamBalance(testTeams).balance_coefficient;

            if (newBalance > currentBalance) {
              return { teams: testTeams };
            }
          }
        }
      }
    }

    return null; // No improvement found
  }

  /**
   * Swap two players between teams
   */
  private static swapPlayers(
    teams: Team[],
    teamA: number,
    playerA: number,
    teamB: number,
    playerB: number
  ): Team[] {
    const newTeams = teams.map((team) => ({ ...team, players: [...team.players] }));

    const playerAData = newTeams[teamA].players[playerA];
    const playerBData = newTeams[teamB].players[playerB];

    newTeams[teamA].players[playerA] = playerBData;
    newTeams[teamB].players[playerB] = playerAData;

    return newTeams.map((team) => {
      const stats = MetricsCalculator.calculateTeamStats(team);
      return { ...team, ...stats };
    });
  }
}
