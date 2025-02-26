import { Injectable } from '@angular/core';
import { OperationManager } from './operation-manager';
import { Package, SystemToolsSubEntry } from '../interfaces';
import { Operation } from './interfaces';

@Injectable({
  providedIn: 'root',
})
export class OperationManagerService {
  public manager = new OperationManager();

  handleToggleSystemTools(entry: SystemToolsSubEntry) {
    return this.manager.handleToggleSystemTools(entry);
  }

  handleTogglePackage(entry: Package): void {
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
  async getCommandOutput<T>(cmd: string, transformator: Function): Promise<T | null> {
    return await this.manager.getCommandOutput<T>(cmd, transformator);
  }
}
