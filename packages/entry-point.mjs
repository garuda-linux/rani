import { initApp } from "@app/main";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

function showAndExit(...args) {
  console.error(...args);
  process.exit(1);
}

// Always handle uncaught exceptions in production
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  if (
    process.env.NODE_ENV === "development" ||
    process.env.PLAYWRIGHT_TEST === "true" ||
    !!process.env.CI
  ) {
    showAndExit("Uncaught Exception:", error);
  }
});

// Handle unhandled promise rejections gracefully
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  if (
    process.env.NODE_ENV === "development" ||
    process.env.PLAYWRIGHT_TEST === "true" ||
    !!process.env.CI
  ) {
    showAndExit("Unhandled Rejection:", promise, "reason:", reason);
  }
});

/**
 * We resolve '@app/renderer' and '@app/preload'
 * here and not in '@app/main'
 * to observe good practices of modular design.
 * This allows fewer dependencies and better separation of concerns in '@app/main'.
 * Thus,
 * the main module remains simplistic and efficient
 * as it receives initialization instructions rather than direct module imports.
 */
async function startApp() {
  try {
    await initApp({
      renderer:
        process.env.MODE === "development" && !!process.env.VITE_DEV_SERVER_URL
          ? new URL(process.env.VITE_DEV_SERVER_URL)
          : {
              path: join(
                dirname(
                  fileURLToPath(
                    import.meta.resolve("@app/renderer/package.json"),
                  ),
                ),
                "dist",
                "index.html",
              ),
            },

      preload: {
        path: fileURLToPath(import.meta.resolve("@app/preload/exposed.mjs")),
      },
    });
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

startApp();
