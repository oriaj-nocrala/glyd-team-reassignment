# FIXES.md - Operator Notes

## Changes for User-Centric Fairness Stat

**Feature**: Added "% of assigned players active in the last 7 days" per team and overall

**Files/Functions Modified:**
- `src/types.ts:153-164` - Added `activity_stats` to `FairnessStats` interface
- `src/analysis/activityAnalyzer.ts:22-45` - `ActivityAnalyzer.calculateActivityStats()` (new method)
- `src/output/statistics.ts:347-378` - Integration point for activity statistics
- `src/analysis/balancer.ts:103-118` - Updated `calculateFairness()` to include activity stats

## Changes for Robust Scores Flag

**Feature**: Added `--robust-scores` flag with log1p transform for heavy-tailed distributions

**Files/Functions Modified:**
- `src/types.ts:185` - Added `robustScores?: boolean` to `CLIOptions` interface
- `src/index.ts:32` - Added CLI flag `--robust-scores`
- `src/analysis/metrics.ts:14-24` - `MetricsCalculator.calculatePlayerScores()` added `useRobustScores` parameter
- `src/analysis/metrics.ts:38-58` - `MetricsCalculator.normalizeMetrics()` enhanced with log1p transform
- `src/assignment/shuffler.ts:20-38` - `TeamShuffler.assignTeams()` passes robust scores flag
- `src/application.ts:148-152` - `Application.performTeamAssignment()` handles robust scores option

**Log1p Transform Applied To:**
- `historical_event_engagements` (heavy-tailed: few players with very high engagement)
- `current_total_points` (heavy-tailed: few players with very high points)

## Testing

**Test Coverage:**
- `tests/robustScores.test.ts` - Comprehensive test suite for `--robust-scores` functionality
- 5 test cases covering determinism, outlier reduction, edge cases, and ranking consistency