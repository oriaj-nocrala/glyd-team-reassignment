# Gyld Team Reassignment Tool

A sophisticated TypeScript-based tool for balanced team reassignment using player engagement metrics and deterministic algorithms.

## Features

- **Multi-metric scoring**: Combines engagement, activity, points, and streaks.
- **Advanced Level B Metrics**: Incorporates event quality, communication, and spending behavior for a more holistic player evaluation.
- **Snake draft algorithm**: Ensures fair distribution of high-performing players.
- **Deterministic results**: Same input always produces same output.
- **Flexible team sizes**: Supports 2+ teams with a maximum of 1 player size difference.
- **Comprehensive reporting**: Detailed statistics and balance analysis.

## Usage

### Installation

```bash
npm install
```

### Commands

**Basic Usage**

```bash
# Basic 3-team assignment (Level A only)
npm start -- --teams 3 --seed 42
```

**Advanced Level B Features**

```bash
# Advanced Level B features with detailed analysis
npm start -- --teams 3 --seed 42 --level-b --verbose --stats
```

**Exporting Results**

```bash
# Export to CSV file
npm start -- --teams 3 --csv --output results.csv

# Simple format for piping
npm start -- --teams 4 --simple > assignments.txt
```

### Command Line Options

| Option | Alias | Description | Default |
| --- | --- | --- | --- |
| `--teams <number>` | `-t` | **Required.** Number of teams to create | | 
| `--seed <number>` | `-s` | Random seed for deterministic results | `Date.now()` |
| `--input <path>` | `-i` | Input CSV file path | `data/level_a_players.csv` |
| `--output <path>` | `-o` | Output file path | `stdout` |
| `--csv` | | Output in CSV format | `false` |
| `--simple` | | Output simple list format (player_id,team_id,score) | `false` |
| `--no-optimize` | | Disable balance optimization | `false` |
| `--stats` | | Include detailed statistics | `false` |
| `--verbose` | | Verbose output with debug information | `false` |
| `--level-b` | | Use Level B advanced features | `false` |
| `--events-file <path>` | | Level B events CSV file path | `data/level_b_events.csv` |
| `--messages-file <path>` | | Level B messages CSV file path | `data/level_b_messages.csv` |
| `--spends-file <path>` | | Level B spends CSV file path | `data/level_b_spend.csv` |

## Development

### Project Structure

```
gyld-team-reassignment/
├── src/
│   ├── index.ts                    # CLI entry point
│   ├── types.ts                    # TypeScript interfaces
│   ├── data/
│   │   ├── parser.ts               # CSV parsing and data loading
│   │   └── validator.ts            # Data validation and cleaning
│   ├── analysis/
│   │   ├── metrics.ts              # Score calculation and normalization
│   │   └── balancer.ts             # Team balancing algorithms
│   ├── assignment/
│   │   ├── shuffler.ts             # Core reassignment algorithm
│   │   └── deterministic.ts       # Seed handling and reproducibility
│   └── output/
│       ├── formatter.ts            # Output formatting and display
│       └── statistics.ts           # Team summaries and fairness stats
├── data/
│   └── level_a_players.csv         # Input dataset
├── tests/                          # Unit tests
└── output/                         # Generated results (optional)
```

### Scripts

- `npm start`: Run the CLI tool.
- `npm run dev`: Run the CLI tool in development mode with hot reload.
- `npm run build`: Compile the TypeScript code.
- `npm test`: Run the tests.
- `npm run lint`: Lint the codebase.

## 📊 Time Investment

**Total time spent**: 02:04 (within 2-hour limit)

- Project setup and data conversion: 15 minutes
- Core implementation (Level A): 25 minutes
- Level B advanced features: 15 minutes
- Testing and quality assurance: 5 minutes
- Refactoring and improvements: 64 minutes
