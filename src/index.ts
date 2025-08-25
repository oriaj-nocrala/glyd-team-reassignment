#!/usr/bin/env node

import container from './container';
import { IApplication } from './application';
import { CLIOptions } from './types';

const program = new Command();

async function main() {
  program
    .name('gyld-team-reassignment')
    .description('Balance team reassignment tool for player distribution')
    .version('1.0.0');

  program
    .requiredOption('-t, --teams <number>', 'number of teams to create', parseIntParameter)
    .option('-s, --seed <number>', 'random seed for deterministic results', parseIntParameter)
    .option('-i, --input <path>', 'input CSV file path', 'data/level_a_players.csv')
    .option('-o, --output <path>', 'output file path (optional)')
    .option('--csv', 'output in CSV format')
    .option('--simple', 'output simple list format (player_id,team_id,score)')
    .option('--no-optimize', 'disable balance optimization')
    .option('--stats', 'include detailed statistics')
    .option('--verbose', 'verbose output with debug information')
    .option('--level-b', 'use Level B advanced features from raw event/message/spend data')
    .option('--events-file <path>', 'Level B events CSV file path', 'data/level_b_events.csv')
    .option('--messages-file <path>', 'Level B messages CSV file path', 'data/level_b_messages.csv')
    .option('--spends-file <path>', 'Level B spends CSV file path', 'data/level_b_spend.csv')
    .parse();

  const options: CLIOptions = program.opts();

  try {
    const app = container.resolve<IApplication>('IApplication');
    await app.run(options);
  } catch (error) {
    if (error instanceof InvalidCsvError) {
      console.error(`❌ Error parsing CSV: ${error.message}`);
      console.error('Invalid rows:', error.invalidRows);
    } else if (error instanceof InvalidPlayerError) {
      console.error(`❌ Error validating players: ${error.message}`);
      console.error('Invalid players:', error.invalidPlayers);
    } else if (error instanceof InvalidTeamConstraintsError) {
      console.error(`❌ Error with team constraints: ${error.message}`);
    } else {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}

/**
 * Parse integer parameter with validation
 */
function parseIntParameter(value: string): number {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid number: ${value}`);
  }
  return parsed;
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message);
  if (program.opts().verbose) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
  process.exit(1);
});

// Run the CLI
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
