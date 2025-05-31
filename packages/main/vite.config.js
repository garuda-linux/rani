import { getNodeMajorVersion } from "@app/electron-versions";
import { spawn } from "node:child_process";
import electronPath from "electron";
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

export default /**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
({
  build: {
    ssr: true,
    sourcemap: "inline",
    outDir: "dist",
    assetsDir: ".",
    target: `node${getNodeMajorVersion()}`,
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
      },
    },
    emptyOutDir: true,
    reportCompressedSize: false,
  },
  plugins: [copyAssets(), handleHotReload()],
});

/**
 * Copy assets from packages/main/assets to dist/assets
 * @return {import('vite').Plugin}
 */
function copyAssets() {
  return {
    name: "copy-assets",
    writeBundle() {
      try {
        const isDevMode = process.env.NODE_ENV === "development";
        if (isDevMode) {
          return;
        }

        // Copy assets directory to main package dist
        const srcAssetsDir = join(process.cwd(), "assets");
        const destAssetsDir = join(process.cwd(), "dist/assets");

        function copyDir(src, dest) {
          try {
            mkdirSync(dest, { recursive: true });
            const files = readdirSync(src, { withFileTypes: true });

            for (const file of files) {
              const srcPath = join(src, file.name);
              const destPath = join(dest, file.name);

              if (file.isDirectory()) {
                copyDir(srcPath, destPath);
              } else {
                copyFileSync(srcPath, destPath);
              }
            }
          } catch (error) {
            console.warn(`Could not copy ${src}:`, error.message);
          }
        }

        copyDir(srcAssetsDir, destAssetsDir);
        console.log("Assets copied to main package");
      } catch (error) {
        console.warn("Could not copy assets:", error.message);
      }
    },
  };
}

/**
 * Implement Electron app reload when some file was changed
 * @return {import('vite').Plugin}
 */
function handleHotReload() {
  /** @type {ChildProcess} */
  let electronApp = null;

  /** @type {import('vite').ViteDevServer|null} */
  let rendererWatchServer = null;

  return {
    name: "@app/main-process-hot-reload",

    config(config, env) {
      if (env.mode !== "development") {
        return;
      }

      const rendererWatchServerProvider = config.plugins.find(
        (p) => p.name === "@app/renderer-watch-server-provider",
      );
      if (!rendererWatchServerProvider) {
        throw new Error("Renderer watch server provider not found");
      }

      rendererWatchServer =
        rendererWatchServerProvider.api.provideRendererWatchServer();

      process.env.VITE_DEV_SERVER_URL =
        rendererWatchServer.resolvedUrls.local[0];

      return {
        build: {
          watch: {},
        },
      };
    },

    writeBundle() {
      if (process.env.NODE_ENV !== "development") {
        return;
      }

      /** Kill electron if a process already exists */
      if (electronApp !== null) {
        electronApp.removeListener("exit", process.exit);
        electronApp.kill("SIGINT");
        electronApp = null;
      }

      /** Spawn a new electron process */
      electronApp = spawn(String(electronPath), ["--inspect", "."], {
        stdio: "inherit",
      });

      /** Stops the watch script when the application has been quit */
      electronApp.addListener("exit", process.exit);
    },
  };
}
