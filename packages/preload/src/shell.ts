import { spawn } from 'node:child_process';
import { ipcRenderer } from 'electron';
import { randomUUID } from 'node:crypto';

export function shellSpawn(
  command: string,
  args: string[],
  options?: Record<string, unknown>,
) {
  const handle = spawn(command, args, options);

  return new Promise((resolve, reject) => {
    handle.on('error', reject);
    handle.on('close', resolve);
  });
}

// Store active processes for stdin/kill operations
const activeProcesses = new Map<string, any>();

export function shellSpawnStreaming(
  command: string,
  args: string[] = [],
  options?: Record<string, unknown>,
) {
  const processId = randomUUID();
  const handle = spawn(command, args, {
    ...options,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Store the process handle for later operations
  activeProcesses.set(processId, handle);

  // Send stdout data chunks to renderer
  handle.stdout?.on('data', (data: Buffer) => {
    ipcRenderer.send('shell:stdout', {
      processId,
      data: data.toString(),
    });
  });

  // Send stderr data chunks to renderer
  handle.stderr?.on('data', (data: Buffer) => {
    ipcRenderer.send('shell:stderr', {
      processId,
      data: data.toString(),
    });
  });

  // Send process completion event
  handle.on('close', (code: number | null, signal: string | null) => {
    ipcRenderer.send('shell:close', {
      processId,
      code,
      signal,
    });
    // Clean up the stored process
    activeProcesses.delete(processId);
  });

  // Send process error event
  handle.on('error', (error: Error) => {
    ipcRenderer.send('shell:error', {
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
    pid: handle.pid,
  };
}

export function shellWriteStdin(processId: string, data: string): boolean {
  const handle = activeProcesses.get(processId);
  if (handle && handle.stdin && !handle.stdin.destroyed) {
    handle.stdin.write(data);
    return true;
  }
  return false;
}

export function shellKillProcess(
  processId: string,
  signal = 'SIGTERM',
): boolean {
  const handle = activeProcesses.get(processId);
  if (handle && !handle.killed) {
    handle.kill(signal);
    activeProcesses.delete(processId);
    return true;
  }
  return false;
}
