import { injectable } from 'tsyringe';
import { CLIOptions, Player } from './types';
import { DataParser } from './data/parser';
import { DataValidator } from './data/validator';
import { LevelBDataParser } from './data/levelBParser';
import { FeatureEngineering } from './analysis/featureEngineering';
import { EnhancedMetricsCalculator } from './analysis/enhancedMetrics';
import { TeamShuffler } from './assignment/shuffler';
import { OutputFormatter } from './output/formatter';
import { StatisticsGenerator } from './output/statistics';
import { validatePath } from './utils/path';
import { InvalidPlayerError } from './errors';
import * as path from 'path';
import * as fs from 'fs';

@injectable()
export class Application {
  constructor(
    private readonly dataParser: DataParser,
    private readonly dataValidator: DataValidator,
    private readonly levelBDataParser: LevelBDataParser,
    private readonly featureEngineering: FeatureEngineering,
    private readonly enhancedMetricsCalculator: EnhancedMetricsCalculator,
    private readonly teamShuffler: TeamShuffler,
    private readonly outputFormatter: OutputFormatter,
    private readonly statisticsGenerator: StatisticsGenerator
  ) {}

  public async run(options: CLIOptions): Promise<void> {
    const { teams, input, output, verbose } = options;

    // Validate input and output paths
    const inputPath = validatePath(input);
    if (output) {
      validatePath(output, true);
    }

    const cleanedPlayers = await this.loadAndValidatePlayerData(inputPath, verbose);

    // Validate team constraints
    this.dataValidator.validateTeamConstraints(cleanedPlayers.length, teams);

    // Show data summary if verbose
    if (verbose) {
      const summary = this.dataParser.getDataSummary(cleanedPlayers);
      console.log('
📊 Data Summary:');
      console.log(`   • Total players: ${summary.total_players}`);
      console.log(
        `   • Engagement range: ${summary.engagement_range.min}-${summary.engagement_range.max} (avg: ${summary.engagement_range.avg.toFixed(1)})`
      );
      console.log(
        `   • Activity range: ${summary.activity_range.min}-${summary.activity_range.max} (avg: ${summary.activity_range.avg.toFixed(1)})`
      );
      console.log(
        `   • Points range: ${summary.points_range.min}-${summary.points_range.max} (avg: ${summary.points_range.avg.toFixed(0)})`
      );
      console.log(`   • Current teams: ${Array.from(summary.current_teams).join(', ')}`);
    }

    const { finalPlayers, levelBReport } = await this.enhanceWithLevelBData(cleanedPlayers, options);

    // Create team assignments
    const result = await this.performTeamAssignment(finalPlayers, options);

    // Generate output
    this.generateAndWriteOutput(result, options, levelBReport);
  }

  private async loadAndValidatePlayerData(inputPath: string, verbose: boolean): Promise<Player[]> {
    if (verbose) {
      console.log(`📂 Reading player data from: ${inputPath}`);
    }

    const players = await this.dataParser.parsePlayersFromCSV(inputPath);

    if (verbose) {
      console.log(`👥 Loaded ${players.length} players`);
    }

    const { valid, invalid } = this.dataValidator.validatePlayers(players);

    if (invalid.length > 0) {
      throw new InvalidPlayerError(`${invalid.length} invalid players excluded`, invalid);
    }

    if (valid.length === 0) {
      throw new Error('No valid players found in dataset');
    }

    return this.dataValidator.cleanPlayerData(valid);
  }

  private async enhanceWithLevelBData(
    players: Player[],
    options: CLIOptions
  ): Promise<{ finalPlayers: Player[]; levelBReport: string }> {
    const { verbose, levelB, eventsFile, messagesFile, spendsFile } = options;
    let finalPlayers: Player[] = players;
    let levelBReport = '';

    if (levelB) {
      try {
        const levelBData = await this.levelBDataParser.parseAllLevelBData({
          events: eventsFile,
          messages: messagesFile,
          spends: spendsFile,
        });

        if (verbose) {
          const summary = this.levelBDataParser.getLevelBSummary(
            levelBData.events,
            levelBData.messages,
            levelBData.spends
          );
          console.log(`
🔬 Level B Data Analysis:`);
          console.log(
            `   • Event types: ${Array.from(summary.events_summary.engagement_types).join(', ')}`
          );
          console.log(
            `   • Spend categories: ${Array.from(summary.spends_summary.categories).join(', ')}`
          );
          console.log(`   • Reply rate: ${(summary.messages_summary.reply_rate * 100).toFixed(1)}%`);
        }

        const enhancedPlayers = this.featureEngineering.enhancePlayersWithLevelB(
          players,
          levelBData.events,
          levelBData.messages,
          levelBData.spends
        );

        const playersWithEnhancedScores =
          this.enhancedMetricsCalculator.calculateEnhancedPlayerScores(enhancedPlayers);

        finalPlayers = playersWithEnhancedScores.map((player) => ({
          ...player,
          composite_score: player.composite_score,
        }));

        levelBReport = this.enhancedMetricsCalculator.generateLevelBReport(playersWithEnhancedScores);
      } catch (error) {
        console.warn(`⚠️  Warning: Could not load Level B data: ${error}`);
        console.warn(`   Falling back to Level A scoring only`);
      }
    }

    return { finalPlayers, levelBReport };
  }

  private async performTeamAssignment(players: Player[], options: CLIOptions): Promise<any> {
    const { teams, seed, optimize } = options;
    const shuffler = new TeamShuffler(seed);
    return await shuffler.assignTeams(players, teams, optimize);
  }

  private generateAndWriteOutput(result: any, options: CLIOptions, levelBReport: string): void {
    const { output, csv, simple, stats, verbose, levelB } = options;
    let outputContent: string;

    if (csv) {
      outputContent = this.outputFormatter.formatCSV(result);
    } else if (simple) {
      outputContent = this.outputFormatter.formatSimpleList(result);
    } else {
      outputContent = stats
        ? this.outputFormatter.formatComplete(result)
        : this.outputFormatter.formatTeamAssignments(result);
    }

    if (output) {
      const outputPath = path.resolve(output);
      fs.writeFileSync(outputPath, outputContent, 'utf8');
      console.log(`✅ Results written to: ${outputPath}`);
    } else {
      console.log(outputContent);
    }

    if (stats && !simple && !csv) {
      const movementAnalysis = this.statisticsGenerator.analyzePlayerMovement(result);
      const scoreDistribution = this.statisticsGenerator.analyzeScoreDistribution(result);

      console.log('
📈 Additional Statistics:');
      console.log(
        `   • Player movements: ${movementAnalysis.total_moves} (${movementAnalysis.movement_rate.toFixed(1)}%)`
      );
      console.log(
        `   • Score distribution: μ=${scoreDistribution.overall_stats.mean.toFixed(3)}, σ=${scoreDistribution.overall_stats.std_dev.toFixed(4)}`
      );
      console.log(
        `   • Score range: ${scoreDistribution.overall_stats.min.toFixed(3)} - ${scoreDistribution.overall_stats.max.toFixed(3)}`
      );

      if (verbose && movementAnalysis.moves_by_team.length > 0) {
        console.log('
🔄 Team Movement Details:');
        movementAnalysis.moves_by_team.slice(0, 5).forEach((move) => {
          console.log(`   • ${move.from_team} → Team ${move.to_team}: ${move.count} players`);
        });
      }

      if (levelB && levelBReport) {
        console.log(levelBReport);
      }
    }

    if (verbose) {
      console.log(`
✅ Assignment completed successfully!`);
      console.log(
        `   • Balance quality: ${result.fairness_stats.score_standard_deviation < 0.1 ? 'Good' : 'Fair'}`
      );
      console.log(`   • Team size difference: ${result.fairness_stats.size_balance.size_difference}`);
      console.log(`   • Deterministic: ${result.seed ? 'Yes' : 'No'} (seed: ${result.seed})`);
    }
  }
}

