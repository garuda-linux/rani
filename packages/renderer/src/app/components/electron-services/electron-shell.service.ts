import { Injectable } from '@angular/core';
import type { Child, CommandResult } from '../../types/shell';

@Injectable({
  providedIn: 'root',
})
export class ElectronShellService {
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
    return (await window.electronAPI.shell.execute(command, args, options)) as
      | CommandResult
      | Child;
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
      return (await window.electronAPI.shell.execute(
        this.command,
        this.argsList,
        this.options,
      )) as CommandResult;
    }

    async spawn(): Promise<Child> {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      return (await window.electronAPI.shell.execute(
        this.command,
        this.argsList,
        {
          ...this.options,
          spawn: true,
        },
      )) as Child;
    }
  };
}
