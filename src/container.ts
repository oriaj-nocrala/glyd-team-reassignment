import 'reflect-metadata';
import { container } from 'tsyringe';
import { Application } from './application';
import { DataParser } from './data/parser';
import { DataValidator } from './data/validator';
import { LevelBDataOrchestrator } from './data/levelBDataOrchestrator';
import { EventParser } from './data/parsers/eventParser';
import { MessageParser } from './data/parsers/messageParser';
import { SpendParser } from './data/parsers/spendParser';
import { FeatureEngineering } from './analysis/featureEngineering';
import { EnhancedMetricsCalculator } from './analysis/enhancedMetrics';
import { TeamShuffler } from './assignment/shuffler';
import { OutputFormatter } from './output/formatter';
import { StatisticsOrchestrator } from './output/statisticsOrchestrator';
import { TeamAnalyzer } from './analysis/teamAnalyzer';
import { ActivityAnalyzer } from './analysis/activityAnalyzer';
import { BalanceAnalyzer } from './analysis/balanceAnalyzer';
import { DistributionAnalyzer } from './analysis/distributionAnalyzer';
import { TeamAssignmentUseCase } from './usecases/teamAssignmentUseCase';
import { OutputGenerationUseCase } from './usecases/outputGenerationUseCase';

container.register('Application', { useClass: Application });
container.register('DataParser', { useClass: DataParser });
container.register('DataValidator', { useClass: DataValidator });

// Level B parsers
container.register('EventParser', { useClass: EventParser });
container.register('MessageParser', { useClass: MessageParser });
container.register('SpendParser', { useClass: SpendParser });
container.register('LevelBDataOrchestrator', { useClass: LevelBDataOrchestrator });
container.register('FeatureEngineering', { useClass: FeatureEngineering });
container.register('EnhancedMetricsCalculator', { useClass: EnhancedMetricsCalculator });
container.register('TeamShuffler', { useClass: TeamShuffler });
container.register('OutputFormatter', { useClass: OutputFormatter });
// Analysis components
container.register('TeamAnalyzer', { useClass: TeamAnalyzer });
container.register('ActivityAnalyzer', { useClass: ActivityAnalyzer });
container.register('BalanceAnalyzer', { useClass: BalanceAnalyzer });
container.register('DistributionAnalyzer', { useClass: DistributionAnalyzer });

// Statistics orchestrator
container.register('StatisticsOrchestrator', { useClass: StatisticsOrchestrator });

// Use cases
container.register('TeamAssignmentUseCase', { useClass: TeamAssignmentUseCase });
container.register('OutputGenerationUseCase', { useClass: OutputGenerationUseCase });

export default container;
