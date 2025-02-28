import { signal } from '@angular/core';
import type { Nullable } from 'primeng/ts-helpers';
import { type ChildProcess, Command } from '@tauri-apps/plugin-shell';
import { Logger } from '../logging/logging';

export class PrivilegeManager {
  public sudoDialogVisible = signal<boolean>(false);
  public authenticated = signal<boolean>(false);
  private password = signal<Nullable<string>>(null);
  private oneTimeUse = signal<string[]>([]);
  private readonly logger = Logger.getInstance();

  /*
   * Get the sudo password from the user. Open a dialog to prompt the user for the password.
   * If the password is already set, return immediately, otherwise the promise will resolve when the password is set.
   * @returns A boolean indicating whether it is cached or not (true = cached)
   */
  async enterSudoPassword(): Promise<boolean> {
    if (!this.authenticated()) {
      this.logger.info('No sudo password found');
      this.sudoDialogVisible.set(true);
      this.logger.trace(`Waiting for sudo password, ${this.sudoDialogVisible()}`);

      let timeout = 0;
      while (!this.authenticated()) {
        await new Promise((r) => setTimeout(r, 100));

        if (timeout >= 1000) {
          throw new Error('Timed out while waiting for credentials');
        }
        timeout++;
      }
      this.logger.debug(`Timeout: ${timeout}`);
    } else {
      this.logger.debug('Sudo password already existed');
    }

    this.logger.trace(`Password received, will ${this.password() ? 'cache' : 'not cache'} it`);
    return this.password() !== null;
  }

  /**
   * Provide the sudo password to the manager. Tests it and throws in case it's not working.
   * This should be called by any frontend method that asks for the password.
   * @param pass The password as text
   * @param cache Whether to cache the password in-memory for later use
   */
  async writeSudoPass(pass: string, cache = false): Promise<void> {
    if (await this.passwordIsCorrect(pass)) {
      if (cache) {
        this.password.set(pass);
      } else {
        this.oneTimeUse.set([pass]);
      }
      this.authenticated.set(true);
      if (this.sudoDialogVisible()) {
        this.sudoDialogVisible.set(false);
      }
    } else {
      throw new Error('Credentials were not correct');
    }
  }

  /**
   * Clear any cached passwords and set status to unauthenticated.
   */
  clearCachedPassword(): void {
    if (this.password()) {
      this.password.set(null);
    } else {
      this.oneTimeUse.set([]);
    }
    this.authenticated.set(false);
  }

  /**
   * Execute a command as sudo, checking for credentials beforehand.
   * @param cmd The command to execute
   * @param keepEnv Whether to keep environment variables (sudo -E)
   */
  async executeCommandAsSudo(cmd: string, keepEnv = false): Promise<ChildProcess<string>> {
    const pass: string = await this.providePassword();
    const finalCmd = `echo ${pass} | sudo ${keepEnv ? '-E' : ''} -p "" -S bash -c '${cmd}'`;
    return Command.create('exec-bash', ['-c', finalCmd]).execute();
  }

  /**
   * Spawn a command as sudo, checking for credentials beforehand.
   * @param cmd The command to execute
   * @param keepEnv Whether to keep environment variables (sudo -E)
   * @param holdSudoPass Whether to keep the password around, for executing a stack of operations
   */
  async returnCommandAsSudo(cmd: string, keepEnv = false, holdSudoPass = false): Promise<Command<string>> {
    const pass: string = await this.providePassword(holdSudoPass);
    const finalCmd = `echo ${pass} | sudo ${keepEnv ? '-E' : ''} -p "" -S bash -c '${cmd}'`;
    return Command.create('exec-bash', ['-c', finalCmd]);
  }

  /**
   * Ensure a package is installed and run an executable afterward.
   * @param pkg The package to ensure is installed
   * @param executable The executable to run after the package is installed, if the executable differs from the package name
   * @param needsSudo Whether the command needs to be run with sudo
   */
  async ensurePackageAndRun(pkg: string, executable?: string, needsSudo = false): Promise<void> {
    const cmd = `pacman -Qq ${pkg}`;

    const result: ChildProcess<string> = await Command.create('exec-bash', ['-c', cmd]).execute();
    if (result.code !== 0) {
      const result: ChildProcess<string> = await this.executeCommandAsSudo(`pacman -S --noconfirm --needed ${pkg}`);

      if (result.code === 0) {
        this.logger.info(`Installed ${pkg}`);
      } else {
        this.logger.error(`Failed to install ${pkg}`);
        throw new Error(`Failed to install ${pkg}`);
      }
    }

    const pkgCmd: string = executable ? executable : pkg;
    if (needsSudo) {
      void this.executeCommandAsSudo(pkgCmd, true);
    } else {
      void Command.create('exec-bash', ['-c', pkgCmd]).execute();
    }
  }

  /**
   * Provides the sudo password to calling functions. Asks for it when not available,
   * and uses either the cached or one-time stored passwords for authentication.
   * One-time passwords are removed from the list after use, therefore no longer available.
   * @param holdSudoPass Whether to keep the password around, for executing a stack of operations.
   * @returns The password string
   * @private
   */
  private async providePassword(holdSudoPass = false): Promise<string> {
    await this.enterSudoPassword();

    if (this.password()) {
      this.logger.debug('Providing cached credentials');
      return this.password() as string;
    } else if (this.oneTimeUse().length > 0 && !holdSudoPass) {
      this.logger.debug('Consuming the one-time use credentials');
      this.authenticated.set(false);
      return this.oneTimeUse().pop() as string;
    } else if (this.oneTimeUse().length > 0 && holdSudoPass) {
      this.logger.debug('Was instructed to keep the credentials around');
      const value = this.oneTimeUse().pop() as string;
      this.oneTimeUse.set([value]);
      return value;
    } else {
      throw new Error("No password was found, this shouldn't happen!");
    }
  }

  /**
   * Test whether the given password is correct.
   * @param pass The password to test for correctness
   * @returns a boolean result indicating success or failure
   * @private
   */
  private async passwordIsCorrect(pass: string): Promise<boolean> {
    const cmd = `echo ${pass} | sudo -p "" -S bash -c 'ls / > /dev/null'`;
    const result: ChildProcess<string> = await Command.create('exec-bash', ['-c', cmd]).execute();

    this.logger.trace(`Password test result: ${result.code}, ${result.stdout}`);
    return result.code === 0;
  }
}

export const PrivilegeManagerInstance = new PrivilegeManager();
