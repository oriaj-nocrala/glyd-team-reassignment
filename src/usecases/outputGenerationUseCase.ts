import { injectable } from 'tsyringe';
import { AssignmentResult } from '../types';
import { OutputFormatter } from '../output/formatter';
import { StatisticsOrchestrator } from '../output/statisticsOrchestrator';
import { validatePath } from '../utils/path';
import * as path from 'path';
import * as fs from 'fs';

export interface OutputGenerationRequest {
  result: AssignmentResult;
  options: {
    output?: string;
    csv: boolean;
    simple: boolean;
    stats: boolean;
    verbose: boolean;
    levelB: boolean;
  };
  levelBReport?: string;
}

/**
 * Use case for output generation workflow
 * Handles all output formatting and file writing concerns
 * Follows Single Responsibility Principle - only handles output generation
 */
@injectable()
export class OutputGenerationUseCase {
  constructor(
    private readonly outputFormatter: OutputFormatter,
    private readonly statisticsOrchestrator: StatisticsOrchestrator
  ) {}

  /**
   * Generate and write output based on user preferences
   */
  execute(request: OutputGenerationRequest): void {
    const outputContent = this.generateOutputContent(request);
    this.writeOutput(outputContent, request.options);
    
    if (request.options.verbose && request.levelBReport) {
      console.log(request.levelBReport);
    }
  }

  private generateOutputContent(request: OutputGenerationRequest): string {
    const { result, options } = request;

    if (options.csv) {
      return this.outputFormatter.formatCSV(result);
    }

    if (options.simple) {
      return this.outputFormatter.formatSimpleList(result);
    }

    if (options.stats) {
      return this.generateDetailedOutput(result);
    }

    return this.outputFormatter.formatTeamAssignments(result);
  }

  private generateDetailedOutput(result: AssignmentResult): string {
    // Generate comprehensive statistical analysis
    const comprehensiveReport = this.statisticsOrchestrator.generateComprehensiveReport(result);
    
    // Format the detailed output with all statistics
    return this.outputFormatter.formatCompleteWithStats(result, comprehensiveReport);
  }

  private writeOutput(content: string, options: OutputGenerationRequest['options']): void {
    if (options.output) {
      this.writeToFile(content, options.output);
    } else {
      console.log(content);
    }
  }

  private writeToFile(content: string, outputPath: string): void {
    const resolvedPath = path.resolve(outputPath);
    
    // Validate path security
    validatePath(resolvedPath, true);
    
    // Create directory if it doesn't exist
    const outputDir = path.dirname(resolvedPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(resolvedPath, content, 'utf8');
    console.log(`✅ Results written to: ${resolvedPath}`);
  }
}