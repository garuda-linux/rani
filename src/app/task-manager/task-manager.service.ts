import { computed, EventEmitter, Injectable, signal } from '@angular/core';
import { Child, ChildProcess, Command } from '@tauri-apps/plugin-shell';
import { Logger } from '../logging/logging';
import { exists, writeTextFile } from '@tauri-apps/plugin-fs';
import { appLocalDataDir, resolve } from '@tauri-apps/api/path';

class Task {
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

class TrackedShell {
  constructor(shell: Command<string>, outputs: EventEmitter<string>) {
    this.shell = shell;

    shell.stdout.on('data', (data) => outputs.emit(data));
    shell.stderr.on('data', (data) => outputs.emit(data));

    shell.once('close', () => {
      this.running = false;
    });
  }

  async process() {
    if (this._process === null) {
      this._process = await this.shell.spawn();
    }
    return this._process;
  }

  async stop() {
    if (this._process !== null) {
      await this._process.write(`
        exit 0
      `);
      // Wait until stopped
      while (this.running) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }

  shell: Command<string>;
  private _process: Child | null = null;
  running: boolean = true;
}

class TrackedShells {
  constructor(normal: TrackedShell | null, escalated: TrackedShell | null) {
    this.escalated = escalated;
    this.normal = normal;
  }

  async stop() {
    const promises: Promise<void>[] = [];
    if (this.escalated !== null) {
      promises.push(this.escalated.stop());
    }
    if (this.normal !== null) {
      promises.push(this.normal.stop());
    }
    await Promise.all(promises);
  }

  escalated: TrackedShell | null;
  normal: TrackedShell | null;
}

// Task manager keeps track of scheduled tasks as well as tasks that are executed now.
@Injectable({
  providedIn: 'root',
})
export class TaskManagerService {
  private readonly logger = Logger.getInstance();

  readonly tasks = signal<Task[]>([]);
  readonly sortedTasks = computed(() => [...this.tasks()].sort((a, b) => a.priority - b.priority));
  readonly currentTask = signal<Task | null>(null);
  readonly running = signal<boolean>(false);
  readonly aborting = signal<boolean>(false);
  readonly count = computed(() => this.tasks().length);

  // progress can be null when currentTask is null. If currentTask is not in sortedList, currentIndex is 1. In all other cases, currentIndex is the index of currentTask in sortedList.
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
  data: string = '';

  constructor() {
    this.dataEvents.subscribe((data) => {
      this.data += data;
    });
  }

  /**
   * Execute a bash scriptlet using basic bash and wait for it to finish.
   * @param script The bash scriptlet to execute
   */
  async executeAndWaitBash(script: string): Promise<ChildProcess<string>> {
    try {
      this.logger.info('Executing bash code: ' + script);
      return await Command.create('exec-bash', ['-c', script]).execute();
    } catch (error) {
      this.logger.error('Unexpected error while executing bash script: ' + error);
      return {
        code: 1,
        stdout: '',
        stderr: '',
        signal: null,
      };
    }
  }

  /**
   * Execute a bash script in a terminal using garuda-libs and wait for it to finish.
   * @param script The bash scriptlet to execute in the terminal.
   */
  async executeAndWaitBashTerminal(script: string): Promise<void> {
    try {
      this.logger.info('Executing bash code in terminal: ' + script);
      await Command.create('launch-terminal', [script]).spawn();
    } catch (error) {
      this.logger.error('Unexpected error while executing bash script in terminal: ' + error);
    }
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
   * Create requested shells and return them.
   * @param normal Whether to create a normal shell or not.
   * @param escalated Whether to create an escalated shell or not.
   */
  private async createShells(normal: boolean, escalated: boolean): Promise<TrackedShells> {
    const shell_normal: Command<string> | null = normal ? Command.create('bash', []) : null;
    const shell_escalated: Command<string> | null = escalated ? Command.create('root-bash', ['bash']) : null;

    return new TrackedShells(
      shell_normal ? new TrackedShell(shell_normal, this.dataEvents) : null,
      shell_escalated ? new TrackedShell(shell_escalated, this.dataEvents) : null,
    );
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
  clearTerminal(content: string = ''): void {
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
      this.logger.error('Abort attempted while not running.');
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
    this.logger.info('Executing task: ' + task.script);

    const shell = (task.escalate ? shells.escalated : shells.normal)!;

    const path = await resolve(await appLocalDataDir(), 'taskscript.tmp');

    // Safety check, make sure path does not contain '
    if (path.includes("'")) {
      this.logger.error('Path contains unsafe character: ' + path);
      return;
    }

    // Write script to a temporary file
    const script = task.script.trim();
    await writeTextFile(path, script);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(script));
    // hex encoding
    const hash = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Execute the script with extra safeguards
    await (
      await shell.process()
    ).write(`
      # Read file into variable
      script=$(<'${path}')
      # Check if the script is the same as the one we wrote
      if [ "$(printf '%s' "$script" | sha256sum | cut -d ' ' -f 1)" != "${hash}" ]; then
        echo "Script has been tampered with, refusing to execute"
        # This is bad enough to end the entire shell
        exit 1
      fi
      # Execute the script
      bash /dev/stdin <<< "$script"
      rm '${path}'
    `);

    // Wait until the file is deleted
    while ((await exists(path)) && shell.running) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.logger.info('Task has finished.');
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

    const shells = await this.createShells(!task.escalate, task.escalate);
    this.currentTask.set(task);
    await this.internalExecuteTask(task, shells);
    this.currentTask.set(null);
    this.removeTask(task);

    await shells.stop();

    this.running.set(false);
    this.aborting.set(false);
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
    const shells = await this.createShells(needsNormal, needsEscalated);

    // Execute tasks in correct order
    for (const task of this.sortedTasks()) {
      if (this.aborting()) {
        break;
      }
      this.currentTask.set(task);
      await this.internalExecuteTask(task, shells);
    }
    this.currentTask.set(null);
    this.tasks.set([]);

    await shells.stop();

    this.running.set(false);
    this.aborting.set(false);
  }
}
