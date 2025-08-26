# Gyld Team Reassignment Tool

A sophisticated TypeScript-based tool for balanced team reassignment using player engagement and activity metrics.

## Features

- **Multi-metric scoring**: Combines engagement, activity, points, and streaks.
- **Advanced Level B Metrics**: Incorporates event quality, communication, and spending behavior for a more holistic player evaluation.
- **Excel & CSV Support**: Automatically processes both Excel (.xlsx) and CSV files without manual conversion.
- **Smart Directory Creation**: Automatically creates output directories as needed.
- **Snake draft algorithm**: Ensures fair distribution of high-performing players.
- **Robust Scoring**: Optional log1p transform for heavy-tailed distributions to reduce outlier impact.
- **User-Centric Fairness**: Shows "% active players last 7 days" to build viewer trust in team balance.
- **Deterministic results**: Same input always produces same output.
- **Flexible team sizes**: Supports 2+ teams with a maximum of 1 player size difference.
- **Enterprise Security**: Path traversal protection, rate limiting, input validation, and secure logging.
- **Dependency Injection**: Full DI architecture with comprehensive error handling.
- **Comprehensive reporting**: Detailed statistics and balance analysis.

## Installation

```bash
npm install
```

## Usage

### Commands

**Basic Usage**

```bash
# Basic 3-team assignment with CSV (Level A only)
npm start -- --teams 3 --seed 42

# Use Excel files directly (no conversion needed!)
npm start -- --teams 4 --input "data/level_a_players.xlsx" --verbose
```

**Advanced Level B Features**

```bash
# Level B with CSV files
npm start -- --teams 3 --seed 42 --level-b --verbose --stats

# Level B with Excel files (automatic format detection)
npm start -- --teams 3 --level-b --verbose \
  --input "data/level_a_players.xlsx" \
  --events-file "data/level_b_events.xlsx" \
  --messages-file "data/level_b_messages.xlsx" \
  --spends-file "data/level_b_spend.xlsx"
```

**Robust Scoring & Advanced Features**

```bash
# Use robust scoring for heavy-tailed distributions (messages, points)
npm start -- --teams 3 --robust-scores --seed 42

# Combined with Level B features
npm start -- --teams 4 --level-b --robust-scores --verbose
```

**Exporting Results**

```bash
# Export to CSV (creates directories automatically)
npm start -- --teams 3 --csv --output "reports/2025/january/teams.csv"

# Mixed formats - Excel input, CSV output
npm start -- --teams 4 --input "players.xlsx" --output "results/assignments.csv" --csv

# Simple format for piping
npm start -- --teams 4 --simple > assignments.txt
```

### Command Line Options

| Option | Alias | Description | Default |
| --- | --- | --- | --- |
| `--teams <number>` | `-t` | **Required.** Number of teams to create | | 
| `--seed <number>` | `-s` | Random seed for deterministic results | `Date.now()` |
| `--input <path>` | `-i` | Input file path (.csv or .xlsx) | `data/level_a_players.csv` |
| `--output <path>` | `-o` | Output file path (auto-creates directories) | `stdout` |
| `--csv` | | Output in CSV format | `false` |
| `--simple` | | Output simple list format (player_id,team_id,score) | `false` |
| `--no-optimize` | | Disable balance optimization | `false` |
| `--stats` | | Include detailed statistics | `false` |
| `--verbose` | | Verbose output with debug information | `false` |
| `--level-b` | | Use Level B advanced features | `false` |
| `--events-file <path>` | | Level B events file (.csv or .xlsx) | `data/level_b_events.csv` |
| `--messages-file <path>` | | Level B messages file (.csv or .xlsx) | `data/level_b_messages.csv` |
| `--spends-file <path>` | | Level B spends file (.csv or .xlsx) | `data/level_b_spend.csv` |
| `--robust-scores` | | Apply log1p transform to heavy-tailed distributions | `false` |

### Supported File Formats

The tool automatically detects and processes:
- **CSV files** (.csv): Traditional comma-separated values
- **Excel files** (.xlsx): Microsoft Excel format (no conversion needed!)

Format detection is automatic based on file extension. Both formats support all features including Level A and Level B processing.

### Algorithm Details

**Team Assignment Logic**: Players are sorted by composite score (descending), then by player_id (ascending) for deterministic tie-breaking; snake draft algorithm assigns teams alternating between forward and reverse order to ensure balanced distribution.

**Activity Trust Metric**: The "% active players last 7 days" statistic builds viewer trust during live streams by showing that teams contain engaged, recently-active players rather than inactive accounts. This transparency helps streamers demonstrate fairness and maintains audience confidence in team balance.

**Robust Scoring**: Use `--robust-scores` when your dataset has heavy-tailed distributions (few players with very high message counts or points). The log1p transform reduces the influence of extreme outliers while preserving determinism and improving balance for typical gaming communities. Trade-off: slightly reduced impact of legitimately exceptional players.

## Development

### Project Structure

```
gyld-team-reassignment/
├── src/
│   ├── index.ts                    # CLI entry point
│   ├── application.ts              # Main application with DI
│   ├── types.ts                    # TypeScript interfaces
│   ├── errors.ts                   # Custom error classes
│   ├── usecases/                   # Clean Architecture use cases
│   │   ├── teamAssignmentUseCase.ts # Team assignment workflow
│   │   └── outputGenerationUseCase.ts # Output generation workflow
│   ├── data/
│   │   ├── parser.ts               # CSV/Excel parsing and data loading
│   │   ├── validator.ts            # Data validation and cleaning
│   │   ├── levelBDataOrchestrator.ts # Level B data coordination
│   │   └── parsers/                # Specialized parsers
│   │       ├── eventParser.ts      # Event data parsing
│   │       ├── messageParser.ts    # Message data parsing
│   │       └── spendParser.ts      # Spend data parsing
│   ├── analysis/
│   │   ├── metrics.ts              # Score calculation and normalization
│   │   ├── enhancedMetrics.ts      # Level B composite scoring
│   │   ├── featureEngineering.ts   # Advanced feature extraction
│   │   ├── teamAnalyzer.ts         # Team-specific analysis
│   │   ├── activityAnalyzer.ts     # Player activity analysis
│   │   ├── balanceAnalyzer.ts      # Team balance and fairness
│   │   └── distributionAnalyzer.ts # Score distributions and movements
│   ├── assignment/
│   │   └── shuffler.ts             # Snake draft algorithm with optimization
│   ├── output/
│   │   ├── formatter.ts            # Output formatting and display
│   │   └── statisticsOrchestrator.ts # Statistics coordination
│   └── utils/
│       ├── securitySimplified.ts   # Security validation and logging
│       ├── path.ts                 # Secure path handling
│       └── logger.ts               # Secure logging utilities
├── data/
│   ├── level_a_players.csv         # Level A input dataset (CSV)
│   ├── level_a_players.xlsx        # Level A input dataset (Excel)
│   ├── level_b_events.csv/.xlsx    # Level B events data
│   ├── level_b_messages.csv/.xlsx  # Level B messages data
│   └── level_b_spend.csv/.xlsx     # Level B spend data
├── tests/                          # Comprehensive unit tests (103 tests)
└── output/                         # Generated results (optional)
```

### Scripts

- `npm start`: Start the CLI tool.
- `npm test`: Run the tests.
- `npm run lint`: Lint the codebase.

### Testing

The project includes comprehensive test coverage:

```bash
# Run all tests (103 tests across 12 test suites)
npm test

# Run specific test suites
npm test -- tests/security.test.ts    # Security module tests
npm test -- tests/parser.test.ts      # File parsing tests
npm test -- tests/shuffler.test.ts    # Assignment algorithm tests
npm test -- tests/robustScores.test.ts # Robust scoring tests
```

### Security Features

- **Path Traversal Protection**: Prevents access outside project directory
- **File Type Validation**: Only allows `.csv`, `.json`, and `.xlsx` files
- **Input Sanitization**: Validates and sanitizes all file content
- **Secure Logging**: Prevents log injection attacks
- **Type Safety**: Full TypeScript strict mode compliance

### Architecture Highlights

- **Clean Architecture**: Use cases, orchestrators, and specialized analyzers
- **Dependency Injection**: Full DI with tsyringe for testability
- **Single Responsibility**: Each class has one focused responsibility
- **SOLID Principles**: Applied consistently throughout the codebase
- **Type Safety**: No `any` types, strict TypeScript configuration

## 📊 Time Investment

**Total time spent**: 03:29 (including enhancements)

- Project setup and data conversion: 15 minutes
- Core implementation (Level A): 25 minutes
- Level B advanced features: 15 minutes
- Testing and quality assurance: 5 minutes
- Refactoring and improvements: 64 minutes
- **Excel support and security enhancements**: 60 minutes
- **Architecture refactoring and code quality improvements**: 60 minutes
- **Cole's assignment features (user fairness + robust scores)**: 25 minutes

## Notes

**Activity Estimation**: The "% active players last 7 days" metric uses `days_active_last_30 >= 7` as a proxy for recent activity, since direct 7-day activity data is not available in the current dataset.

**Robust Scoring**: The `--robust-scores` flag applies `log1p()` transformation to `historical_event_engagements` and `current_total_points` before normalization. This reduces the impact of extreme outliers while maintaining deterministic results.