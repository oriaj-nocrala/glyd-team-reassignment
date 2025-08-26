import { injectable } from 'tsyringe';
import { CLIOptions } from './types';
import { TeamAssignmentUseCase, TeamAssignmentRequest } from './usecases/teamAssignmentUseCase';
import { OutputGenerationUseCase, OutputGenerationRequest } from './usecases/outputGenerationUseCase';
import { validatePath } from './utils/path';

/**
 * Main application orchestrator - now follows Clean Architecture principles
 * Delegates business logic to use cases, handles only CLI concerns
 * Demonstrates proper separation: CLI -> Use Cases -> Business Logic
 * 
 * This refactoring shows:
 * - Clean separation of concerns
 * - Use case pattern implementation
 * - Minimal application layer (just CLI coordination)
 * - Easy to test and maintain
 */
@injectable()
export class Application {
  constructor(
    private readonly teamAssignmentUseCase: TeamAssignmentUseCase,
    private readonly outputGenerationUseCase: OutputGenerationUseCase
  ) {}

  public async run(options: CLIOptions): Promise<void> {
    const { teams, input, output, verbose } = options;

    // Validate paths early
    validatePath(input || 'data/level_a_players.csv');
    if (output) {
      validatePath(output, true);
    }

    if (verbose) {
      console.log(`🚀 Starting team reassignment for ${teams} teams`);
      console.log(`📊 Using ${options.levelB ? 'Level B (Advanced)' : 'Level A (Standard)'} analysis`);
      if (options.seed) {
        console.log(`🎲 Random seed: ${options.seed}`);
      }
      if (options.robustScores) {
        console.log(`🔧 Using robust scoring (log1p transform for heavy-tailed distributions)`);
      }
    }

    // Execute team assignment use case
    const teamAssignmentRequest = this.createTeamAssignmentRequest(options);
    const teamAssignmentResult = await this.teamAssignmentUseCase.execute(teamAssignmentRequest);

    // Execute output generation use case
    const outputRequest = this.createOutputGenerationRequest(teamAssignmentResult, options);
    this.outputGenerationUseCase.execute(outputRequest);
  }

  private createTeamAssignmentRequest(options: CLIOptions): TeamAssignmentRequest {
    return {
      inputPath: options.input || 'data/level_a_players.csv',
      teams: options.teams,
      seed: options.seed,
      optimize: options.optimize !== false, // Default to true unless explicitly disabled
      useRobustScores: options.robustScores || false,
      levelBOptions: {
        enabled: options.levelB || false,
        eventsFile: options.eventsFile,
        messagesFile: options.messagesFile,
        spendsFile: options.spendsFile,
      },
      verbose: options.verbose || false,
    };
  }

  private createOutputGenerationRequest(
    teamAssignmentResult: { assignment: any; levelBReport?: string },
    options: CLIOptions
  ): OutputGenerationRequest {
    return {
      result: teamAssignmentResult.assignment,
      options: {
        output: options.output,
        csv: options.csv || false,
        simple: options.simple || false,
        stats: options.stats || false,
        verbose: options.verbose || false,
        levelB: options.levelB || false,
      },
      levelBReport: teamAssignmentResult.levelBReport,
    };
  }
}