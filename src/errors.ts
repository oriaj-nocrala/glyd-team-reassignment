export class InvalidCsvError extends Error {
  constructor(message: string, public readonly invalidRows: any[]) {
    super(message);
    this.name = 'InvalidCsvError';
  }
}

export class InvalidPlayerError extends Error {
  constructor(message: string, public readonly invalidPlayers: any[]) {
    super(message);
    this.name = 'InvalidPlayerError';
  }
}

export class InvalidTeamConstraintsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTeamConstraintsError';
  }
}
