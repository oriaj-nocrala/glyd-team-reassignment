# Changes Log

## v1.1.0 - User-Centric Fairness & Robust Scoring

### New Features

#### User-Centric Fairness Statistics
- **Files touched**: `src/types.ts:153-164`, `src/output/statistics.ts:90-142`
- **Functions**: 
  - `StatisticsGenerator.calculateActivityStats()` (new method at `src/output/statistics.ts:347-378`)
  - `StatisticsGenerator.calculateFairnessStats()` (enhanced to include activity stats)
- **Description**: Added "% active players last 7 days" metric per team and overall, using `days_active_last_30 >= 7` as proxy for recent activity

#### Robust Scoring with Log1p Transform
- **Files touched**: `src/types.ts:185`, `src/index.ts:32`, `src/analysis/metrics.ts:14-24,29-58`, `src/assignment/shuffler.ts:20-38`, `src/application.ts:2,148-152`
- **Functions**:
  - `MetricsCalculator.calculatePlayerScores()` (added `useRobustScores` parameter)
  - `MetricsCalculator.normalizeMetrics()` (enhanced with log1p transform for heavy-tailed distributions)
  - `TeamShuffler.assignTeams()` (added `useRobustScores` parameter)
  - `Application.performTeamAssignment()` (passes robust scores flag)
- **Description**: `--robust-scores` flag applies `log1p()` transform to `historical_event_engagements` and `current_total_points` before normalization to handle heavy-tailed distributions

### Technical Details

- **Determinism preserved**: Same seed + same inputs + same flags → identical output
- **Type safety**: Strict TypeScript typing throughout, no `any` types used
- **Dependency injection**: Uses existing DI architecture with tsyringe
- **Custom error handling**: Integrates with existing error system
- **Security**: Uses existing path validation and security measures

### Backward Compatibility

All existing functionality remains unchanged. New features are opt-in via CLI flags.