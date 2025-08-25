export interface Player {
  player_id: number;
  historical_events_participated: number;
  historical_event_engagements: number;
  historical_points_earned: number;
  historical_points_spent: number;
  historical_messages_sent: number;
  current_total_points: number;
  days_active_last_30: number;
  current_streak_value: number;
  last_active_ts: string;
  current_team_id: number;
  current_team_name: string;
}

export interface PlayerWithScore extends Player {
  composite_score: number;
}

// CSV row interfaces for type safety
export interface PlayerCSVRow {
  player_id: string;
  historical_events_participated: string;
  historical_event_engagements: string;
  historical_points_earned: string;
  historical_points_spent: string;
  historical_messages_sent: string;
  current_total_points: string;
  days_active_last_30: string;
  current_streak_value: string;
  last_active_ts: string;
  current_team_id: string;
  current_team_name: string;
}

export interface EventCSVRow {
  id: string;
  player_id: string;
  ts: string;
  event_id: string;
  event_instance_id: string;
  engagement_kind: string;
  points_used: string;
}

export interface MessageCSVRow {
  id: string;
  player_id: string;
  ts: string;
  text_length: string;
  is_message_reply: string;
  message_reply_to_id?: string;
}

export interface SpendCSVRow {
  id: string;
  player_id: string;
  ts: string;
  item_id: string;
  item_category: string;
  points_spent: string;
  is_consumable: string;
  is_consumed: string;
  consumed_ts?: string;
}

// Level B raw data interfaces
export interface EventRecord {
  id: number;
  player_id: number;
  ts: number;
  event_id: number;
  event_instance_id: number;
  engagement_kind: string;
  points_used: number;
}

export interface MessageRecord {
  id: number;
  player_id: number;
  ts: number;
  text_length: number;
  is_message_reply: boolean;
  message_reply_to_id?: number;
}

export interface SpendRecord {
  id: number;
  player_id: number;
  ts: number;
  item_id: number;
  item_category: string;
  points_spent: number;
  is_consumable: boolean;
  is_consumed: boolean;
  consumed_ts?: number;
}

// Enhanced player data with Level B derived features
export interface EnhancedPlayer extends Player {
  // Event quality metrics
  event_variety_score: number;
  high_value_events_ratio: number;
  engagement_consistency: number;
  recent_event_activity: number;
  
  // Communication quality metrics
  message_engagement_ratio: number;
  conversation_participation: number;
  message_length_avg: number;
  reply_engagement_rate: number;
  
  // Spending behavior metrics
  spending_efficiency: number;
  consumable_usage_rate: number;
  spending_frequency: number;
  investment_vs_consumption: number;
}

export interface EnhancedPlayerWithScore extends EnhancedPlayer {
  composite_score: number;
  level_a_score: number;
  level_b_score: number;
}

export interface Team {
  team_id: number;
  players: PlayerWithScore[];
  total_score: number;
  average_score: number;
  size: number;
}

export interface AssignmentResult {
  teams: Team[];
  total_players: number;
  target_teams: number;
  seed?: number;
  fairness_stats: FairnessStats;
}

export interface FairnessStats {
  score_standard_deviation: number;
  score_range: {
    min: number;
    max: number;
  };
  size_balance: {
    min_size: number;
    max_size: number;
    size_difference: number;
  };
  justification: string;
}

export interface BalanceMetrics {
  engagement_weight: number;
  activity_weight: number;
  points_weight: number;
  streak_weight: number;
}

// Enhanced metrics for Level B
export interface EnhancedBalanceMetrics extends BalanceMetrics {
  event_quality_weight: number;
  communication_weight: number;
  spending_behavior_weight: number;
}

export interface CLIOptions {
  teams: number;
  seed?: number;
  input?: string;
  output?: string;
  levelB?: boolean;
  verbose?: boolean;
  stats?: boolean;
  csv?: boolean;
  simple?: boolean;
  optimize?: boolean;
  eventsFile?: string;
  messagesFile?: string;
  spendsFile?: string;
}