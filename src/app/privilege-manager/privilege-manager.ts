import { computed, signal } from '@angular/core';
import type { Nullable } from 'primeng/ts-helpers';
import { debug, error, info, trace } from '@tauri-apps/plugin-log';
import { type Child, type ChildProcess, Command } from '@tauri-apps/plugin-shell';

export class PrivilegeManager {
  public sudoDialogVisible = signal<boolean>(false);

  private password = signal<Nullable<string>>(null);
  private oneTimeUse = signal<string[]>([]);
  public authenticated = computed<boolean>(() => {
    const result = this.oneTimeUse().length > 0 || this.password() !== null;
    void trace(`Checking if authenticated: ${result}`);
    return result;
  });

  /*
   * Get the sudo password from the user. Open a dialog to prompt the user for the password.
   * If the password is already set, return immediately, otherwise the promise will resolve when the password is set.
   */
  async getSudoPassword(): Promise<void> {
    if (!this.authenticated()) {
      void info('No sudo password found');
      this.sudoDialogVisible.set(true);
      void trace(`Waiting for sudo password, ${this.sudoDialogVisible()}`);

      let timeout = 0;
      while (!this.authenticated()) {
        await new Promise((r) => setTimeout(r, 100));

        if (timeout >= 1000) {
          throw new Error('Timed out while waiting for credentials');
        }
        timeout++;
      }
      void debug(`Timeout: ${timeout}`);
    } else {
      void debug('Sudo password already existed');
    }
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
        this.oneTimeUse.update((value) => [...value, pass]);
      }
      if (!this.sudoDialogVisible()) {
        this.sudoDialogVisible.set(false);
      }
    } else {
      throw new Error('Credentials were not correct');
    }
  }

  /**
   * Execute a command as sudo, checking for credentials beforehand.
   * @param cmd The command to execute
   * @param keepEnv Whether to keep environment variables (sudo -E)
   */
  async executeCommandAsSudo(cmd: string, keepEnv = false): Promise<ChildProcess<string>> {
    const pass: string = await this.providePassword();
    const finalCmd: string = `echo ${pass} | sudo ${keepEnv ? '-E' : ''} -p "" -S bash -c '${cmd}'`;
    return Command.create('exec-bash', ['-c', finalCmd]).execute();
  }

  /**
   * Spawn a command as sudo, checking for credentials beforehand.
   * @param cmd The command to execute
   * @param keepEnv Whether to keep environment variables (sudo -E)
   */
  async spawnCommandAsSudo(cmd: string, keepEnv = false): Promise<Child> {
    const pass: string = await this.providePassword();
    const finalCmd: string = `echo ${pass} | sudo ${keepEnv ? '-E' : ''} -p "" -S bash -c '${cmd}'`;
    return Command.create('exec-bash', ['-c', finalCmd]).spawn();
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
        void info(`Installed ${pkg}`);
      } else {
        void error(`Failed to install ${pkg}`);
        throw new Error(`Failed to install ${pkg}`);
      }
    }

    let pkgCmd: string = executable ? executable : pkg;
    if (needsSudo) {
      void this.executeCommandAsSudo(pkgCmd, true);
    } else {
      void Command.create('exec-bash', ['-c', pkgCmd]).execute();
    }
  }

  /**
   * Provides the sudo password to calling functions. Asks for it when not available,
   * and uses either the cached or one-time stored passwords for authentication.
   * @returns The password string
   * @private
   */
  private async providePassword(): Promise<string> {
    if (!this.authenticated()) {
      await this.getSudoPassword();
    }

    if (this.password()) {
      return this.password() as string;
    } else if (this.oneTimeUse().length > 0) {
      return this.oneTimeUse().pop() as string;
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

    void trace(`Password test result: ${result.code}, ${result.stdout}`);
    return result.code === 0;
  }
}

export const PrivilegeManagerInstance = new PrivilegeManager();
