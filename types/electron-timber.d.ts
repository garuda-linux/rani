declare module "electron-timber" {
  interface LoggerOptions {
    name?: string;
    ignore?: RegExp;
    logLevel?: "info" | "warn" | "error";
  }

  interface Logger {
    log(...values: any[]): void;
    warn(...values: any[]): void;
    error(...values: any[]): void;
    time(label: string): void;
    timeEnd(label: string): void;
    streamLog(stream: NodeJS.ReadableStream): void;
    streamWarn(stream: NodeJS.ReadableStream): void;
    streamError(stream: NodeJS.ReadableStream): void;
    create(options?: LoggerOptions): Logger;
    getDefaults(): LoggerOptions;
    setDefaults(options?: LoggerOptions): void;
  }

  const logger: Logger;
  export default logger;
}
