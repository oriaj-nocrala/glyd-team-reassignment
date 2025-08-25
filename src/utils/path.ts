import * as path from 'path';
import * as fs from 'fs';

export function validatePath(filePath: string, isOutput: boolean = false): string {
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(process.cwd())) {
    throw new Error(`File path is outside the project directory: ${filePath}`);
  }

  if (!isOutput && !fs.existsSync(resolvedPath)) {
    throw new Error(`Input file not found: ${resolvedPath}`);
  }

  return resolvedPath;
}
