import { Player, PlayerWithScore, Team, AssignmentResult } from '../types';
import { MetricsCalculator } from '../analysis/metrics';
import { TeamBalancer } from '../analysis/balancer';
import { DeterministicRandom, SeedManager } from './deterministic';
import { logger } from '../utils/logger';

export class TeamShuffler {
  private rng!: DeterministicRandom;
  
  constructor(private seed?: number) {
    // Will be initialized in assignTeams when we have player data
  }

  /**
   * Main assignment method - creates balanced teams from players
   */
  async assignTeams(
    players: Player[],
    targetTeams: number,
    optimizeBalance: boolean = true
  ): Promise<AssignmentResult> {
    if (players.length === 0) {
      throw new Error('No players provided for team assignment');
    }

    // Initialize deterministic random with combined seed
    const dataSeed = SeedManager.generateDataSeed(players.map(p => p.player_id));
    const finalSeed = SeedManager.combineSeed(this.seed, dataSeed);
    this.rng = new DeterministicRandom(finalSeed);

    logger.log(SeedManager.formatSeedInfo(this.seed, finalSeed));

    // Calculate player scores
    const playersWithScores = MetricsCalculator.calculatePlayerScores(players);

    // Create initial team assignments
    let teams = this.createInitialAssignment(playersWithScores, targetTeams);

    // Optimize balance if requested
    if (optimizeBalance) {
      const optimization = TeamBalancer.optimizeTeamBalance(teams);
      teams = optimization.optimized;
      logger.log(`Balance optimization: ${optimization.iterations} iterations, ${(optimization.improvement * 100).toFixed(2)}% improvement`);
    }

    // Calculate fairness statistics
    const fairnessStats = TeamBalancer.calculateFairness(teams);

    return {
      teams,
      total_players: players.length,
      target_teams: targetTeams,
      seed: finalSeed,
      fairness_stats: fairnessStats
    };
  }

  /**
   * Create initial team assignment using snake draft
   */
  private createInitialAssignment(
    playersWithScores: PlayerWithScore[],
    targetTeams: number
  ): Team[] {
    // Add some randomization to break ties while maintaining determinism
    const shuffledPlayers = this.deterministicPreShuffle(playersWithScores);
    
    // Use snake draft for balanced distribution
    return TeamBalancer.createBalancedTeams(shuffledPlayers, targetTeams);
  }

  /**
   * Pre-shuffle players to break score ties deterministically
   */
  private deterministicPreShuffle(players: PlayerWithScore[]): PlayerWithScore[] {
    // Group players by similar scores (within small threshold)
    const scoreGroups = this.groupPlayersByScore(players, 0.01); // 1% threshold
    
    // Shuffle within each score group to break ties
    const shuffledGroups = scoreGroups.map(group => 
      this.rng.shuffle(group)
    );

    // Flatten back to single array
    return shuffledGroups.flat();
  }

  /**
   * Group players with similar composite scores
   */
  private groupPlayersByScore(players: PlayerWithScore[], threshold: number): PlayerWithScore[][] {
    const sorted = [...players].sort((a, b) => b.composite_score - a.composite_score);
    const groups: PlayerWithScore[][] = [];
    let currentGroup: PlayerWithScore[] = [];

    sorted.forEach((player) => {
      if (currentGroup.length === 0) {
        currentGroup = [player];
      } else {
        const scoreDiff = Math.abs(currentGroup[0].composite_score - player.composite_score);
        
        if (scoreDiff <= threshold) {
          currentGroup.push(player);
        } else {
          groups.push(currentGroup);
          currentGroup = [player];
        }
      }
    });

    // Don't forget the last group
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  /**
   * Round-robin distribution alternative (for comparison)
   */
  roundRobinAssignment(playersWithScores: PlayerWithScore[], targetTeams: number): Team[] {
    const rankedPlayers = MetricsCalculator.rankPlayersByScore(playersWithScores);
    
    // Initialize teams
    const teams: Team[] = [];
    for (let i = 0; i < targetTeams; i++) {
      teams.push({
        team_id: i + 1,
        players: [],
        total_score: 0,
        average_score: 0,
        size: 0
      });
    }

    // Simple round-robin assignment
    rankedPlayers.forEach((player, index) => {
      const teamIndex = index % targetTeams;
      teams[teamIndex].players.push(player);
    });

    // Calculate team statistics
    return teams.map(team => this.calculateTeamStats(team));
  }

  /**
   * Calculate team statistics
   */
  private calculateTeamStats(team: Team): Team {
    if (team.players.length === 0) {
      return { ...team, total_score: 0, average_score: 0, size: 0 };
    }

    const total = team.players.reduce((sum, player) => sum + player.composite_score, 0);
    
    return {
      ...team,
      total_score: total,
      average_score: total / team.players.length,
      size: team.players.length
    };
  }

  /**
   * Generate assignment summary
   */
  static generateAssignmentSummary(result: AssignmentResult): string {
    const { teams, total_players, target_teams, fairness_stats } = result;
    
    let summary = `\n=== TEAM ASSIGNMENT SUMMARY ===\n`;
    summary += `Total Players: ${total_players}\n`;
    summary += `Target Teams: ${target_teams}\n`;
    summary += `Seed: ${result.seed}\n\n`;

    teams.forEach(team => {
      summary += `Team ${team.team_id}: ${team.size} players, Avg Score: ${team.average_score.toFixed(3)}\n`;
    });

    summary += `\nFairness Statistics:\n`;
    summary += `- Score Standard Deviation: ${fairness_stats.score_standard_deviation.toFixed(4)}\n`;
    summary += `- Score Range: ${fairness_stats.score_range.min.toFixed(3)} - ${fairness_stats.score_range.max.toFixed(3)}\n`;
    summary += `- Team Sizes: ${teams.map(t => t.size).join(', ')}\n`;
    summary += `- Size Difference: ${fairness_stats.size_balance.size_difference}\n\n`;
    summary += `Justification: ${fairness_stats.justification}\n`;

    return summary;
  }

  /**
   * Export team assignments for external use
   */
  static exportAssignments(result: AssignmentResult): { 
    player_id: number; 
    new_team_id: number; 
    composite_score: number;
    old_team_id: number;
    old_team_name: string;
  }[] {
    const assignments: { 
      player_id: number; 
      new_team_id: number; 
      composite_score: number;
      old_team_id: number;
      old_team_name: string;
    }[] = [];

    result.teams.forEach(team => {
      team.players.forEach(player => {
        assignments.push({
          player_id: player.player_id,
          new_team_id: team.team_id,
          composite_score: player.composite_score,
          old_team_id: player.current_team_id,
          old_team_name: player.current_team_name
        });
      });
    });

    // Sort by player_id for consistent output
    return assignments.sort((a, b) => a.player_id - b.player_id);
  }
}