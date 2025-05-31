import { Injectable } from '@angular/core';
import { ShellStreamingResult } from './electron-types';

export interface ShellEvent {
  processId: string;
  data?: string;
  code?: number | null;
  signal?: string | null;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ElectronShellSpawnService {
  private activeProcesses = new Map<
    string,
    {
      onStdout?: (data: string) => void;
      onStderr?: (data: string) => void;
      onClose?: (code: number | null, signal: string | null) => void;
      onError?: (error: Error) => void;
    }
  >();

  constructor() {
    // Set up event listeners for shell events
    window.electronAPI.events.on('shell:stdout', (event: ShellEvent) => {
      const process = this.activeProcesses.get(event.processId);
      if (process?.onStdout && event.data) {
        process.onStdout(event.data);
      }
    });

    window.electronAPI.events.on('shell:stderr', (event: ShellEvent) => {
      const process = this.activeProcesses.get(event.processId);
      if (process?.onStderr && event.data) {
        process.onStderr(event.data);
      }
    });

    window.electronAPI.events.on('shell:close', (event: ShellEvent) => {
      const process = this.activeProcesses.get(event.processId);
      if (process?.onClose) {
        process.onClose(event.code ?? null, event.signal ?? null);
      }
      // Clean up the process from our tracking
      this.activeProcesses.delete(event.processId);
    });

    window.electronAPI.events.on('shell:error', (event: ShellEvent) => {
      const process = this.activeProcesses.get(event.processId);
      if (process?.onError && event.error) {
        const error = new Error(event.error.message);
        error.name = event.error.name;
        error.stack = event.error.stack;
        process.onError(error);
      }
      // Clean up the process from our tracking
      this.activeProcesses.delete(event.processId);
    });
  }

  spawnStreaming(
    command: string,
    args: string[] = [],
    options: {
      onStdout?: (data: string) => void;
      onStderr?: (data: string) => void;
      onClose?: (code: number | null, signal: string | null) => void;
      onError?: (error: Error) => void;
      spawnOptions?: Record<string, unknown>;
    } = {},
  ) {
    const { onStdout, onStderr, onClose, onError, spawnOptions } = options;

    // Start the process
    const result: ShellStreamingResult =
      window.electronAPI.shell.spawnStreaming(command, args, spawnOptions);

    // Register event handlers for this specific process
    this.activeProcesses.set(result.processId, {
      onStdout,
      onStderr,
      onClose,
      onError,
    });

    return result;
  }

  cleanup() {
    // Remove all event listeners
    window.electronAPI.events.off('shell:stdout', () => {});
    window.electronAPI.events.off('shell:stderr', () => {});
    window.electronAPI.events.off('shell:close', () => {});
    window.electronAPI.events.off('shell:error', () => {});
    this.activeProcesses.clear();
  }
}
