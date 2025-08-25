import { Player, PlayerWithScore, BalanceMetrics } from '../types';

export class MetricsCalculator {
  private static readonly DEFAULT_WEIGHTS: BalanceMetrics = {
    engagement_weight: 0.4,
    activity_weight: 0.3,
    points_weight: 0.2,
    streak_weight: 0.1
  };

  /**
   * Calculate composite score for each player based on multiple metrics
   */
  static calculatePlayerScores(
    players: Player[], 
    weights: BalanceMetrics = this.DEFAULT_WEIGHTS
  ): PlayerWithScore[] {
    const normalized = this.normalizeMetrics(players);
    
    return players.map((player, index) => ({
      ...player,
      composite_score: this.calculateCompositeScore(normalized[index], weights)
    }));
  }

  /**
   * Normalize all metrics to 0-1 scale for fair comparison
   */
  private static normalizeMetrics(players: Player[]): {
    engagement: number;
    activity: number;
    points: number;
    streak: number;
  }[] {
    if (players.length === 0) {
      return [];
    }

    // Get min/max values for each metric
    const engagements = players.map(p => p.historical_event_engagements);
    const activities = players.map(p => p.days_active_last_30);
    const points = players.map(p => p.current_total_points);
    const streaks = players.map(p => p.current_streak_value);

    const ranges = {
      engagement: { min: Math.min(...engagements), max: Math.max(...engagements) },
      activity: { min: Math.min(...activities), max: Math.max(...activities) },
      points: { min: Math.min(...points), max: Math.max(...points) },
      streak: { min: Math.min(...streaks), max: Math.max(...streaks) }
    };

    return players.map(player => ({
      engagement: this.normalize(player.historical_event_engagements, ranges.engagement),
      activity: this.normalize(player.days_active_last_30, ranges.activity),
      points: this.normalize(player.current_total_points, ranges.points),
      streak: this.normalize(player.current_streak_value, ranges.streak)
    }));
  }

  /**
   * Normalize a value to 0-1 scale
   */
  private static normalize(value: number, range: { min: number; max: number }): number {
    if (range.max === range.min) {
      return 0.5; // If all values are the same, use middle value
    }
    return (value - range.min) / (range.max - range.min);
  }

  /**
   * Calculate weighted composite score
   */
  private static calculateCompositeScore(
    normalized: { engagement: number; activity: number; points: number; streak: number },
    weights: BalanceMetrics
  ): number {
    return (
      normalized.engagement * weights.engagement_weight +
      normalized.activity * weights.activity_weight +
      normalized.points * weights.points_weight +
      normalized.streak * weights.streak_weight
    );
  }

  /**
   * Calculate engagement score specifically
   */
  static calculateEngagementScore(player: Player): number {
    // Combine event participation and engagement intensity
    const participationScore = Math.min(player.historical_events_participated / 50, 1); // Cap at 50 events
    const engagementScore = Math.min(player.historical_event_engagements / 100, 1); // Cap at 100 engagements
    
    return (participationScore + engagementScore) / 2;
  }

  /**
   * Calculate activity score based on recent activity
   */
  static calculateActivityScore(player: Player): number {
    // Weight recent activity higher
    const recentActivity = Math.min(player.days_active_last_30 / 30, 1);
    const streakBonus = Math.min(player.current_streak_value / 10, 0.2); // Max 20% bonus
    
    return Math.min(recentActivity + streakBonus, 1);
  }

  /**
   * Get player rankings by composite score
   */
  static rankPlayersByScore(playersWithScores: PlayerWithScore[]): PlayerWithScore[] {
    return [...playersWithScores].sort((a, b) => {
      // Primary sort by composite score (descending)
      if (b.composite_score !== a.composite_score) {
        return b.composite_score - a.composite_score;
      }
      
      // Secondary sort by player_id for deterministic results
      return a.player_id - b.player_id;
    });
  }

  /**
   * Calculate team balance metrics
   */
  static calculateTeamBalance(teams: { players: PlayerWithScore[] }[]): {
    mean_scores: number[];
    score_variance: number;
    balance_coefficient: number;
  } {
    const teamMeans = teams.map(team => {
      if (team.players.length === 0) return 0;
      return team.players.reduce((sum, player) => sum + player.composite_score, 0) / team.players.length;
    });

    const overallMean = teamMeans.reduce((sum, mean) => sum + mean, 0) / teamMeans.length;
    const variance = teamMeans.reduce((sum, mean) => sum + Math.pow(mean - overallMean, 2), 0) / teamMeans.length;
    
    // Balance coefficient: 1 = perfectly balanced, lower = less balanced
    const maxPossibleVariance = 0.25; // Theoretical max for normalized scores
    const balanceCoefficient = Math.max(0, 1 - (variance / maxPossibleVariance));

    return {
      mean_scores: teamMeans,
      score_variance: variance,
      balance_coefficient: balanceCoefficient
    };
  }

  /**
   * Get detailed score breakdown for a player
   */
  static getPlayerScoreBreakdown(player: Player, weights: BalanceMetrics = this.DEFAULT_WEIGHTS): {
    player_id: number;
    raw_metrics: {
      engagement: number;
      activity: number;
      points: number;
      streak: number;
    };
    weighted_contributions: {
      engagement: number;
      activity: number;
      points: number;
      streak: number;
    };
    total_score: number;
  } {
    const normalized = this.normalizeMetrics([player])[0];
    
    return {
      player_id: player.player_id,
      raw_metrics: {
        engagement: player.historical_event_engagements,
        activity: player.days_active_last_30,
        points: player.current_total_points,
        streak: player.current_streak_value
      },
      weighted_contributions: {
        engagement: normalized.engagement * weights.engagement_weight,
        activity: normalized.activity * weights.activity_weight,
        points: normalized.points * weights.points_weight,
        streak: normalized.streak * weights.streak_weight
      },
      total_score: this.calculateCompositeScore(normalized, weights)
    };
  }
}