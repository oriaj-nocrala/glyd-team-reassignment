import { 
  EnhancedPlayer, 
  EnhancedPlayerWithScore, 
  EnhancedBalanceMetrics 
} from '../types';

export class EnhancedMetricsCalculator {
  private static readonly DEFAULT_ENHANCED_WEIGHTS: EnhancedBalanceMetrics = {
    // Level A weights (reduced to make room for Level B)
    engagement_weight: 0.25,        // Was 0.4
    activity_weight: 0.20,          // Was 0.3
    points_weight: 0.15,            // Was 0.2
    streak_weight: 0.05,            // Was 0.1
    
    // Level B weights (new sophisticated metrics)
    event_quality_weight: 0.20,     // Event variety and high-value participation
    communication_weight: 0.10,     // Community engagement through chat
    spending_behavior_weight: 0.05  // Economic decision making
  };

  /**
   * Calculate enhanced composite scores combining Level A and Level B features
   */
  static calculateEnhancedPlayerScores(
    enhancedPlayers: EnhancedPlayer[],
    weights: EnhancedBalanceMetrics = this.DEFAULT_ENHANCED_WEIGHTS
  ): EnhancedPlayerWithScore[] {
    console.log('🧮 Calculating enhanced composite scores (Level A + Level B)...');

    // Normalize all metrics across the player base
    const normalizedMetrics = this.normalizeAllMetrics(enhancedPlayers);
    
    return enhancedPlayers.map((player, index) => {
      const normalized = normalizedMetrics[index];
      
      // Calculate Level A score (traditional metrics)
      const levelAScore = this.calculateLevelAScore(normalized, weights);
      
      // Calculate Level B score (derived from raw data)
      const levelBScore = this.calculateLevelBScore(normalized, weights);
      
      // Combined composite score
      const compositeScore = levelAScore + levelBScore;

      return {
        ...player,
        composite_score: compositeScore,
        level_a_score: levelAScore,
        level_b_score: levelBScore
      };
    });
  }

  /**
   * Normalize all metrics (Level A + Level B) to 0-1 scale
   */
  private static normalizeAllMetrics(players: EnhancedPlayer[]): NormalizedMetrics[] {
    if (players.length === 0) {
      return [];
    }

    // Extract all metric values
    const metrics = {
      // Level A metrics
      engagement: players.map(p => p.historical_event_engagements),
      activity: players.map(p => p.days_active_last_30),
      points: players.map(p => p.current_total_points),
      streak: players.map(p => p.current_streak_value),
      
      // Level B: Event quality metrics
      eventVariety: players.map(p => p.event_variety_score),
      highValueEvents: players.map(p => p.high_value_events_ratio),
      engagementConsistency: players.map(p => p.engagement_consistency),
      recentEventActivity: players.map(p => p.recent_event_activity),
      
      // Level B: Communication metrics
      messageEngagement: players.map(p => p.message_engagement_ratio),
      conversationParticipation: players.map(p => p.conversation_participation),
      messageLengthAvg: players.map(p => p.message_length_avg),
      replyEngagementRate: players.map(p => p.reply_engagement_rate),
      
      // Level B: Spending metrics
      spendingEfficiency: players.map(p => p.spending_efficiency),
      consumableUsageRate: players.map(p => p.consumable_usage_rate),
      spendingFrequency: players.map(p => p.spending_frequency),
      investmentVsConsumption: players.map(p => p.investment_vs_consumption)
    };

    // Calculate ranges for normalization
    const ranges = Object.fromEntries(
      Object.entries(metrics).map(([key, values]) => [
        key,
        { min: Math.min(...values), max: Math.max(...values) }
      ])
    );

    // Normalize each player's metrics
    return players.map((_, index) => ({
      // Level A normalized
      engagement: this.normalize(metrics.engagement[index], ranges.engagement),
      activity: this.normalize(metrics.activity[index], ranges.activity),
      points: this.normalize(metrics.points[index], ranges.points),
      streak: this.normalize(metrics.streak[index], ranges.streak),
      
      // Level B: Event quality normalized
      eventVariety: this.normalize(metrics.eventVariety[index], ranges.eventVariety),
      highValueEvents: this.normalize(metrics.highValueEvents[index], ranges.highValueEvents),
      engagementConsistency: this.normalize(metrics.engagementConsistency[index], ranges.engagementConsistency),
      recentEventActivity: this.normalize(metrics.recentEventActivity[index], ranges.recentEventActivity),
      
      // Level B: Communication normalized
      messageEngagement: this.normalize(metrics.messageEngagement[index], ranges.messageEngagement),
      conversationParticipation: this.normalize(metrics.conversationParticipation[index], ranges.conversationParticipation),
      messageLengthAvg: this.normalize(metrics.messageLengthAvg[index], ranges.messageLengthAvg),
      replyEngagementRate: this.normalize(metrics.replyEngagementRate[index], ranges.replyEngagementRate),
      
      // Level B: Spending normalized
      spendingEfficiency: this.normalize(metrics.spendingEfficiency[index], ranges.spendingEfficiency),
      consumableUsageRate: this.normalize(metrics.consumableUsageRate[index], ranges.consumableUsageRate),
      spendingFrequency: this.normalize(metrics.spendingFrequency[index], ranges.spendingFrequency),
      investmentVsConsumption: this.normalize(metrics.investmentVsConsumption[index], ranges.investmentVsConsumption)
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
   * Calculate Level A score using traditional metrics
   */
  private static calculateLevelAScore(
    normalized: NormalizedMetrics,
    weights: EnhancedBalanceMetrics
  ): number {
    return (
      normalized.engagement * weights.engagement_weight +
      normalized.activity * weights.activity_weight +
      normalized.points * weights.points_weight +
      normalized.streak * weights.streak_weight
    );
  }

  /**
   * Calculate Level B score using derived features
   */
  private static calculateLevelBScore(
    normalized: NormalizedMetrics,
    weights: EnhancedBalanceMetrics
  ): number {
    // Event quality component
    const eventQualityScore = (
      normalized.eventVariety * 0.3 +
      normalized.highValueEvents * 0.3 +
      normalized.engagementConsistency * 0.2 +
      normalized.recentEventActivity * 0.2
    ) * weights.event_quality_weight;

    // Communication component  
    const communicationScore = (
      normalized.messageEngagement * 0.3 +
      normalized.conversationParticipation * 0.3 +
      normalized.messageLengthAvg * 0.2 +
      normalized.replyEngagementRate * 0.2
    ) * weights.communication_weight;

    // Spending behavior component
    const spendingScore = (
      normalized.spendingEfficiency * 0.4 +
      normalized.consumableUsageRate * 0.2 +
      normalized.spendingFrequency * 0.2 +
      normalized.investmentVsConsumption * 0.2
    ) * weights.spending_behavior_weight;

    return eventQualityScore + communicationScore + spendingScore;
  }

  /**
   * Analyze the contribution of Level A vs Level B scores
   */
  static analyzeLevelContributions(players: EnhancedPlayerWithScore[]): {
    level_a_stats: { mean: number; std: number; min: number; max: number };
    level_b_stats: { mean: number; std: number; min: number; max: number };
    correlation: number;
    level_b_impact: number;
  } {
    const levelAScores = players.map(p => p.level_a_score);
    const levelBScores = players.map(p => p.level_b_score);
    const compositeScores = players.map(p => p.composite_score);

    const calculateStats = (values: number[]) => ({
      mean: values.reduce((sum, v) => sum + v, 0) / values.length,
      std: Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - values.reduce((s, vv) => s + vv, 0) / values.length, 2), 0) / values.length),
      min: Math.min(...values),
      max: Math.max(...values)
    });

    // Calculate correlation between Level A and Level B scores
    const meanA = levelAScores.reduce((sum, v) => sum + v, 0) / levelAScores.length;
    const meanB = levelBScores.reduce((sum, v) => sum + v, 0) / levelBScores.length;
    
    const numerator = levelAScores.reduce((sum, a, i) => sum + (a - meanA) * (levelBScores[i] - meanB), 0);
    const denominator = Math.sqrt(
      levelAScores.reduce((sum, a) => sum + Math.pow(a - meanA, 2), 0) *
      levelBScores.reduce((sum, b) => sum + Math.pow(b - meanB, 2), 0)
    );
    
    const correlation = denominator === 0 ? 0 : numerator / denominator;

    // Calculate Level B impact on final rankings
    const levelAOnlyRanks = levelAScores
      .map((score, index) => ({ score, index }))
      .sort((a, b) => b.score - a.score)
      .map((item, rank) => ({ index: item.index, rank }));
    
    const compositeRanks = compositeScores
      .map((score, index) => ({ score, index }))
      .sort((a, b) => b.score - a.score)
      .map((item, rank) => ({ index: item.index, rank }));

    // Calculate rank changes
    const rankChanges = levelAOnlyRanks.map(levelA => {
      const compositeRank = compositeRanks.find(c => c.index === levelA.index)!.rank;
      return Math.abs(levelA.rank - compositeRank);
    });

    const avgRankChange = rankChanges.reduce((sum, change) => sum + change, 0) / rankChanges.length;
    const levelBImpact = avgRankChange / players.length; // Normalized impact

    return {
      level_a_stats: calculateStats(levelAScores),
      level_b_stats: calculateStats(levelBScores),
      correlation,
      level_b_impact: levelBImpact
    };
  }

  /**
   * Generate Level B feature importance report
   */
  static generateLevelBReport(
    players: EnhancedPlayerWithScore[],
    weights: EnhancedBalanceMetrics = this.DEFAULT_ENHANCED_WEIGHTS
  ): string {
    const analysis = this.analyzeLevelContributions(players);
    
    let report = '\n📊 Enhanced Scoring Analysis (Level A + Level B):\n\n';
    
    report += '🏆 Score Components:\n';
    report += `   • Level A (Traditional): ${(analysis.level_a_stats.mean * 100).toFixed(1)}% avg contribution\n`;
    report += `   • Level B (Advanced): ${(analysis.level_b_stats.mean * 100).toFixed(1)}% avg contribution\n`;
    report += `   • Correlation: ${(analysis.correlation * 100).toFixed(1)}% (independence measure)\n`;
    report += `   • Level B Impact: ${(analysis.level_b_impact * 100).toFixed(1)}% rank change\n\n`;
    
    report += '⚖️ Feature Weights Used:\n';
    report += `   • Event Engagement: ${(weights.engagement_weight * 100).toFixed(0)}%\n`;
    report += `   • Recent Activity: ${(weights.activity_weight * 100).toFixed(0)}%\n`;
    report += `   • Points Balance: ${(weights.points_weight * 100).toFixed(0)}%\n`;
    report += `   • Activity Streak: ${(weights.streak_weight * 100).toFixed(0)}%\n`;
    report += `   • Event Quality: ${(weights.event_quality_weight * 100).toFixed(0)}% (NEW)\n`;
    report += `   • Communication: ${(weights.communication_weight * 100).toFixed(0)}% (NEW)\n`;
    report += `   • Spending Behavior: ${(weights.spending_behavior_weight * 100).toFixed(0)}% (NEW)\n\n`;
    
    report += '🎯 Level B Insights:\n';
    if (analysis.level_b_impact > 0.1) {
      report += '   • Significant impact: Level B features meaningfully changed player rankings\n';
    } else {
      report += '   • Moderate impact: Level B features provided nuanced adjustments\n';
    }
    
    if (analysis.correlation < 0.5) {
      report += '   • Good independence: Level B captures different aspects than Level A\n';
    } else {
      report += '   • Some overlap: Level B partially correlates with traditional metrics\n';
    }

    return report;
  }
}

// Interface for normalized metrics
interface NormalizedMetrics {
  // Level A
  engagement: number;
  activity: number;
  points: number;
  streak: number;
  
  // Level B: Event quality
  eventVariety: number;
  highValueEvents: number;
  engagementConsistency: number;
  recentEventActivity: number;
  
  // Level B: Communication
  messageEngagement: number;
  conversationParticipation: number;
  messageLengthAvg: number;
  replyEngagementRate: number;
  
  // Level B: Spending
  spendingEfficiency: number;
  consumableUsageRate: number;
  spendingFrequency: number;
  investmentVsConsumption: number;
}