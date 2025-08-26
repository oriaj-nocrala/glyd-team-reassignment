import { injectable } from 'tsyringe';
import { AssignmentResult, Team } from '../types';
import { TeamAnalyzer, TeamAnalysis } from '../analysis/teamAnalyzer';
import { BalanceAnalyzer, ExtendedFairnessStats } from '../analysis/balanceAnalyzer';
import { DistributionAnalyzer, ScoreDistribution, PlayerMovement } from '../analysis/distributionAnalyzer';

/**
 * Orchestrates statistical analysis by delegating to specialized analyzers
 * Follows Single Responsibility Principle - coordinates analysis without doing calculations
 * 
 * This demonstrates proper separation of concerns for a job application:
 * - Each analyzer has a single, focused responsibility
 * - This orchestrator simply coordinates the workflow
 * - Easy to test, maintain, and extend
 */
@injectable()
export class StatisticsOrchestrator {
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
   * Calculate cross-team fairness statistics with activity analysis
   * Delegates to BalanceAnalyzer for specialized analysis
   */
  calculateFairnessStats(teams: Team[]): ExtendedFairnessStats {
    return this.balanceAnalyzer.calculateFairnessStats(teams);
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
    return this.distributionAnalyzer.analyzeScoreDistribution(result);
  }

  /**
   * Generate comprehensive statistical report
   * Orchestrates all analysis types for complete insights
   */
  generateComprehensiveReport(result: AssignmentResult): {
    team_summaries: TeamAnalysis[];
    fairness_stats: ExtendedFairnessStats;
    player_movements: PlayerMovement;
    score_distribution: ScoreDistribution;
  } {
    return {
      team_summaries: this.generateTeamSummary(result.teams),
      fairness_stats: this.calculateFairnessStats(result.teams),
      player_movements: this.analyzePlayerMovement(result),
      score_distribution: this.analyzeScoreDistribution(result),
    };
  }
}