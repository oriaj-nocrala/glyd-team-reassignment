import { injectable } from 'tsyringe';
import { EnhancedPlayer, EnhancedPlayerWithScore, EnhancedBalanceMetrics } from '../types';

@injectable()
export class EnhancedMetricsCalculator {
  private readonly DEFAULT_ENHANCED_WEIGHTS: EnhancedBalanceMetrics = {
    // Level A weights (reduced to make room for Level B)
    engagement_weight: 0.25, // Was 0.4
    activity_weight: 0.2, // Was 0.3
    points_weight: 0.15, // Was 0.2
    streak_weight: 0.05, // Was 0.1

    // Level B weights (new sophisticated metrics)
    event_quality_weight: 0.2, // Event variety and high-value participation
    communication_weight: 0.1, // Community engagement through chat
    spending_behavior_weight: 0.05, // Economic decision making
  };

  /**
   * Calculate enhanced composite scores combining Level A and Level B features
   */
  calculateEnhancedPlayerScores(
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
        level_b_score: levelBScore,
      };
    });
  }

  /**
   * Normalize all metrics (Level A + Level B) to 0-1 scale
   */
  private normalizeAllMetrics(players: EnhancedPlayer[]): NormalizedMetrics[] {
    if (players.length === 0) {
      return [];
    }

    const metrics = {
      engagement: players.map((p) => p.historical_event_engagements),
      activity: players.map((p) => p.days_active_last_30),
      points: players.map((p) => p.current_total_points),
      streak: players.map((p) => p.current_streak_value),
      eventVariety: players.map((p) => p.event_variety_score),
      highValueEvents: players.map((p) => p.high_value_events_ratio),
      engagementConsistency: players.map((p) => p.engagement_consistency),
      recentEventActivity: players.map((p) => p.recent_event_activity),
      messageEngagement: players.map((p) => p.message_engagement_ratio),
      conversationParticipation: players.map((p) => p.conversation_participation),
      messageLengthAvg: players.map((p) => p.message_length_avg),
      replyEngagementRate: players.map((p) => p.reply_engagement_rate),
      spendingEfficiency: players.map((p) => p.spending_efficiency),
      consumableUsageRate: players.map((p) => p.consumable_usage_rate),
      spendingFrequency: players.map((p) => p.spending_frequency),
      investmentVsConsumption: players.map((p) => p.investment_vs_consumption),
    };

    const ranges = Object.fromEntries(
      Object.entries(metrics).map(([key, values]) => [
        key,
        { min: Math.min(...values), max: Math.max(...values) },
      ])
    );

    const normalizedLevelA = this.normalizeLevelAMetrics(players, ranges);
    const normalizedEventQuality = this.normalizeEventQualityMetrics(players, ranges);
    const normalizedCommunication = this.normalizeCommunicationMetrics(players, ranges);
    const normalizedSpending = this.normalizeSpendingMetrics(players, ranges);

    return players.map((_, index) => ({
      ...normalizedLevelA[index],
      ...normalizedEventQuality[index],
      ...normalizedCommunication[index],
      ...normalizedSpending[index],
    }));
  }

  /**
   * Normalize a value to 0-1 scale
   */
  private normalize(value: number, range: { min: number; max: number }): number {
    if (range.max === range.min) {
      return 0.5; // If all values are the same, use middle value
    }
    return (value - range.min) / (range.max - range.min);
  }

  private normalizeLevelAMetrics(players: EnhancedPlayer[], ranges: MetricRanges) {
    return players.map((p) => ({
      engagement: this.normalize(p.historical_event_engagements, ranges.engagement),
      activity: this.normalize(p.days_active_last_30, ranges.activity),
      points: this.normalize(p.current_total_points, ranges.points),
      streak: this.normalize(p.current_streak_value, ranges.streak),
    }));
  }

  private normalizeEventQualityMetrics(players: EnhancedPlayer[], ranges: MetricRanges) {
    return players.map((p) => ({
      eventVariety: this.normalize(p.event_variety_score, ranges.eventVariety),
      highValueEvents: this.normalize(p.high_value_events_ratio, ranges.highValueEvents),
      engagementConsistency: this.normalize(p.engagement_consistency, ranges.engagementConsistency),
      recentEventActivity: this.normalize(p.recent_event_activity, ranges.recentEventActivity),
    }));
  }

  private normalizeCommunicationMetrics(players: EnhancedPlayer[], ranges: MetricRanges) {
    return players.map((p) => ({
      messageEngagement: this.normalize(p.message_engagement_ratio, ranges.messageEngagement),
      conversationParticipation: this.normalize(
        p.conversation_participation,
        ranges.conversationParticipation
      ),
      messageLengthAvg: this.normalize(p.message_length_avg, ranges.messageLengthAvg),
      replyEngagementRate: this.normalize(p.reply_engagement_rate, ranges.replyEngagementRate),
    }));
  }

  private normalizeSpendingMetrics(players: EnhancedPlayer[], ranges: MetricRanges) {
    return players.map((p) => ({
      spendingEfficiency: this.normalize(p.spending_efficiency, ranges.spendingEfficiency),
      consumableUsageRate: this.normalize(p.consumable_usage_rate, ranges.consumableUsageRate),
      spendingFrequency: this.normalize(p.spending_frequency, ranges.spendingFrequency),
      investmentVsConsumption: this.normalize(
        p.investment_vs_consumption,
        ranges.investmentVsConsumption
      ),
    }));
  }

  /**
   * Calculate Level A score using traditional metrics
   */
  private calculateLevelAScore(
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

  private readonly LEVEL_B_SUB_WEIGHTS = {
    eventQuality: { variety: 0.3, highValue: 0.3, consistency: 0.2, recency: 0.2 },
    communication: { engagement: 0.3, participation: 0.3, length: 0.2, replyRate: 0.2 },
    spending: { efficiency: 0.4, usageRate: 0.2, frequency: 0.2, investment: 0.2 },
  };

  /**
   * Calculate Level B score using derived features
   */
  private calculateLevelBScore(
    normalized: NormalizedMetrics,
    weights: EnhancedBalanceMetrics
  ): number {
    const { eventQuality, communication, spending } = this.LEVEL_B_SUB_WEIGHTS;

    // Event quality component
    const eventQualityScore =
      (normalized.eventVariety * eventQuality.variety +
        normalized.highValueEvents * eventQuality.highValue +
        normalized.engagementConsistency * eventQuality.consistency +
        normalized.recentEventActivity * eventQuality.recency) *
      weights.event_quality_weight;

    // Communication component
    const communicationScore =
      (normalized.messageEngagement * communication.engagement +
        normalized.conversationParticipation * communication.participation +
        normalized.messageLengthAvg * communication.length +
        normalized.replyEngagementRate * communication.replyRate) *
      weights.communication_weight;

    // Spending behavior component
    const spendingScore =
      (normalized.spendingEfficiency * spending.efficiency +
        normalized.consumableUsageRate * spending.usageRate +
        normalized.spendingFrequency * spending.frequency +
        normalized.investmentVsConsumption * spending.investment) *
      weights.spending_behavior_weight;

    return eventQualityScore + communicationScore + spendingScore;
  }

  /**
   * Analyze the contribution of Level A vs Level B scores
   */
  analyzeLevelContributions(players: EnhancedPlayerWithScore[]): {
    level_a_stats: { mean: number; std: number; min: number; max: number };
    level_b_stats: { mean: number; std: number; min: number; max: number };
    correlation: number;
    level_b_impact: number;
  } {
    const levelAScores = players.map((p) => p.level_a_score);
    const levelBScores = players.map((p) => p.level_b_score);
    const compositeScores = players.map((p) => p.composite_score);

    const calculateStats = (values: number[]) => ({
      mean: values.reduce((sum, v) => sum + v, 0) / values.length,
      std: Math.sqrt(
        values.reduce(
          (sum, v) => sum + Math.pow(v - values.reduce((s, vv) => s + vv, 0) / values.length, 2),
          0
        ) / values.length
      ),
      min: Math.min(...values),
      max: Math.max(...values),
    });

    // Calculate correlation between Level A and Level B scores
    const meanA = levelAScores.reduce((sum, v) => sum + v, 0) / levelAScores.length;
    const meanB = levelBScores.reduce((sum, v) => sum + v, 0) / levelBScores.length;

    const numerator = levelAScores.reduce(
      (sum, a, i) => sum + (a - meanA) * (levelBScores[i] - meanB),
      0
    );
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
    const rankChanges = levelAOnlyRanks.map((levelA) => {
      const compositeRank = compositeRanks.find((c) => c.index === levelA.index)!.rank;
      return Math.abs(levelA.rank - compositeRank);
    });

    const avgRankChange = rankChanges.reduce((sum, change) => sum + change, 0) / rankChanges.length;
    const levelBImpact = avgRankChange / players.length; // Normalized impact

    return {
      level_a_stats: calculateStats(levelAScores),
      level_b_stats: calculateStats(levelBScores),
      correlation,
      level_b_impact: levelBImpact,
    };
  }

  /**
   * Generate Level B feature importance report
   */
  generateLevelBReport(
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

interface MetricRanges {
  [key: string]: { min: number; max: number };
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
