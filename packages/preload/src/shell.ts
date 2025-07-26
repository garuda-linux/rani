import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { shell } from 'electron';
import { error } from './logging.js';
import { emit } from './events.js';

export function shellSpawn(command: string, args: string[], options?: Record<string, unknown>) {
  const handle = spawn(command, args, options);

  return new Promise((resolve, reject) => {
    handle.on('error', reject);
    handle.on('close', resolve);
  });
}
const activeProcesses = new Map<string, any>();

export function shellSpawnStreaming(command: string, args: string[] = [], options?: Record<string, unknown>) {
  const processId = randomUUID();
  const handle = spawn(command, args, {
    ...options,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Store the process handle for later operations
  activeProcesses.set(processId, handle);

  // Send stdout data chunks to renderer
  handle.stdout?.on('data', (data: Buffer) => {
    emit('shell:stdout', {
      processId,
      data: data.toString(),
    });
  });

  // Send stderr data chunks to renderer
  handle.stderr?.on('data', (data: Buffer) => {
    emit('shell:stderr', {
      processId,
      data: data.toString(),
    });
  });

  // Send process completion event
  handle.on('close', (code: number | null, signal: string | null) => {
    emit('shell:close', {
      processId,
      code,
      signal,
    });
    // Clean up the stored process
    activeProcesses.delete(processId);
  });

  // Send process error event
  handle.on('error', (error: Error) => {
    emit('shell:error', {
      processId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });
    // Clean up the stored process
    activeProcesses.delete(processId);
  });

  // Return process info immediately
  return {
    processId,
    pid: handle.pid || 0,
  };
}

export function shellWriteStdin(processId: string, data: string): boolean {
  const handle = activeProcesses.get(processId);
  if (handle?.stdin && !handle.stdin.destroyed) {
    handle.stdin.write(data);
    return true;
  }
  return false;
}

export function shellKillProcess(processId: string, signal = 'SIGTERM'): boolean {
  const handle = activeProcesses.get(processId);
  if (handle && !handle.killed) {
    handle.kill(signal);
    activeProcesses.delete(processId);
    return true;
  }
  return false;
}

export async function open(url: string): Promise<boolean> {
  try {
    const urlPattern = /^(https?:\/\/)|(file:\/\/)|(mailto:)|(tel:)/;
    if (!urlPattern.test(url)) {
      throw new Error('Invalid URL protocol');
    }
    await shell.openExternal(url);
    return true;
  } catch (err: any) {
    error(`Shell open error: ${err instanceof Error ? err.message : String(err)}`);
    throw new Error(`Failed to open URL: ${err instanceof Error ? err.message : err}`);
  }
}

export async function execute(
  command: string,
  args: string[] = [],
  options: Record<string, unknown> = {},
): Promise<{
  code: number | null;
  stdout: string;
  stderr: string;
  signal: string | null;
}> {
  const timeout = (options.timeout as number) || 0;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout,
      ...options,
    });

    let stdout = '';
    let stderr = '';
    let timeoutId: NodeJS.Timeout;

    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error('Command execution timed out'));
      }, timeout);
    }

    const cleanup = () => {
      clearTimeout(timeoutId);
    };

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code, signal) => {
      cleanup();
      resolve({
        code,
        stdout: stdout.substring(0, 1024 * 1024),
        stderr: stderr.substring(0, 1024 * 1024),
        signal,
      });
    });

    child.on('error', (err: any) => {
      cleanup();
      error(`Command execution error: ${err.cause}`);
      reject(new Error(`Command execution failed: ${err.message}`));
    });
  });
}
