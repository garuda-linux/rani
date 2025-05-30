/**
 * @since 2.0.0
 */
export interface SpawnOptions {
  /** Current working directory. */
  cwd?: string;
  /** Environment variables. set to `null` to clear the process env. */
  env?: Record<string, string>;
  /**
   * Character encoding for stdout/stderr
   *
   * @since 2.0.0
   *  */
  encoding?: string;
}

/**
 * @since 2.0.0
 */
export interface ChildProcess<O extends IOPayload> {
  /** Exit code of the process. `null` if the process was terminated by a signal on Unix. */
  code: number | null;
  /** If the process was terminated by a signal, represents that signal. */
  signal: number | null;
  /** The data that the process wrote to `stdout`. */
  stdout: O;
  /** The data that the process wrote to `stderr`. */
  stderr: O;
}

/**
 * @since 2.0.0
 */
export interface Child {
  /** The child process `pid`. */
  pid: number;
  /** Kill function to terminate the process */
  kill: () => void;
  /** stdout stream */
  stdout: any;
  /** stderr stream */
  stderr: any;
}

export interface CommandEvents {
  close: TerminatedPayload;
  error: string;
}

export interface OutputEvents<O extends IOPayload> {
  data: O;
}

/**
 * Payload for the `Terminated` command event.
 */
export interface TerminatedPayload {
  /** Exit code of the process. `null` if the process was terminated by a signal on Unix. */
  code: number | null;
  /** If the process was terminated by a signal, represents that signal. */
  signal: number | null;
}

/** Event payload type */
export type IOPayload = string | Uint8Array;

export interface CommandResult {
  code: number | null;
  stdout: string;
  stderr: string;
  success: boolean;
}
