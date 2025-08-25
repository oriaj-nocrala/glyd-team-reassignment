import 'reflect-metadata';
import { container } from 'tsyringe';
import { Application } from './application';
import { DataParser } from './data/parser';
import { DataValidator } from './data/validator';
import { LevelBDataParser } from './data/levelBParser';
import { FeatureEngineering } from './analysis/featureEngineering';
import { EnhancedMetricsCalculator } from './analysis/enhancedMetrics';
import { TeamShuffler } from './assignment/shuffler';
import { OutputFormatter } from './output/formatter';
import { StatisticsGenerator } from './output/statistics';

container.register('Application', { useClass: Application });
container.register('DataParser', { useClass: DataParser });
container.register('DataValidator', { useClass: DataValidator });
container.register('LevelBDataParser', { useClass: LevelBDataParser });
container.register('FeatureEngineering', { useClass: FeatureEngineering });
container.register('EnhancedMetricsCalculator', { useClass: EnhancedMetricsCalculator });
container.register('TeamShuffler', { useClass: TeamShuffler });
container.register('OutputFormatter', { useClass: OutputFormatter });
container.register('StatisticsGenerator', { useClass: StatisticsGenerator });

export default container;
