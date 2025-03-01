import { inject, Injectable, signal } from '@angular/core';
import { OperationManager } from './operation-manager';
import { MaintenanceAction, SystemToolsSubEntry } from '../interfaces';
import { Operation } from './interfaces';
import { TranslocoService } from '@jsverse/transloco';
import { DnsProvider, ShellEntry } from '../system-settings/types';
import { Logger } from '../logging/logging';
import { StatefulPackage } from '../gaming/interfaces';

@Injectable({
  providedIn: 'root',
})
export class OperationManagerService {
  public showTerminal = signal<boolean>(false);

  private readonly translocoService = inject(TranslocoService);
  private readonly logger = Logger.getInstance();
  private readonly manager = new OperationManager(this.translocoService);

  public currentAction = this.manager.currentOperation;
  public pending = this.manager.pending;
  public operationOutput = this.manager.operationOutput;
  public operationOutputEmitter = this.manager.operationOutputEmitter;
  public operationNewEmitter = this.manager.operationNewEmitter;
  public user = this.manager.user;

  constructor() {
    this.manager.requestTerminal.subscribe((show) => {
      if (show) this.showTerminal.set(true);
    });
  }

  /**
   * Toggle the state of a system tools entry, adding and removing it from the pending operations as needed.
   * @param entry The operation to add.
   */
  handleToggleSystemTools(entry: SystemToolsSubEntry): void {
    try {
      return this.manager.handleToggleSystemTools(entry);
    } catch (err: any) {
      this.logger.error(err);
    }
  }

  /**
   * Toggle the state of a package, adding and removing it from the pending operations as needed.
   * @param entry The operation to add.
   */
  handleTogglePackage(entry: StatefulPackage): void {
    try {
      return this.manager.handleTogglePackage(entry);
    } catch (err: any) {
      this.logger.error(err);
    }
  }

  /**
   * Remove an operation from the pending operations arguments.
   * @param operation The operation to remove the argument from.
   * @param arg The argument to remove.
   */
  removeFromArgs(operation: Operation, arg: string): void {
    try {
      return this.manager.removeFromArgs(operation, arg);
    } catch (err: any) {
      this.logger.error(err);
    }
  }

  /**
   * Remove an operation from the pending operations.
   * @param operation The operation to remove.
   */
  removeFromPending(operation: Operation): void {
    try {
      return this.manager.removeFromPending(operation);
    } catch (err: any) {
      this.logger.error(err);
    }
  }

  /**
   * Toggle the state of a hblock entry, adding and removing it from the pending operations as needed.
   * @param initialState The initial state of the hblock.
   * @param newState The new state of the hblock.
   */
  toggleHblock(initialState: boolean, newState: boolean): void {
    try {
      return this.manager.toggleHblock(initialState, newState);
    } catch (err: any) {
      this.logger.error(err);
    }
  }

  /**
   * Get the output of a command and transform it using the provided function.
   * Can be used to get the output of a command and transform it into a usable format via custom parsing.
   * @param cmd The command to run.
   * @param transformator The function to transform the output of the command.
   */
  async getCommandOutput<T>(cmd: string, transformator?: Function): Promise<T | null> {
    try {
      return await this.manager.getCommandOutput<T>(cmd, transformator);
    } catch (err: any) {
      this.logger.error(err);
    }
    return null;
  }

  /**
   * Get the output of a superuser command and transform it using the provided function.
   * Can be used to get the output of a command and transform it into a usable format via custom parsing.
   * @param cmd The command to run.
   * @param transformator The function to transform the output of the command.
   */
  async getSudoCommandOutput<T>(cmd: string, transformator?: Function): Promise<T | null> {
    try {
      return await this.manager.getCommandOutput<T>(cmd, transformator, true);
    } catch (err: any) {
      this.logger.error(err);
    }
    return null;
  }

  /**
   * Execute all pending operations.
   */
  async executeOperations(): Promise<void> {
    try {
      return await this.manager.executeOperations();
    } catch (err: any) {
      this.logger.error(err);
    }
  }

  /**
   * Clear all pending operations.
   */
  async clearPending(): Promise<void> {
    try {
      return await this.manager.clearPending();
    } catch (err: any) {
      this.logger.error(err);
    }
  }

  /**
   * Add terminal output to the terminal, emitting it to the terminal component.
   * @param output The output to add.
   */
  addTerminalOutput(output: string): void {
    try {
      this.manager.addTermOutput(output);
    } catch (err: any) {
      this.logger.error(err);
    }
  }

  /**
   * Toggle the DNS server.
   * @param initialState Initial state of the DNS server.
   * @param dnsProvider The DNS provider to set.
   */
  toggleDnsServer(initialState: boolean, dnsProvider: DnsProvider): void {
    try {
      this.manager.toggleDnsServer(initialState, dnsProvider);
    } catch (err: any) {
      this.logger.error(err);
    }
  }

  /**
   * Run an operation immediately.
   * @param operation The operation to run.
   */
  async runNow(operation: Operation): Promise<void> {
    try {
      return await this.manager.runNow(operation);
    } catch (err: any) {
      this.logger.error(err);
    }
  }

  /**
   * Toggle the state of a shell entry, adding and removing it from the pending operations as needed.
   * @param initialState The initial state of the shell.
   * @param shellEntry The shell entry to use.
   */
  toggleShell(initialState: boolean, shellEntry: ShellEntry): void {
    try {
      return this.manager.toggleShell(initialState, shellEntry);
    } catch (err: any) {
      this.logger.error(err);
    }
  }

  /**
   * Toggle the state of a maintenance action, adding or removing it from the pending operations as needed.
   * @param action The action to toggle
   */
  toggleMaintenanceActionPending(action: MaintenanceAction) {
    try {
      return this.manager.toggleMaintenanceActionPending(action);
    } catch (err: any) {
      this.logger.error(err);
    }
  }
}
