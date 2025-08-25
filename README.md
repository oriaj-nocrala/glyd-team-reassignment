# Gyld Team Reassignment Tool

A sophisticated TypeScript-based tool for balanced team reassignment using player engagement metrics and deterministic algorithms.

## Features

- **Multi-metric scoring**: Combines engagement, activity, points, and streaks.
- **Advanced Level B Metrics**: Incorporates event quality, communication, and spending behavior for a more holistic player evaluation.
- **Excel & CSV Support**: Automatically processes both Excel (.xlsx) and CSV files without manual conversion.
- **Smart Directory Creation**: Automatically creates output directories as needed.
- **Snake draft algorithm**: Ensures fair distribution of high-performing players.
- **Deterministic results**: Same input always produces same output.
- **Flexible team sizes**: Supports 2+ teams with a maximum of 1 player size difference.
- **Enterprise Security**: Path traversal protection, rate limiting, input validation, and secure logging.
- **Dependency Injection**: Full DI architecture with comprehensive error handling.
- **Comprehensive reporting**: Detailed statistics and balance analysis.

## Usage

### Installation

```bash
npm install
```

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

### Supported File Formats

The tool automatically detects and processes:
- **CSV files** (.csv): Traditional comma-separated values
- **Excel files** (.xlsx): Microsoft Excel format (no conversion needed!)

Format detection is automatic based on file extension. Both formats support all features including Level A and Level B processing.

## Development

### Project Structure

```
gyld-team-reassignment/
├── src/
│   ├── index.ts                    # CLI entry point
│   ├── application.ts              # Main application with DI
│   ├── types.ts                    # TypeScript interfaces
│   ├── errors.ts                   # Custom error classes
│   ├── data/
│   │   ├── parser.ts               # CSV/Excel parsing and data loading
│   │   ├── validator.ts            # Data validation and cleaning
│   │   └── levelBParser.ts         # Level B raw data processing
│   ├── analysis/
│   │   ├── metrics.ts              # Score calculation and normalization
│   │   ├── enhancedMetrics.ts      # Level B composite scoring
│   │   └── featureEngineering.ts   # Advanced feature extraction
│   ├── assignment/
│   │   └── shuffler.ts             # Snake draft algorithm with optimization
│   ├── output/
│   │   ├── formatter.ts            # Output formatting and display
│   │   └── statistics.ts           # Team summaries and fairness stats
│   └── utils/
│       ├── security.ts             # Security validation and logging
│       ├── path.ts                 # Secure path handling
│       └── logger.ts               # Secure logging utilities
├── data/
│   ├── level_a_players.csv         # Level A input dataset (CSV)
│   ├── level_a_players.xlsx        # Level A input dataset (Excel)
│   ├── level_b_events.csv/.xlsx    # Level B events data
│   ├── level_b_messages.csv/.xlsx  # Level B messages data
│   └── level_b_spend.csv/.xlsx     # Level B spend data
├── tests/                          # Comprehensive unit tests (82 tests)
└── output/                         # Generated results (optional)
```

### Scripts

- `npm start`: Run the CLI tool.
- `npm run dev`: Run the CLI tool in development mode with hot reload.
- `npm run build`: Compile the TypeScript code.
- `npm test`: Run the tests.
- `npm run lint`: Lint the codebase.

### Testing

The project includes comprehensive test coverage:

```bash
# Run all tests (82 tests across 9 test suites)
npm test

# Run specific test suites
npm test -- tests/security.test.ts    # Security module tests
npm test -- tests/parser.test.ts      # File parsing tests
npm test -- tests/shuffler.test.ts    # Assignment algorithm tests
```

### Security Features

- **Path Traversal Protection**: Prevents access outside project directory
- **File Type Validation**: Only allows `.csv`, `.json`, and `.xlsx` files
- **Rate Limiting**: Prevents excessive file operations (10 per minute)
- **Input Sanitization**: Validates and sanitizes all file content
- **Secure Logging**: Prevents log injection attacks
- **Type Safety**: Full TypeScript strict mode compliance

## 📊 Time Investment

**Total time spent**: 03:04 (including enhancements)

- Project setup and data conversion: 15 minutes
- Core implementation (Level A): 25 minutes
- Level B advanced features: 15 minutes
- Testing and quality assurance: 5 minutes
- Refactoring and improvements: 64 minutes
- **Excel support and security enhancements**: 60 minutes
