import { injectable } from 'tsyringe';
import { Player, AssignmentResult } from '../types';
import { DataParser } from '../data/parser';
import { DataValidator } from '../data/validator';
import { LevelBDataOrchestrator } from '../data/levelBDataOrchestrator';
import { FeatureEngineering } from '../analysis/featureEngineering';
import { EnhancedMetricsCalculator } from '../analysis/enhancedMetrics';
import { TeamShuffler } from '../assignment/shuffler';
import { InvalidPlayerError } from '../errors';

export interface TeamAssignmentRequest {
  inputPath: string;
  teams: number;
  seed?: number;
  optimize: boolean;
  useRobustScores: boolean;
  levelBOptions?: {
    enabled: boolean;
    eventsFile?: string;
    messagesFile?: string;
    spendsFile?: string;
  };
  verbose: boolean;
}

export interface TeamAssignmentResult {
  assignment: AssignmentResult;
  levelBReport?: string;
}

/**
 * Use case for team assignment workflow
 * Orchestrates the complete flow from data loading to team assignment
 * Follows Clean Architecture principles - business logic without infrastructure concerns
 */
@injectable()
export class TeamAssignmentUseCase {
  constructor(
    private readonly dataParser: DataParser,
    private readonly dataValidator: DataValidator,
    private readonly levelBDataOrchestrator: LevelBDataOrchestrator,
    private readonly featureEngineering: FeatureEngineering,
    private readonly enhancedMetricsCalculator: EnhancedMetricsCalculator
  ) {}

  /**
   * Execute the complete team assignment workflow
   */
  async execute(request: TeamAssignmentRequest): Promise<TeamAssignmentResult> {
    // Load and validate player data
    const players = await this.loadAndValidatePlayerData(request.inputPath, request.verbose);

    // Enhance with Level B data if requested
    const { finalPlayers, levelBReport } = await this.enhanceWithLevelBData(players, request);

    // Create team assignments
    const assignment = await this.performTeamAssignment(finalPlayers, request);

    return {
      assignment,
      levelBReport,
    };
  }

  private async loadAndValidatePlayerData(inputPath: string, verbose: boolean): Promise<Player[]> {
    if (verbose) {
      console.log(`📂 Reading player data from: ${inputPath}`);
    }

    const players = await this.dataParser.parsePlayersFromFile(inputPath);

    if (verbose) {
      console.log(`👥 Loaded ${players.length} players`);
    }

    const { valid, invalid } = this.dataParser.validatePlayers(players);

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
    request: TeamAssignmentRequest
  ): Promise<{ finalPlayers: Player[]; levelBReport?: string }> {
    let finalPlayers: Player[] = players;
    let levelBReport: string | undefined;

    if (request.levelBOptions?.enabled) {
      try {
        const levelBData = await this.levelBDataOrchestrator.parseAllLevelBData({
          events: request.levelBOptions.eventsFile,
          messages: request.levelBOptions.messagesFile,
          spends: request.levelBOptions.spendsFile,
        });

        if (request.verbose) {
          const summary = this.levelBDataOrchestrator.getLevelBSummary(
            levelBData.events,
            levelBData.messages,
            levelBData.spends
          );
          console.log('\n🔬 Level B Data Analysis:');
          console.log(
            `   • Event types: ${Array.from(summary.events_summary.engagement_types).join(', ')}`
          );
          console.log(
            `   • Spend categories: ${Array.from(summary.spends_summary.categories).join(', ')}`
          );
          console.log(`   • Message reply rate: ${summary.messages_summary.reply_rate}%`);
        }

        // Feature engineering from raw Level B data
        const enhancedPlayers = this.featureEngineering.enhancePlayersWithLevelB(
          finalPlayers,
          levelBData.events,
          levelBData.messages,
          levelBData.spends
        );

        finalPlayers = this.enhancedMetricsCalculator.calculateEnhancedPlayerScores(
          enhancedPlayers
        );

        levelBReport = '\n📊 Level B Enhancement Applied:';
        levelBReport += '\n   • Enhanced scoring with event quality, communication, and spending behavior';
        levelBReport += `\n   • Advanced metrics calculated for ${enhancedPlayers.length} players`;

      } catch (error) {
        console.warn(`⚠️  Warning: Could not load Level B data: ${error}`);
        console.warn('   Falling back to Level A scoring only');
      }
    }

    return { finalPlayers, levelBReport };
  }

  private async performTeamAssignment(players: Player[], request: TeamAssignmentRequest): Promise<AssignmentResult> {
    const shuffler = new TeamShuffler(request.seed);
    return await shuffler.assignTeams(players, request.teams, request.optimize, request.useRobustScores);
  }
}