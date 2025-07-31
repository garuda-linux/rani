import { computed, EventEmitter, inject, Injectable, signal } from '@angular/core';
import { ElectronFsService } from '../../electron-services';
import { ElectronShellSpawnService } from '../../electron-services/electron-shell-spawn.service';
import { ShellStreamingResult } from '../../electron-services';
import { ConfigService } from '../config/config.service';
import { LoadingService } from '../loading-indicator/loading-indicator.service';
import { Logger } from '../../logging/logging';
import { TranslocoService } from '@jsverse/transloco';
import { ElectronPathService } from '../../electron-services';

export class Task {
  constructor(priority: number, script: string, escalate: boolean, id: string, name: string, icon: string) {
    this.priority = priority;
    this.script = script;
    this.escalate = escalate;
    this.id = id;
    this.name = name;
    this.icon = icon;
  }

  priority: number;
  script: string;
  escalate: boolean;
  id: string;
  name: string;
  icon: string;
}

export class TrackedShell {
  private readonly logger = Logger.getInstance();
  private processId: string | undefined;
  private resolvePromise: (() => void) | null = null;
  private rejectPromise: ((error: Error) => void) | null = null;
  private outputs: EventEmitter<string>;
  public running = false; // Initial state

  constructor(
    private command: string,
    private args: string[],
    outputs: EventEmitter<string>,
    private shellSpawnService: ElectronShellSpawnService,
  ) {
    this.outputs = outputs;
  }

  async start(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      this.running = true;
      this.resolvePromise = resolve;
      this.rejectPromise = reject;

      this.logger.trace(`Starting persistent shell: ${this.command} ${JSON.stringify(this.args)}`);

      try {
        // AWAIT the promise to get the actual ShellStreamingResult object
        const result: ShellStreamingResult = await this.shellSpawnService.spawnStreaming(this.command, this.args, {
          onStdout: (data) => this.outputs.emit(data),
          onStderr: (data) => this.outputs.emit(data),
          onClose: (code: number | null, signal: string | null) => {
            this.running = false;
            this.logger.trace(`Persistent shell closed. Code: ${code}, Signal: ${signal}`);
            if (code === 0) {
              this.resolvePromise?.();
            } else {
              this.rejectPromise?.(new Error(`Persistent shell exited with code ${code}`));
            }
          },
          onError: (error: unknown) => {
            this.running = false;
            this.logger.error(`Persistent shell error: ${error instanceof Error ? error.message : String(error)}`);
            this.rejectPromise?.(error instanceof Error ? error : new Error(String(error)));
          },
        });

        this.processId = result.processId;
        if (!this.processId) {
          throw new Error(`Failed to get processId for spawned shell: ${this.command}`);
        }
        // Resolve immediately after spawning, as the shell is now "running"
        // and ready to accept commands. The close/error events will handle termination.
        resolve();
      } catch (error: any) {
        this.running = false; // Ensure running is false on spawn error
        this.logger.error(`Error starting persistent shell: ${error.message}`);
        reject(error); // Reject the outer promise if spawn fails
      }
    });
  }

  async write(data: string): Promise<void> {
    if (!this.processId) {
      throw new Error('Tracked shell not started. Call start() first');
    }
    await this.shellSpawnService.writeStdin(this.processId, data + '\n');
  }

  async stop(): Promise<void> {
    if (!this.processId || !this.running) {
      this.logger.debug('Shell not running or already stopped');
      return;
    }

    this.logger.debug(`Stopping persistent shell ${this.processId}`);
    await this.shellSpawnService.writeStdin(this.processId, 'exit 0\n');

    const startTime = Date.now();
    const timeout = 5000;
    while (this.running && Date.now() - startTime < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (this.running) {
      this.logger.warn(`Shell ${this.processId} did not exit gracefully within timeout, killing.`);
      await this.shellSpawnService.killProcess(this.processId, 'SIGTERM'); // Force kill if it didn't stop
    }
  }
}

export class TrackedShells {
  constructor(
    public normal: TrackedShell | null,
    public escalated: TrackedShell | null,
  ) {}

  async startAll(): Promise<void> {
    const promises: Promise<void>[] = [];
    if (this.normal) promises.push(this.normal.start());
    if (this.escalated) promises.push(this.escalated.start());
    await Promise.all(promises);
  }

  async stopAll(): Promise<void> {
    const promises: Promise<void>[] = [];
    // Stop escalated first, then normal (optional, but good practice)
    if (this.escalated) promises.push(this.escalated.stop());
    if (this.normal) promises.push(this.normal.stop());
    await Promise.all(promises);
  }
}

@Injectable({
  providedIn: 'root',
})
export class TaskManagerService {
  private readonly configService = inject(ConfigService);
  private readonly loadingService = inject(LoadingService);
  private readonly logger = Logger.getInstance();
  private readonly translocoService = inject(TranslocoService);
  private readonly fsService = inject(ElectronFsService); // Correctly injected
  private readonly pathService = inject(ElectronPathService);
  private readonly shellStreamingService = inject(ElectronShellSpawnService);

  readonly tasks = signal<Task[]>([]);
  readonly sortedTasks = computed(() => [...this.tasks()].sort((a, b) => a.priority - b.priority));
  readonly currentTask = signal<Task | null>(null);
  readonly running = signal<boolean>(false);
  readonly aborting = signal<boolean>(false);
  readonly count = computed(() => this.tasks().length);
  readonly cachedData = signal<string>('');

  // progress can be null when currentTask is null.
  // If currentTask is not in sortedList, currentIndex is 1. In all other cases, currentIndex is the index of currentTask in sortedList.
  readonly progress = computed(() => {
    const currentTask = this.currentTask();
    if (currentTask === null) {
      return null;
    }
    const sortedList = this.sortedTasks();
    const currentIndex = sortedList.findIndex((task) => task.id === currentTask.id);
    if (currentIndex === -1) {
      return 1;
    }
    return currentIndex + 1;
  });

  readonly events = new EventEmitter<string>();
  readonly dataEvents = new EventEmitter<string>();
  data = '';

  // Holds the active persistent shell instances
  private activeShells: TrackedShells | null = null;

  constructor() {
    this.logger.debug('TaskManagerService constructor initialized');
    this.dataEvents.subscribe((data) => {
      this.data += data;
      this.cachedData.update((currentData) => (currentData += data));
    });
  }

  /**
   * Execute a bash scriptlet using basic bash and wait for it to finish.
   * This uses the non-streaming `execute` path, likely for one-off commands.
   * @param script The bash scriptlet to execute
   * @param reinit Whether to reinitialize the config service or not.
   * @param timeout Optional timeout in milliseconds for the execution (0 means no timeout).
   */
  async executeAndWaitBash(script: string, reinit = false, timeout = 0): Promise<any> {
    // Change ChildProcess<string> to any due to varied return type
    let result: any; // Type 'any' for now, should be specific return of ipcRenderer.invoke('shell:execute')
    try {
      this.logger.debug(`Executing bash code: ${script}`);

      // For now, let's directly call invoke if shellService is not defined yet.
      // If you're only using ElectronShellSpawnService for *all* shell interaction,
      // this method should also use the persistent shells.
      result = await this.shellStreamingService.execute('bash', ['--norc', '--noprofile', '-c', `LANG=C ${script}`], {
        timeout,
      });
    } catch (error) {
      this.logger.error(`Unexpected error while executing bash script: ${error}`);
      result = {
        signal: null,
        code: 1,
        stdout: '',
        stderr: '',
      };
    }

    if (reinit) void this.configService.init(false);
    return result;
  }

  /**
   * Execute a bash script in a terminal using garuda-libs and wait for it to finish.
   * @param script The bash scriptlet to execute in the terminal.
   * @param reinit Whether to reinitialize the config service or not.
   * @param timeout Optional timeout in milliseconds for the execution (0 means no timeout).
   */
  async executeAndWaitBashTerminal(script: string, reinit = false, timeout = 0): Promise<void> {
    try {
      this.logger.debug(`Executing bash code in terminal: ${script}`);
      this.loadingService.loadingOn();
      await this.shellStreamingService.execute('/usr/lib/garuda/launch-terminal', [ script ], {
        timeout,
      });
    } catch (error) {
      this.logger.error(`Unexpected error while executing bash script in terminal: ${error}`);
    } finally {
      this.loadingService.loadingOff();
    }

    if (reinit) void this.configService.init(false);
  }

  /**
   * Create a new task, returning the task.
   * @param priority The priority of the task.
   * @param id The id of the task.
   * @param escalate Whether the task should escalate to root.
   * @param name The name of the task.
   * @param icon The icon of the task.
   * @param script The script to execute.
   * @returns The created task.
   */
  createTask(priority: number, id: string, escalate: boolean, name: string, icon: string, script: string): Task {
    return new Task(priority, script, escalate, id, name, icon);
  }

  /**
   * Schedule a task to be executed.
   * @param task The task to schedule.
   */
  scheduleTask(task: Task): Task {
    this.tasks.update((tasks) => {
      const newTasks: Task[] = [...tasks];
      newTasks.push(task);
      return newTasks;
    });
    return task;
  }

  /**
   * Check if a task is in the task list.
   * @param task The task to check.
   * @returns Whether the task is in the task list as a boolean.
   */
  hasTask(task: Task): boolean {
    return this.tasks().findIndex((t) => t.id === task.id) !== -1;
  }

  /**
   * Remove a task from the task list.
   * @param task The task to remove.
   */
  removeTask(task: Task): void {
    this.tasks.update((tasks) => {
      tasks = tasks.filter((t) => t.id !== task.id);
      return tasks;
    });
  }

  /**
   * Find a task by its id.
   * @param id The id of the task to find.
   */
  findTaskById(id: string): Task | null {
    return this.tasks().find((task) => task.id === id) || null;
  }

  /**
   * Remove all tasks from the task list.
   */
  clearTasks(): void {
    this.tasks.set([]);
  }

  /**
   * Clear terminal and optionally set content to a string.
   * @param content The content to set the terminal to.
   */
  clearTerminal(content = ''): void {
    this.data = content;
    this.events.emit('clear');
    if (content !== '') {
      this.dataEvents.emit(content);
    }
  }

  /**
   * Show the terminal.
   * @param show Whether to show the terminal or not.
   */
  toggleTerminal(show: boolean): void {
    if (show) this.events.emit('show');
    else this.events.emit('hide');
  }

  /**
   * Abort the current task.
   */
  abort(): void {
    if (!this.running()) {
      this.logger.error('Abort attempted while not running');
      return;
    }
    this.aborting.set(true);
  }

  /**
   * Execute a specific task with extra safeguards.
   * @param task The task to execute.
   * @param shells The shells to use.
   * @private
   */
  private async internalExecuteTask(task: Task, shells: TrackedShells): Promise<void> {
    this.logger.debug(`Executing task: ${task.script}`);

    const shell: TrackedShell | null = task.escalate ? shells.escalated : shells.normal;
    if (!shell) {
      throw new Error(`No ${task.escalate ? 'escalated' : 'normal'} shell available for task ${task.name}`);
    }

    const appLocalDataDirectory = await this.pathService.appLocalDataDir();
    const path: string = await this.pathService.resolve(appLocalDataDirectory, 'taskscript.tmp');

    // Safety check, make sure path does not contain unsafe characters
    if (path.includes("'")) {
      this.logger.error('Path contains unsafe character: ' + path);
      throw new Error('Unsafe path character detected');
    }

    // Write script to a temporary file
    const script: string = task.script.trim();
    await this.fsService.writeTextFile(path, script);
    const digest: ArrayBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(script));
    const hash = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const taskFinishedMessage: string = this.translocoService.translate('taskmanager.scriptExecuted');

    // Execute the script with extra safeguards by writing to the persistent shell's stdin
    await shell.write(`
      # Read file into variable
      script=$(<'${path}')
      # Check if the script is the same as the one we wrote
      if [ "$(printf '%s' "$script" | sha256sum | cut -d ' ' -f 1)" != "${hash}" ]; then
        echo "${this.translocoService.translate('taskmanager.scriptMismatch')}"
        # This is bad enough to end the entire shell
        exit 1
      fi
      # Execute the script, -x for debugging output
      bash -x /dev/stdin <<< "$script"
      rm '${path}'

      printf "\n${taskFinishedMessage}\n"
    `);

    while ((await this.fsService.exists(path)) && shell.running) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    this.logger.info(`Task ${task.name} has finished`);
  }

  /**
   * Execute a given task a single time.
   * @param task The task to execute.
   */
  async executeTask(task: Task): Promise<void> {
    if (this.running()) {
      this.logger.error('Task manager is already running a task');
      return;
    }
    this.running.set(true);
    this.clearTerminal();

    // Create shells as needed for this single task execution
    this.activeShells = new TrackedShells(
      task.escalate ? null : new TrackedShell('bash', ['-l'], this.dataEvents, this.shellStreamingService), // Normal shell
      task.escalate ? new TrackedShell('pkexec', ['bash', '-l'], this.dataEvents, this.shellStreamingService) : null, // Escalated shell
    );

    try {
      await this.activeShells.startAll();
      this.currentTask.set(task);
      await this.internalExecuteTask(task, this.activeShells);
    } catch (error: unknown) {
      this.logger.error(`Task execution failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.currentTask.set(null);
      this.removeTask(task);
      if (this.activeShells) {
        await this.activeShells.stopAll();
        this.activeShells = null;
      }
      this.running.set(false);
      this.aborting.set(false);
      void this.configService.init(false);
    }
  }

  /**
   * Execute all tasks in the task list.
   */
  async executeTasks(): Promise<void> {
    if (this.running()) {
      this.logger.error('Task manager is already running a task');
      return;
    }
    this.running.set(true);
    this.clearTerminal();

    const needsNormal = this.tasks().some((task) => !task.escalate);
    const needsEscalated = this.tasks().some((task) => task.escalate);

    // Create persistent shells at the beginning of the entire task queue execution
    this.activeShells = new TrackedShells(
      needsNormal ? new TrackedShell('bash', ['-l'], this.dataEvents, this.shellStreamingService) : null,
      needsEscalated ? new TrackedShell('pkexec', ['bash', '-l'], this.dataEvents, this.shellStreamingService) : null,
    );

    try {
      await this.activeShells.startAll();
      for (const task of this.sortedTasks()) {
        if (this.aborting()) {
          break; // Stop if aborting is signaled
        }
        this.currentTask.set(task);
        try {
          await this.internalExecuteTask(task, this.activeShells);
        } catch (error: unknown) {
          this.logger.error(
            `Task execution failed for task ${task.name}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    } catch (error: unknown) {
      this.logger.error(
        `Error during shell startup or task execution: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      this.currentTask.set(null);
      this.tasks.set([]);
      if (this.activeShells) {
        await this.activeShells.stopAll();
        this.activeShells = null;
      }
      this.running.set(false);
      this.aborting.set(false);
      void this.configService.init(false);
    }
  }

  /**
   * Only print the generated bash scripts to terminal without running them.
   * Can be used to debug tasks and verify the generated scripts, as well as
   * ensure that the scripts are correctly formatted and free of errors.
   */
  async printScripts(): Promise<void> {
    this.clearTerminal();

    let first = true;
    for (const task of this.sortedTasks()) {
      if (!first) {
        this.dataEvents.emit(`${'_'.repeat(75)}\n`);
      }
      first = false;

      const emitting: string = `
        Name: ${this.translocoService.translate(task.name)}
        Escalate: ${task.escalate}
        Priority: ${task.priority}

        Script:
        ${task.script}
      `.replaceAll(/[^\S\n]{2,}/g, '');

      this.dataEvents.emit(emitting);
    }
  }
}
