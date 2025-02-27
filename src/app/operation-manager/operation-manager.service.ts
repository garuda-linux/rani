import { inject, Injectable, signal } from '@angular/core';
import { OperationManager } from './operation-manager';
import { StatefulPackage, SystemToolsSubEntry } from '../interfaces';
import { Operation } from './interfaces';
import { TranslocoService } from '@jsverse/transloco';
import { Nullable } from 'primeng/ts-helpers';
import { DnsProvider, ShellEntry } from '../system-settings/types';

@Injectable({
  providedIn: 'root',
})
export class OperationManagerService {
  public currentAction = signal<Nullable<string>>(null);
  public showTerminal = signal<boolean>(false);

  private readonly translocoService = inject(TranslocoService);
  private readonly manager = new OperationManager(this.translocoService);

  public pending = this.manager.pending;
  public operationOutput = this.manager.operationOutput;
  public operationOutputEmitter = this.manager.operationOutputEmitter;
  public operationNewEmitter = this.manager.operationNewEmitter;
  public user = this.manager.user;

  handleToggleSystemTools(entry: SystemToolsSubEntry) {
    return this.manager.handleToggleSystemTools(entry);
  }

  handleTogglePackage(entry: StatefulPackage): void {
    return this.manager.handleTogglePackage(entry);
  }

  removeFromArgs(operation: Operation, arg: string) {
    return this.manager.removeFromArgs(operation, arg);
  }

  removeFromPending(operation: Operation): void {
    return this.manager.removeFromPending(operation);
  }

  toggleHblock(initialState: boolean, newState: boolean): void {
    this.manager.toggleHblock(initialState, newState);
  }

  /**
   * Get the output of a command and transform it using the provided function.
   * Can be used to get the output of a command and transform it into a usable format via custom parsing.
   * @param cmd The command to run.
   * @param transformator The function to transform the output of the command.
   */
  async getCommandOutput<T>(cmd: string, transformator?: Function): Promise<T | null> {
    return await this.manager.getCommandOutput<T>(cmd, transformator);
  }

  /**
   * Get the output of a superuser command and transform it using the provided function.
   * Can be used to get the output of a command and transform it into a usable format via custom parsing.
   * @param cmd The command to run.
   * @param transformator The function to transform the output of the command.
   */
  async getSudoCommandOutput<T>(cmd: string, transformator?: Function): Promise<T | null> {
    return await this.manager.getCommandOutput<T>(cmd, transformator, true);
  }

  /**
   * Execute all pending operations.
   */
  async executeOperations(): Promise<void> {
    return await this.manager.executeOperations();
  }

  /**
   * Clear all pending operations.
   */
  async clearPending(): Promise<void> {
    return await this.manager.clearPending();
  }

  /**
   * Add terminal output to the terminal, emitting it to the terminal component.
   * @param output The output to add.
   */
  addTerminalOutput(output: string): void {
    this.manager.addTermOutput(output);
  }

  /**
   * Toggle the DNS server.
   * @param initialState Initial state of the DNS server.
   * @param dnsProvider The DNS provider to set.
   */
  toggleDnsServer(initialState: boolean, dnsProvider: DnsProvider): void {
    this.manager.toggleDnsServer(initialState, dnsProvider);
  }

  /**
   * Run an operation immediately.
   * @param operation The operation to run.
   */
  async runNow(operation: Operation): Promise<void> {
    return await this.manager.runNow(operation);
  }

  toggleShell(initialState: boolean, shellEntry: ShellEntry): void {
    return this.manager.toggleShell(initialState, shellEntry);
  }
}
