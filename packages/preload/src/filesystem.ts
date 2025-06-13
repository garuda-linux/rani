import { access, readFile, writeFile, stat, mkdir, unlink } from 'node:fs/promises';
import { join, normalize } from 'node:path';
import { F_OK } from 'node:constants';
import { error } from './logging.js';

function validateFilePath(filePath: string): boolean {
  // Prevent path traversal attacks
  const normalizedPath = normalize(filePath);

  // Get common allowed directories (expanded for preload context)
  const allowedDirs = [
    process.env.HOME || '',
    process.env.TMPDIR || '/tmp',
    process.env.TEMP || '/tmp',
    process.env.XDG_CONFIG_HOME || join(process.env.HOME || '', '.config'),
    process.env.XDG_DATA_HOME || join(process.env.HOME || '', '.local', 'share'),
    process.env.XDG_CACHE_HOME || join(process.env.HOME || '', '.cache'),
    '/etc',
    '/usr',
    '/var',
    '/boot',
    '/proc',
    '/sys',
  ].filter(Boolean); // Remove empty strings

  return (
    allowedDirs.some((dir) => normalizedPath.startsWith(dir)) &&
    !normalizedPath.includes('..') &&
    !normalizedPath.includes('~')
  );
}

export async function exists(filePath: string): Promise<boolean> {
  try {
    if (!validateFilePath(filePath)) {
      throw new Error('Invalid file path');
    }
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readTextFile(filePath: string): Promise<string> {
  try {
    if (!validateFilePath(filePath)) {
      throw new Error('Invalid file path');
    }

    try {
      await access(filePath, F_OK);
    } catch {
      throw new Error(`File not found: ${filePath}`);
    }

    const stats = await stat(filePath);
    if (stats.size > 10 * 1024 * 1024) {
      throw new Error('File too large');
    }

    const content: string = await readFile(filePath, 'utf-8');
    if (content === null || content === undefined) {
      throw new Error('File content is null or undefined');
    }

    return content;
  } catch (err) {
    error(`File read error: ${err instanceof Error ? err.message : String(err)}`);

    // Provide more specific error messages
    if (err instanceof Error) {
      const nodeError = err as NodeJS.ErrnoException;
      if (nodeError.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
      if (nodeError.code === 'EACCES') {
        throw new Error(`Permission denied: ${filePath}`);
      }
      if (nodeError.code === 'EISDIR') {
        throw new Error(`Path is a directory, not a file: ${filePath}`);
      }
      throw new Error(`Failed to read file: ${err.message}`);
    }
    throw new Error(`Failed to read file: ${err}`);
  }
}

export async function writeTextFile(filePath: string, contents: string): Promise<boolean> {
  try {
    if (!validateFilePath(filePath)) {
      throw new Error('Invalid file path');
    }
    if (contents.length > 10 * 1024 * 1024) {
      // 10MB limit
      throw new Error('Content too large');
    }
    await writeFile(filePath, contents, 'utf-8');
    return true;
  } catch (err) {
    error(`File write error: ${err instanceof Error ? err.message : String(err)}`);
    throw new Error(`Failed to write file: ${err instanceof Error ? err.message : err}`);
  }
}

export async function createDirectory(dirPath: string): Promise<boolean> {
  try {
    if (!validateFilePath(dirPath)) {
      throw new Error('Invalid directory path');
    }
    await mkdir(dirPath, { recursive: true });
    return true;
  } catch (err) {
    error(`Directory creation error: ${err instanceof Error ? err.message : String(err)}`);
    throw new Error(`Failed to create directory: ${err instanceof Error ? err.message : err}`);
  }
}

export async function removeFile(filePath: string): Promise<boolean> {
  try {
    if (!validateFilePath(filePath)) {
      throw new Error('Invalid file path');
    }
    await unlink(filePath);
    return true;
  } catch (err) {
    error(`File removal error: ${err instanceof Error ? err.message : String(err)}`);
    throw new Error(`Failed to remove file: ${err instanceof Error ? err.message : err}`);
  }
}
