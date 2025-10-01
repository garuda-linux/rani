import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { shell } from 'electron';
import { error } from './logging.js';
import { emit } from './events.js';

// Try to import node-pty. In some environments it may not be available,
// so we'll lazily require it inside the function and fallback to spawn.
let nodePty: any = undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  nodePty = require('node-pty');
  // oxlint-disable-next-line no-unused-vars
} catch (e) {
  nodePty = undefined;
}

export function shellSpawn(command: string, args: string[], options?: Record<string, unknown>) {
  const handle = spawn(command, args, options);

  return new Promise((resolve, reject) => {
    handle.on('error', reject);
    handle.on('close', resolve);
  });
}

type ActiveHandle = {
  type: 'pty' | 'spawn';
  handle: any;
};

const activeProcesses = new Map<string, ActiveHandle>();

export function shellSpawnStreaming(command: string, args: string[] = [], options?: Record<string, unknown>) {
  const processId = randomUUID();

  try {
    const cols = (options as any)?.cols ?? 80;
    const rows = (options as any)?.rows ?? 24;
    const cwd = (options as any)?.cwd ?? process.cwd();
    const env = { ...process.env, ...((options as any)?.env ?? {}) };

    if (nodePty) {
      const ptyProcess = nodePty.spawn(command, args, {
        name: 'xterm-256color',
        cols,
        rows,
        cwd,
        env,
        encoding: 'utf8',
      });

      activeProcesses.set(processId, { type: 'pty', handle: ptyProcess });

      // node-pty provides combined stdout/stderr via onData/onExit
      ptyProcess.onData((data: string) => {
        emit('shell:stdout', { processId, data });
      });

      ptyProcess.onExit((event: { exitCode: number | null; signal?: number | string | null }) => {
        emit('shell:close', {
          processId,
          code: event.exitCode,
          signal: event.signal ?? null,
        });
        activeProcesses.delete(processId);
      });

      return {
        processId,
        pid: ptyProcess.pid || 0,
      };
    }

    // If node-pty isn't available, fall back to a normal child_process.spawn and proxy streams.
    const handle = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      ...(options as any),
    });

    activeProcesses.set(processId, { type: 'spawn', handle });

    handle.stdout?.on('data', (data: Buffer) => {
      emit('shell:stdout', {
        processId,
        data: data.toString(),
      });
    });

    handle.stderr?.on('data', (data: Buffer) => {
      emit('shell:stderr', {
        processId,
        data: data.toString(),
      });
    });

    handle.on('close', (code: number | null, signal: string | null) => {
      emit('shell:close', {
        processId,
        code,
        signal,
      });
      activeProcesses.delete(processId);
    });

    handle.on('error', (err: Error) => {
      emit('shell:error', {
        processId,
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
      });
      activeProcesses.delete(processId);
    });

    return {
      processId,
      pid: handle.pid || 0,
    };
  } catch (err: any) {
    // Emit error and rethrow
    emit('shell:error', {
      processId,
      error: {
        name: err?.name ?? 'Error',
        message: err?.message ?? String(err),
        stack: err?.stack ?? undefined,
      },
    });
    throw err;
  }
}

export function shellWriteStdin(processId: string, data: string): boolean {
  const entry = activeProcesses.get(processId);
  if (!entry) return false;

  const { type, handle } = entry;
  if (type === 'pty') {
    try {
      handle.write(data);
      return true;
      // oxlint-disable-next-line no-unused-vars
    } catch (e) {
      return false;
    }
  }

  if (type === 'spawn' && handle?.stdin && !handle.stdin.destroyed) {
    handle.stdin.write(data);
    return true;
  }

  return false;
}

export function shellKillProcess(processId: string, signal = 'SIGTERM'): boolean {
  const entry = activeProcesses.get(processId);
  if (!entry) return false;

  const { type, handle } = entry;

  try {
    if (type === 'pty') {
      // node-pty exposes kill
      if (typeof handle.kill === 'function') handle.kill(signal);
      activeProcesses.delete(processId);
      return true;
    }

    if (type === 'spawn') {
      if (handle && !handle.killed) {
        handle.kill(signal);
        activeProcesses.delete(processId);
        return true;
      }
    }
    // oxlint-disable-next-line no-unused-vars
  } catch (e) {
    // ignore kill errors
    return false;
  }

  return false;
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
      ...(options as any),
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

    child.on('error', (err: any) => {
      cleanup();
      error(`Command execution error: ${err.cause ?? err.message}`);
      reject(new Error(`Command execution failed: ${err.message}`));
    });
  });
}
