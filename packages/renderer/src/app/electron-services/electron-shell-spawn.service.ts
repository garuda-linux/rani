import { Injectable, inject, NgZone } from "@angular/core";
import { Logger } from "../logging/logging";
import {
  type ShellEvent,
  type ShellStreamingResult,
  type ElectronAPI,
} from "./electron-types";

// Re-export ShellStreamingResult for backward compatibility
export type { ShellStreamingResult };

// Options for the streaming spawn method
export interface ShellStreamingOptions {
  onStdout?: (data: string) => void;
  onStderr?: (data: string) => void;
  onClose?: (code: number | null, signal: string | null) => void;
  onError?: (error: Error) => void;
  cwd?: string;
  env?: Record<string, string>;
}

@Injectable({
  providedIn: "root",
})
export class ElectronShellSpawnService {
  private readonly logger = Logger.getInstance();
  private readonly electronAPI: ElectronAPI = window.electronAPI;

  // Map to store cleanup functions for each streamed process
  private cleanupFunctions = new Map<string, () => void>();

  constructor() {
    this.logger.debug("ElectronShellSpawnService constructor called.");
  }

  /**
   * Spawns a shell command with streaming stdout/stderr to callbacks.
   * This is designed for long-lived processes or processes where you need real-time output.
   *
   * @param command The command to execute (e.g., 'bash', 'pkexec').
   * @param args Arguments for the command.
   * @param options Callbacks for stdout, stderr, close, and error events.
   * @returns A Promise resolving to ShellStreamingResult containing processId and pid.
   */
  async spawnStreaming(
    command: string,
    args?: string[],
    options?: ShellStreamingOptions,
  ): Promise<ShellStreamingResult> {
    this.logger.debug(
      `Invoking spawnStreaming with command: ${command}, args: ${JSON.stringify(args)}`,
    );

    const result = await this.electronAPI.shell.spawnStreaming(command, args, {
      cwd: options?.cwd,
      env: options?.env,
    });
    const { processId, pid } = result;

    if (!processId) {
      const errorMessage = `Failed to spawn process for command: ${command}. No processId returned.`;
      this.logger.error(errorMessage);
      if (options?.onError) {
        //this.ngZone.run(() => options.onError(new Error(errorMessage)));
      }
      throw new Error(errorMessage);
    }

    this.logger.info(`Spawned process with ID: ${processId}, PID: ${pid}`);

    const cleanup = () => {
      // Remove listeners when the process is explicitly closed or ends
      this.electronAPI.events.off("shell:stdout", stdoutListener);
      this.electronAPI.events.off("shell:stderr", stderrListener);
      this.electronAPI.events.off("shell:close", closeListener);
      this.electronAPI.events.off("shell:error", errorListener);
      this.cleanupFunctions.delete(processId);
      this.logger.debug(`Cleaned up listeners for process ID: ${processId}`);
    };

    // Store the cleanup function
    this.cleanupFunctions.set(processId, cleanup);

    // Define listeners that run inside Angular's zone to ensure change detection
    const stdoutListener = (event: ShellEvent) => {
      if (event.processId !== processId) return;
      if (options?.onStdout && event.data) {
        options.onStdout(event.data);
      }
    };

    const stderrListener = (event: ShellEvent) => {
      if (event.processId !== processId) return;
      if (options?.onStderr && event.data) {
        options.onStderr(event.data);
      }
    };

    const closeListener = (event: ShellEvent) => {
      if (event.processId !== processId) return;
      this.logger.info(
        `Process ${event.processId} closed with code: ${event.code}, signal: ${event.signal}`,
      );
      if (options?.onClose) {
        options.onClose(event.code ?? null, event.signal ?? null);
      }
      // Perform cleanup when the process closes
      const cleanupFn = this.cleanupFunctions.get(event.processId);
      if (cleanupFn) {
        cleanupFn();
      }
    };

    const errorListener = (event: ShellEvent) => {
      if (event.processId !== processId) return;
      const errorMessage = event.error?.message ?? "Unknown error";
      this.logger.error(
        `Process ${event.processId} encountered error: ${errorMessage}`,
      );
      if (options?.onError) {
        options.onError(new Error(errorMessage));
      }
      // Perform cleanup on error as well
      const cleanupFn = this.cleanupFunctions.get(event.processId);
      if (cleanupFn) {
        cleanupFn();
      }
    };

    // Register listeners for this specific processId
    this.electronAPI.events.on("shell:stdout", stdoutListener);
    this.electronAPI.events.on("shell:stderr", stderrListener);
    this.electronAPI.events.on("shell:close", closeListener);
    this.electronAPI.events.on("shell:error", errorListener);

    return result;
  }

  /**
   * Writes data to the stdin of a spawned process.
   *
   * @param processId The ID of the process to write to.
   * @param data The string data to write.
   */
  async writeStdin(processId: string, data: string): Promise<void> {
    this.logger.debug(
      `Writing to stdin of process ${processId}: ${data.substring(0, 50)}...`,
    );
    await this.electronAPI.shell.writeStdin(processId, data);
  }

  /**
   * Kills a spawned process.
   *
   * @param processId The ID of the process to kill.
   * @param signal The signal to send (e.g., 'SIGTERM', 'SIGKILL').
   */
  async killProcess(processId: string, signal?: string): Promise<void> {
    this.logger.warn(
      `Killing process ${processId} with signal: ${signal || "SIGTERM"}`,
    );
    await this.electronAPI.shell.killProcess(processId, signal);

    // Immediately run cleanup after explicitly killing
    const cleanupFn = this.cleanupFunctions.get(processId);
    if (cleanupFn) {
      cleanupFn();
    }
  }

  /**
   * Executes a command and waits for it to complete, returning the result (stdout, stderr, code).
   * This is for one-off commands where you only care about the final output.
   *
   * @param command The command to execute.
   * @param args Arguments for the command.
   * @param options Optional record for additional options like cwd, env.
   * @returns A Promise resolving to an object containing stdout, stderr, and exit code.
   */
  async execute(
    command: string,
    args?: string[],
    options?: Record<string, unknown>,
  ): Promise<{
    stdout: string;
    stderr: string;
    code: number | null;
    signal: string | null;
  }> {
    this.logger.debug(
      `Executing one-off command: ${command} ${JSON.stringify(args)}`,
    );
    const result = await this.electronAPI.shell.execute(command, args, options);
    this.logger.debug(
      // @ts-ignore
      `One-off command ${command} finished with code: ${result.code}`,
    );
    return result as {
      stdout: string;
      stderr: string;
      code: number | null;
      signal: string | null;
    };
  }

  /**
   * Cleans up all active event listeners for shell processes.
   * Call this when your application is shutting down or if you want to ensure no stale listeners.
   */
  cleanupAllListeners(): void {
    this.logger.info("Cleaning up all shell process listeners.");
    this.cleanupFunctions.forEach((cleanup) => cleanup());
    this.cleanupFunctions.clear();
  }
}
