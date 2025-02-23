import { EventEmitter, inject, Injectable, signal } from '@angular/core';
import { ThemeHandler } from './theme-handler/theme-handler';
import { Store } from '@tauri-apps/plugin-store';
import { locale } from '@tauri-apps/plugin-os';
import { TranslocoService } from '@jsverse/transloco';
import { isPermissionGranted, Options, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { attachConsole, debug, error, info, trace } from '@tauri-apps/plugin-log';
import { Operation } from './interfaces';
import { MessageToastService } from '@garudalinux/core';
import { Child, ChildProcess, Command, TerminatedPayload } from '@tauri-apps/plugin-shell';
import { getConfigStore } from './store';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  activeLanguage = signal<string>('en');
  currentAction = signal<string | null>(null);
  drawerVisible = signal<boolean>(false);
  pendingOperations = signal<Operation[]>([]);
  terminalVisible = signal<boolean>(false);
  sudoPassword = signal<string | null>(null);
  sudoDialogVisible = signal<boolean>(false);
  terminalStatic = signal<boolean>(false);

  termOutputEmitter = new EventEmitter<string>();
  termNewTaskEmitter = new EventEmitter<string>();

  readonly themeHandler = new ThemeHandler();
  store!: Store;
  termOutput = '';

  private readonly messageToastService = inject(MessageToastService);
  private readonly translocoService = inject(TranslocoService);

  constructor() {
    void this.init();
  }

  async init() {
    const detach = await attachConsole();

    this.store = await getConfigStore();

    const activeLang: string = ((await this.store.get('language')) as string) ?? (await locale());
    if (activeLang && (this.translocoService.getAvailableLangs() as string[]).includes(activeLang)) {
      this.activeLanguage.set(activeLang);
      void this.store.set('language', activeLang);
      void debug(`Active language: ${activeLang}`);
    }
  }

  /**
   * Stores the output in a property to cache it for later use. Afterward it emits the output to the terminal.
   * @param output The output to add to the terminal.
   */
  addTermOutput(output: string) {
    this.termOutput += `${output}`;
    this.termOutputEmitter.emit(output);
  }

  /**
   * Send a notification to the user.
   * @param options The options for the notification.
   */
  async sendNotification(options: Options): Promise<void> {
    let permissionGranted: boolean = await isPermissionGranted();
    if (!permissionGranted) {
      const permission: NotificationPermission = await requestPermission();
      permissionGranted = permission === 'granted';
    }
    if (permissionGranted) {
      sendNotification(options);
    }
  }

  /**
   * Run the operation, resetting the terminal output and showing the terminal.
   * Closes the drawer after ensuring the sudo password exists.
   */
  async runOperation(): Promise<void> {
    this.termOutput = '';

    if (this.pendingOperations().find((op) => op.sudo)) {
      await this.getSudoPassword();
    }

    this.drawerVisible.set(false);
    this.terminalVisible.set(true);
  }

  /*
   * Get the sudo password from the user. Open a dialog to prompt the user for the password.
   * If the password is already set, return immediately, otherwise the promise will resolve when the password is set.
   */
  async getSudoPassword(): Promise<void> {
    if (!this.sudoPassword()) {
      void info('No sudo password found');
      this.sudoDialogVisible.set(true);
      void trace(`Waiting for sudo password, ${this.sudoDialogVisible()}`);

      let timeout = 0;
      while (!this.sudoPassword()) {
        await new Promise((r) => setTimeout(r, 100));

        if (timeout >= 1000) {
          void error('Timeout waiting for sudo password');
          this.messageToastService.error('Error', 'Timeout waiting for sudo password');
          return;
        }
        timeout++;
      }
      void debug(`Timeout: ${timeout}`);
    } else {
      void debug('Sudo password already existed');
    }
  }

  /**
   * Execute all pending operations. This will run the operations in order, updating the status and output of each operation.
   * If an operation fails, the status will be set to 'error'.
   */
  async executeOperations() {
    void info('Executing pending operations');
    await this.runOperation();

    let i: number = 1;
    for (const operation of this.pendingOperations()) {
      void info(operation.name);
      operation.status = 'running';
      this.termOutput = '';
      this.termNewTaskEmitter.emit(operation.name);
      this.currentAction.set(`${operation.prettyName} (${i}/${this.pendingOperations().length})`);

      let command: string = operation.command(operation.commandArgs) as string;
      if (operation.sudo) {
        command = `echo ${this.sudoPassword()} | sudo -p "" -S bash -c '${command}'`;
      }
      void trace(`Command: ${command}`);
      const cmd: Command<string> = Command.create('exec-bash', ['-c', command]);

      let finished: null | TerminatedPayload = null;
      cmd.stdout.on('data', (data) => {
        this.addTermOutput(data);
      });
      cmd.stderr.on('data', (data) => {
        this.addTermOutput(data);
      });
      cmd.on('close', (code) => {
        finished = code;
        void info(`child process exited with code ${code.code}`);
      });

      const child: Child = await cmd.spawn();
      void trace(`Process spawned with pid ${child.pid}`);

      while (finished === null) {
        await new Promise((r) => setTimeout(r, 100));
      }

      operation.output = this.termOutput;
      operation.status = (finished as TerminatedPayload).code === 0 ? 'complete' : 'error';

      if (i === this.pendingOperations().length) {
        this.currentAction.set(null);
      }
      i++;
    }
  }

  /**
   * Get the output of a command and transform it using the provided function.
   * Can be used to get the output of a command and transform it into a usable format via custom parsing.
   * @param cmd The command to run.
   * @param transformator The function to transform the output of the command.
   */
  async getCommandOutput<T>(cmd: string, transformator: Function): Promise<T | null> {
    const result: ChildProcess<string> = await Command.create('exec-bash', ['-c', cmd]).execute();

    if (result.code === 0) {
      return transformator(result.stdout) as T;
    } else {
      void error(`Failed running command: ${cmd}`);
      return null;
    }
  }

  /**
   * Get a command that can be run with sudo. This will prompt the user for the sudo password if it is not already set.
   * @param command The command to run with sudo.
   * @returns The command that can be run with sudo, after the sudo password has been set.
   */
  async prepareSudoCommand(command: string): Promise<string> {
    await this.getSudoPassword();
    return `echo ${this.sudoPassword()} | sudo -p "" -S bash -c '${command}'`;
  }
}
