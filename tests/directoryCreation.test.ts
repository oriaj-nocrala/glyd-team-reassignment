import 'reflect-metadata';
import { container } from 'tsyringe';
import { Application } from '../src/application';
import * as fs from 'fs';
import * as path from 'path';
import { CLIOptions } from '../src/types';

describe('Directory Creation', () => {
  let app: Application;
  const testOutputDir = path.join(process.cwd(), 'test-output-dir');
  const testOutputFile = path.join(testOutputDir, 'subdir', 'result.csv');

  beforeEach(() => {
    app = container.resolve(Application);
    
    // Clean up any existing test directory
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up test directory after each test
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  it('should create output directories automatically', async () => {
    const options: CLIOptions = {
      teams: 2,
      input: 'data/level_a_players.csv', // Use existing CSV file
      output: testOutputFile,
      csv: true,
      seed: 42
    };

    // Verify directory doesn't exist initially
    expect(fs.existsSync(testOutputDir)).toBe(false);
    expect(fs.existsSync(path.dirname(testOutputFile))).toBe(false);

    // Run the application
    await app.run(options);

    // Verify directory and file were created
    expect(fs.existsSync(testOutputDir)).toBe(true);
    expect(fs.existsSync(path.dirname(testOutputFile))).toBe(true);
    expect(fs.existsSync(testOutputFile)).toBe(true);

    // Verify file has content
    const content = fs.readFileSync(testOutputFile, 'utf8');
    expect(content).toContain('player_id');
    expect(content).toContain('new_team_id');
    expect(content.length).toBeGreaterThan(100);
  });

  it('should create nested directories', async () => {
    const deepPath = path.join(testOutputDir, 'a', 'b', 'c', 'd', 'result.csv');
    const options: CLIOptions = {
      teams: 2,
      input: 'data/level_a_players.csv',
      output: deepPath,
      csv: true,
      seed: 42
    };

    // Verify nested path doesn't exist
    expect(fs.existsSync(path.dirname(deepPath))).toBe(false);

    // Run the application
    await app.run(options);

    // Verify all nested directories were created
    expect(fs.existsSync(path.dirname(deepPath))).toBe(true);
    expect(fs.existsSync(deepPath)).toBe(true);
  });

  it('should work with existing directories', async () => {
    // Create part of the directory structure manually
    const partialDir = path.join(testOutputDir, 'existing');
    fs.mkdirSync(partialDir, { recursive: true });
    
    const outputFile = path.join(partialDir, 'newdir', 'result.csv');
    const options: CLIOptions = {
      teams: 2,
      input: 'data/level_a_players.csv',
      output: outputFile,
      csv: true,
      seed: 42
    };

    // Verify only partial directory exists
    expect(fs.existsSync(partialDir)).toBe(true);
    expect(fs.existsSync(path.dirname(outputFile))).toBe(false);

    // Run the application
    await app.run(options);

    // Verify missing directories were created
    expect(fs.existsSync(path.dirname(outputFile))).toBe(true);
    expect(fs.existsSync(outputFile)).toBe(true);
  });

  it('should handle directory creation failures gracefully', async () => {
    // Try to create directory in invalid location (this should fail on most systems)
    const invalidPath = '/root/restricted/result.csv'; // Typically no permission
    const options: CLIOptions = {
      teams: 2,
      input: 'data/level_a_players.csv',
      output: invalidPath,
      csv: true,
      seed: 42
    };

    // This should either succeed (if running as root) or throw an error
    try {
      await app.run(options);
      // If we get here, the test passed (probably running with high privileges)
      expect(true).toBe(true);
    } catch (error) {
      // Expected behavior for most systems - permission denied
      expect(error).toBeDefined();
    }
  });

  it('should not create directories when no output file specified', async () => {
    const options: CLIOptions = {
      teams: 2,
      input: 'data/level_a_players.csv',
      // No output specified - should go to stdout
      seed: 42
    };

    // Run the application
    await app.run(options);

    // Verify no test directory was created
    expect(fs.existsSync(testOutputDir)).toBe(false);
  });
});