import { Injectable } from '@angular/core';
import type { Child, CommandResult } from '../types/shell';
import { ShellStreamingResult, ShellEvent } from './electron-types';
import { Logger } from '../logging/logging';

@Injectable({
  providedIn: 'root',
})
export class ElectronShellService {
  private readonly logger = Logger.getInstance();

  async open(url: string): Promise<boolean> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.shell.open(url);
  }

  async execute(
    command: string,
    args: string[] = [],
    options: Record<string, unknown> = {},
  ): Promise<CommandResult | Child> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return (await window.electronAPI.shell.execute(command, args, options)) as CommandResult | Child;
  }

  // Command builder for compatibility with Tauri Command class
  Command = class {
    private readonly command: string;
    private argsList: string[] = [];
    private options: Record<string, unknown> = {};

    constructor(command: string) {
      this.command = command;
    }

    args(args: string[]): this {
      this.argsList = args;
      return this;
    }

    cwd(cwd: string): this {
      this.options['cwd'] = cwd;
      return this;
    }

    env(env: Record<string, string>): this {
      this.options['env'] = { ...env };
      return this;
    }

    async execute(): Promise<CommandResult> {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      return (await window.electronAPI.shell.execute(this.command, this.argsList, this.options)) as CommandResult;
    }

    async spawn(): Promise<StreamingShellProcess> {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      const result: ShellStreamingResult = await window.electronAPI.shell.spawnStreaming(
        this.command,
        this.argsList,
        this.options,
      );
      return new StreamingShellProcess(result.processId, result.pid);
    }
  };
}

class StreamingShellProcess implements Child {
  private readonly logger = Logger.getInstance();
  private readonly processId: string;
  private readonly _pid: number;
  private stdoutBuffer = '';
  private stderrBuffer = '';
  private exitCode: number | null = null;
  private exitSignal: string | null = null;
  private hasExited = false;
  private exitPromise: Promise<void>;
  private exitResolve!: () => void;
  private stdinBuffer = '';

  constructor(processId: string, pid: number | undefined) {
    this.processId = processId;
    this._pid = pid || 0;

    this.exitPromise = new Promise((resolve) => {
      this.exitResolve = resolve;
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const handleStdout = (event: ShellEvent) => {
      if (event.processId === this.processId && event.data) {
        this.stdoutBuffer += event.data;
      }
    };

    const handleStderr = (event: ShellEvent) => {
      if (event.processId === this.processId && event.data) {
        this.stderrBuffer += event.data;
      }
    };

    const handleClose = (event: ShellEvent) => {
      if (event.processId === this.processId) {
        this.exitCode = event.code ?? null;
        this.exitSignal = event.signal ?? null;
        this.hasExited = true;
        this.cleanup();
        this.exitResolve();
      }
    };

    const handleError = (event: ShellEvent) => {
      if (event.processId === this.processId) {
        this.hasExited = true;
        this.cleanup();
        this.exitResolve();
      }
    };

    window.electronAPI.events.on('shell:stdout', handleStdout);
    window.electronAPI.events.on('shell:stderr', handleStderr);
    window.electronAPI.events.on('shell:close', handleClose);
    window.electronAPI.events.on('shell:error', handleError);
  }

  private cleanup(): void {
    // Note: In a real implementation, you'd want to properly remove these specific listeners
    // For now, we'll rely on the process-specific event filtering
  }

  async write(input: string): Promise<void> {
    this.stdinBuffer += input;
    await window.electronAPI.shell.writeStdin(this.processId, input);
  }

  kill(signal = 'SIGTERM'): void {
    if (!window.electronAPI.shell.killProcess(this.processId, signal)) {
      this.logger.warn('Failed to kill process - it may have already exited');
    }

    // Mark as exited for immediate compatibility
    if (!this.hasExited) {
      this.hasExited = true;
      this.exitCode = -1;
      this.exitSignal = signal;
      this.exitResolve();
    }
  }

  get pid(): number {
    return this._pid;
  }

  get stdout(): any {
    return {
      data: this.stdoutBuffer,
      toString: () => this.stdoutBuffer,
    };
  }

  get stderr(): any {
    return {
      data: this.stderrBuffer,
      toString: () => this.stderrBuffer,
    };
  }

  get code(): number | null {
    return this.exitCode;
  }

  get signal(): string | null {
    return this.exitSignal;
  }

  async waitForExit(): Promise<void> {
    return this.exitPromise;
  }

  get exited(): boolean {
    return this.hasExited;
  }
}
