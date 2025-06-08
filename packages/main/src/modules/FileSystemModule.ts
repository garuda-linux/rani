import type { AppModule } from "../AppModule.js";
import type { ModuleContext } from "../ModuleContext.js";
import { App, ipcMain } from "electron";
import { access, readFile, writeFile, stat, mkdir, unlink } from "fs/promises";
import { join, normalize } from "node:path";
import { F_OK } from "node:constants";
import { Logger } from "../logging/logging.js";

class FileSystemModule implements AppModule {
  private app: App | null = null;
  private readonly logger = Logger.getInstance();

  enable({ app }: ModuleContext): void {
    this.app = app;
    this.setupFileSystemHandlers();
  }

  private setupFileSystemHandlers(): void {
    const validateFilePath = (filePath: string): boolean => {
      // Prevent path traversal attacks
      const normalizedPath = normalize(filePath);

      // Get app resource paths
      const appPath = this.app!.getAppPath();
      const resourcesPath = process.resourcesPath || join(appPath, "..");

      const allowedDirs = [
        this.app!.getPath("userData"),
        this.app!.getPath("appData"),
        this.app!.getPath("temp"),
        this.app!.getPath("home"),
        appPath, // Allow reading from app bundle
        resourcesPath, // Allow reading from resources directory
        "/etc",
        "/usr",
        "/var",
        "/boot",
        "/proc",
      ];

      return (
        allowedDirs.some((dir) => normalizedPath.startsWith(dir)) &&
        !normalizedPath.includes("..") &&
        !normalizedPath.includes("~")
      );
    };

    ipcMain.handle("fs:exists", async (_, filePath: string) => {
      try {
        if (!validateFilePath(filePath)) {
          throw new Error("Invalid file path");
        }
        await access(filePath);
        return true;
      } catch {
        return false;
      }
    });

    ipcMain.handle("fs:readTextFile", async (_, filePath: string) => {
      try {
        if (!validateFilePath(filePath)) {
          throw new Error("Invalid file path");
        }

        try {
          await access(filePath, F_OK);
        } catch {
          throw new Error(`File not found: ${filePath}`);
        }

        const stats = await stat(filePath);
        if (stats.size > 10 * 1024 * 1024) {
          throw new Error("File too large");
        }

        const content: string = await readFile(filePath, "utf-8");
        if (content === null || content === undefined) {
          throw new Error("File content is null or undefined");
        }

        return content;
      } catch (error) {
        this.logger.error(
          `File read error: ${error instanceof Error ? error.message : String(error)}`,
        );

        // Provide more specific error messages
        if (error instanceof Error) {
          const nodeError = error as NodeJS.ErrnoException;
          if (nodeError.code === "ENOENT") {
            throw new Error(`File not found: ${filePath}`);
          }
          if (nodeError.code === "EACCES") {
            throw new Error(`Permission denied: ${filePath}`);
          }
          if (nodeError.code === "EISDIR") {
            throw new Error(`Path is a directory, not a file: ${filePath}`);
          }
          throw new Error(`Failed to read file: ${error.message}`);
        }
        throw new Error(`Failed to read file: ${error}`);
      }
    });

    ipcMain.handle(
      "fs:writeTextFile",
      async (_, filePath: string, contents: string) => {
        try {
          if (!validateFilePath(filePath)) {
            throw new Error("Invalid file path");
          }
          if (contents.length > 10 * 1024 * 1024) {
            // 10MB limit
            throw new Error("Content too large");
          }
          await writeFile(filePath, contents, "utf-8");
          return true;
        } catch (error) {
          this.logger.error(
            `File write error: ${error instanceof Error ? error.message : String(error)}`,
          );
          throw new Error(
            `Failed to write file: ${error instanceof Error ? error.message : error}`,
          );
        }
      },
    );

    ipcMain.handle("fs:createDirectory", async (_, dirPath: string) => {
      try {
        if (!validateFilePath(dirPath)) {
          throw new Error("Invalid directory path");
        }
        await mkdir(dirPath, { recursive: true });
        return true;
      } catch (error) {
        this.logger.error(
          `Directory creation error: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw new Error(
          `Failed to create directory: ${error instanceof Error ? error.message : error}`,
        );
      }
    });

    ipcMain.handle("fs:removeFile", async (_, filePath: string) => {
      try {
        if (!validateFilePath(filePath)) {
          throw new Error("Invalid file path");
        }
        await unlink(filePath);
        return true;
      } catch (error) {
        this.logger.error(
          `File removal error: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw new Error(
          `Failed to remove file: ${error instanceof Error ? error.message : error}`,
        );
      }
    });
  }
}

export function createFileSystemModule() {
  return new FileSystemModule();
}
