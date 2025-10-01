import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { shell, ipcRenderer } from 'electron';
import { error } from './logging.js';
import { emit } from './events.js';

export function shellSpawn(command: string, args: string[], options?: Record<string, unknown>) {
  const handle = spawn(command, args, options);

  return new Promise((resolve, reject) => {
    handle.on('error', reject);
    handle.on('close', resolve);
  });
}

export function shellSpawnStreaming(command: string, args: string[] = [], options?: Record<string, unknown>) {
  const processId = randomUUID();

  try {
    // Use IPC to spawn the process in the main process with PTY, passing our processId
    const spawnPromise = ipcRenderer.invoke('shell:spawnStreaming', command, args, processId, options);

    spawnPromise
      .then((_result: { processId: string; pid: number }) => {
        // The main process will send events back to us via IPC
        // These are already handled by the events system in events.ts
      })
      .catch((err: unknown) => {
        emit('shell:error', {
          processId,
          error: {
            name: err instanceof Error ? err.name : 'Error',
            message: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
          },
        });
      });

    return {
      processId,
      pid: 0, // Will be updated when we get the response from main process
    };
  } catch (err: unknown) {
    // Emit error and rethrow
    emit('shell:error', {
      processId,
      error: {
        name: err instanceof Error ? err.name : 'Error',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      },
    });
    throw err;
  }
}

export async function shellWriteStdin(processId: string, data: string): Promise<boolean> {
  try {
    return await ipcRenderer.invoke('shell:writeStdin', processId, data);
  } catch (err: unknown) {
    error(`Shell write stdin error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function shellKillProcess(processId: string, signal = 'SIGTERM'): Promise<boolean> {
  try {
    return await ipcRenderer.invoke('shell:killProcess', processId, signal);
  } catch (err: unknown) {
    error(`Shell kill process error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function shellResize(processId: string, cols: number, rows: number): Promise<boolean> {
  try {
    return await ipcRenderer.invoke('shell:resize', processId, cols, rows);
  } catch (err: unknown) {
    error(`Shell resize error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function open(url: string): Promise<boolean> {
  // Use non-capturing groups to make operator precedence explicit and satisfy the linter.
  const urlPattern = /^(?:https?:\/\/|file:\/\/|mailto:|tel:)/;
  if (!urlPattern.test(url)) {
    // Validate early and provide a clear error to the caller.
    throw new Error('Invalid URL protocol');
  }

  try {
    await shell.openExternal(url);
    return true;
  } catch (err: unknown) {
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
      ...(options as Record<string, unknown>),
    });

    let stdout = '';
    let stderr = '';
    let timeoutId: NodeJS.Timeout | undefined;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
    };

    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        cleanup();
        reject(new Error('Command execution timed out'));
      }, timeout);
    }

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

    child.on('error', (err: Error) => {
      cleanup();
      error(`Command execution error: ${(err as Error & { cause?: string }).cause ?? err.message}`);
      reject(new Error(`Command execution failed: ${err.message}`));
    });
  });
}
