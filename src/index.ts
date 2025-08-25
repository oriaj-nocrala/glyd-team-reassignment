#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { DataParser } from './data/parser';
import { DataValidator } from './data/validator';
import { LevelBDataParser } from './data/levelBParser';
import { FeatureEngineering } from './analysis/featureEngineering';
import { EnhancedMetricsCalculator } from './analysis/enhancedMetrics';
import { TeamShuffler } from './assignment/shuffler';
import { OutputFormatter } from './output/formatter';
import { StatisticsGenerator } from './output/statistics';
import { Player, CLIOptions } from './types';

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
    await processTeamAssignment(options);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
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

/**
 * Main processing function
 */
async function processTeamAssignment(options: any): Promise<void> {
  const { teams, seed, input, output, csv, simple, optimize, stats, verbose, levelB } = options;

  // Validate input file
  const inputPath = path.resolve(input);
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  if (verbose) {
    console.log(`📂 Reading player data from: ${inputPath}`);
    console.log(`🎯 Target teams: ${teams}`);
    if (seed) console.log(`🎲 Using seed: ${seed}`);
    if (levelB) console.log(`🚀 Using Level B advanced features`);
  }

  // Parse player data
  const players = await DataParser.parsePlayersFromCSV(inputPath);
  
  if (verbose) {
    console.log(`👥 Loaded ${players.length} players`);
  }

  // Validate and clean data
  const { valid, invalid } = DataParser.validatePlayers(players);
  
  if (invalid.length > 0) {
    console.warn(`⚠️  Warning: ${invalid.length} invalid players excluded`);
    if (verbose) {
      invalid.forEach((player: any) => {
        console.warn(`   - Player ${player.player_id}: missing or invalid data`);
      });
    }
  }

  if (valid.length === 0) {
    throw new Error('No valid players found in dataset');
  }

  // Clean the data
  const cleanedPlayers = DataValidator.cleanPlayerData(valid);

  // Validate team constraints
  const constraintValidation = DataValidator.validateTeamConstraints(cleanedPlayers.length, teams);
  if (!constraintValidation.isValid) {
    throw new Error(constraintValidation.message);
  }

  // Show data summary if verbose
  if (verbose) {
    const summary = DataParser.getDataSummary(cleanedPlayers);
    console.log('\n📊 Data Summary:');
    console.log(`   • Total players: ${summary.total_players}`);
    console.log(`   • Engagement range: ${summary.engagement_range.min}-${summary.engagement_range.max} (avg: ${summary.engagement_range.avg.toFixed(1)})`);
    console.log(`   • Activity range: ${summary.activity_range.min}-${summary.activity_range.max} (avg: ${summary.activity_range.avg.toFixed(1)})`);
    console.log(`   • Points range: ${summary.points_range.min}-${summary.points_range.max} (avg: ${summary.points_range.avg.toFixed(0)})`);
    console.log(`   • Current teams: ${Array.from(summary.current_teams).join(', ')}`);
  }

  // Enhance players with Level B features if requested
  let finalPlayers: Player[] = cleanedPlayers;
  let levelBReport = '';
  
  if (levelB) {
    try {
      const levelBData = await LevelBDataParser.parseAllLevelBData({
        events: options.eventsFile,
        messages: options.messagesFile,
        spends: options.spendsFile
      });
      
      if (verbose) {
        const summary = LevelBDataParser.getLevelBSummary(
          levelBData.events,
          levelBData.messages,
          levelBData.spends
        );
        console.log(`\n🔬 Level B Data Analysis:`);
        console.log(`   • Event types: ${Array.from(summary.events_summary.engagement_types).join(', ')}`);
        console.log(`   • Spend categories: ${Array.from(summary.spends_summary.categories).join(', ')}`);
        console.log(`   • Reply rate: ${(summary.messages_summary.reply_rate * 100).toFixed(1)}%`);
      }

      // Feature engineering
      const enhancedPlayers = FeatureEngineering.enhancePlayersWithLevelB(
        cleanedPlayers,
        levelBData.events,
        levelBData.messages,
        levelBData.spends
      );

      // Calculate enhanced scores
      const playersWithEnhancedScores = EnhancedMetricsCalculator.calculateEnhancedPlayerScores(enhancedPlayers);
      
      // Convert to standard format for shuffler (maintaining composite_score)
      finalPlayers = playersWithEnhancedScores.map(player => ({
        ...player,
        composite_score: player.composite_score
      }));

      // Generate Level B analysis report
      levelBReport = EnhancedMetricsCalculator.generateLevelBReport(playersWithEnhancedScores);
      
    } catch (error) {
      console.warn(`⚠️  Warning: Could not load Level B data: ${error}`);
      console.warn(`   Falling back to Level A scoring only`);
    }
  }

  // Create team assignments
  const shuffler = new TeamShuffler(seed);
  const result = await shuffler.assignTeams(finalPlayers, teams, optimize);

  // Generate output
  let outputContent: string;

  if (csv) {
    outputContent = OutputFormatter.formatCSV(result);
  } else if (simple) {
    outputContent = OutputFormatter.formatSimpleList(result);
  } else {
    outputContent = stats 
      ? OutputFormatter.formatComplete(result)
      : OutputFormatter.formatTeamAssignments(result);
  }

  // Write to file or stdout
  if (output) {
    const outputPath = path.resolve(output);
    fs.writeFileSync(outputPath, outputContent, 'utf8');
    console.log(`✅ Results written to: ${outputPath}`);
  } else {
    console.log(outputContent);
  }

  // Show additional statistics if requested
  if (stats && !simple && !csv) {
    const movementAnalysis = StatisticsGenerator.analyzePlayerMovement(result);
    const scoreDistribution = StatisticsGenerator.analyzeScoreDistribution(result);
    
    console.log('\n📈 Additional Statistics:');
    console.log(`   • Player movements: ${movementAnalysis.total_moves} (${movementAnalysis.movement_rate.toFixed(1)}%)`);
    console.log(`   • Score distribution: μ=${scoreDistribution.overall_stats.mean.toFixed(3)}, σ=${scoreDistribution.overall_stats.std_dev.toFixed(4)}`);
    console.log(`   • Score range: ${scoreDistribution.overall_stats.min.toFixed(3)} - ${scoreDistribution.overall_stats.max.toFixed(3)}`);

    if (verbose && movementAnalysis.moves_by_team.length > 0) {
      console.log('\n🔄 Team Movement Details:');
      movementAnalysis.moves_by_team.slice(0, 5).forEach(move => {
        console.log(`   • ${move.from_team} → Team ${move.to_team}: ${move.count} players`);
      });
    }

    // Show Level B analysis if used
    if (levelB && levelBReport) {
      console.log(levelBReport);
    }
  }

  // Final success message
  if (verbose) {
    console.log(`\n✅ Assignment completed successfully!`);
    console.log(`   • Balance quality: ${result.fairness_stats.score_standard_deviation < 0.1 ? 'Good' : 'Fair'}`);
    console.log(`   • Team size difference: ${result.fairness_stats.size_balance.size_difference}`);
    console.log(`   • Deterministic: ${result.seed ? 'Yes' : 'No'} (seed: ${result.seed})`);
  }
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

export { processTeamAssignment };