import { inject, Injectable } from '@angular/core';
import { type PrivilegeManager, PrivilegeManagerInstance } from './privilege-manager';
import type { Child, ChildProcess } from '@tauri-apps/plugin-shell';
import { MessageToastService } from '@garudalinux/core';
import { LoadingService } from '../loading-indicator/loading-indicator.service';
import { trace } from '@tauri-apps/plugin-log';

@Injectable({
  providedIn: 'root',
})
export class PrivilegeManagerService {
  private manager: PrivilegeManager = PrivilegeManagerInstance;
  public sudoDialogVisible = this.manager.sudoDialogVisible;
  private loadingService = inject(LoadingService);
  private messageToastService = inject(MessageToastService);

  /*
   * Get the sudo password from the user. Open a dialog to prompt the user for the password.
   * If the password is already set, return immediately, otherwise the promise will resolve when the password is set.
   */
  async getSudoPassword(): Promise<void> {
    this.loadingService.loadingOn();
    await this.manager.getSudoPassword();
    this.loadingService.loadingOff();
  }

  /**
   * Provide the sudo password to the manager. Tests it and throws in case it's not working.
   * This should be called by any frontend method that asks for the password.
   * @param pass The password as text
   * @param cache Whether to cache the password in-memory for later use
   */
  async writeSudoPass(pass: string, cache = false): Promise<void> {
    this.loadingService.loadingOn();
    try {
      void trace(`Writing sudo pass: ${pass}, cache: ${cache}`);
      await this.manager.writeSudoPass(pass, cache);
    } catch (err: any) {
      this.messageToastService.error('Error', err.message);
    }
    this.loadingService.loadingOff();
  }

  /**
   * Execute a command as sudo, checking for credentials beforehand.
   * @param cmd The command to execute
   * @param keepEnv Whether to keep environment variables (sudo -E)
   */
  async executeCommandAsSudo(cmd: string, keepEnv = false): Promise<ChildProcess<string>> {
    this.loadingService.loadingOn();
    const result: ChildProcess<string> = await this.manager.executeCommandAsSudo(cmd, keepEnv);
    this.loadingService.loadingOff();
    return result;
  }

  /**
   * Spawn a command as sudo, checking for credentials beforehand.
   * @param cmd The command to execute
   * @param keepEnv Whether to keep environment variables (sudo -E)
   */
  async spawnCommandAsSudo(cmd: string, keepEnv = false): Promise<Child> {
    return await this.manager.spawnCommandAsSudo(cmd, keepEnv);
  }

  /**
   * Ensure a package is installed and run an executable afterward.
   * @param pkg The package to ensure is installed
   * @param executable The executable to run after the package is installed, if the executable differs from the package name
   * @param needsSudo Whether the command needs to be run with sudo
   */
  async ensurePackageAndRun(pkg: string, executable?: string, needsSudo = false): Promise<void> {
    this.loadingService.loadingOn();
    try {
      await this.manager.ensurePackageAndRun(pkg, executable, needsSudo);
    } catch (err: any) {
      this.loadingService.loadingOff();
      throw err;
    }
  }
}
