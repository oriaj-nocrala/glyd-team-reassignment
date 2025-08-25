import seedrandom from 'seedrandom';

export class DeterministicRandom {
  private rng: seedrandom.PRNG;

  constructor(seed?: number | string) {
    if (seed !== undefined) {
      this.rng = seedrandom(seed.toString());
    } else {
      // Use current timestamp as default seed for reproducibility tracking
      const defaultSeed = Date.now();
      this.rng = seedrandom(defaultSeed.toString());
      console.log(`Using default seed: ${defaultSeed}`);
    }
  }

  /**
   * Generate random number between 0 and 1
   */
  random(): number {
    return this.rng();
  }

  /**
   * Generate random integer between min and max (inclusive)
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm with deterministic random
   */
  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  /**
   * Select random element from array
   */
  choice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array');
    }
    const index = this.randomInt(0, array.length - 1);
    return array[index];
  }

  /**
   * Generate deterministic UUID-like string for tracking
   */
  generateId(): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars[this.randomInt(0, chars.length - 1)];
    }
    return result;
  }
}

export class SeedManager {
  /**
   * Generate reproducible seed from player data
   */
  static generateDataSeed(playerIds: number[]): number {
    // Create deterministic seed from sorted player IDs
    const sortedIds = [...playerIds].sort((a, b) => a - b);
    let hash = 0;

    sortedIds.forEach((id) => {
      hash = ((hash << 5) - hash + id) & 0xffffffff;
    });

    return Math.abs(hash);
  }

  /**
   * Combine user seed with data seed for full determinism
   */
  static combineSeed(userSeed: number | undefined, dataSeed: number): number {
    if (userSeed === undefined) {
      return dataSeed;
    }

    // XOR combination for mixing seeds
    return (userSeed ^ dataSeed) >>> 0; // Ensure positive 32-bit integer
  }

  /**
   * Create reproducible seed string for logging
   */
  static formatSeedInfo(userSeed: number | undefined, finalSeed: number): string {
    if (userSeed === undefined) {
      return `Using data-derived seed: ${finalSeed}`;
    }
    return `Using user seed ${userSeed} (final: ${finalSeed})`;
  }

  /**
   * Validate seed parameter
   */
  static validateSeed(seed: number): { isValid: boolean; message?: string } {
    if (!Number.isInteger(seed)) {
      return { isValid: false, message: 'Seed must be an integer' };
    }

    if (seed < 0) {
      return { isValid: false, message: 'Seed must be non-negative' };
    }

    if (seed > 2147483647) {
      return { isValid: false, message: 'Seed must be less than 2^31' };
    }

    return { isValid: true };
  }
}
