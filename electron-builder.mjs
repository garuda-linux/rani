import pkg from "./package.json" with { type: "json" };
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { readdir } from "node:fs/promises";
import { getNodeModules } from "node-module-collector";

/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration
 */
export default {
  compression: "normal",
  removePackageScripts: true,

  npmRebuild: false,
  buildDependenciesFromSource: false,
  nodeGypRebuild: false,

  directories: {
    output: "dist",
    buildResources: "buildResources",
  },
  electronDist: "/usr/lib/electron36",
  electronVersion: "36.2.1",
  generateUpdatesFilesForAllChannels: false,
  linux: {
    target: ["pacman"],
  },
  /**
   * It is recommended to avoid using non-standard characters such as spaces in artifact names,
   * as they can unpredictably change during deployment, making them impossible to locate and download for update.
   */
  artifactName: "${productName}-${version}-${os}-${arch}.${ext}",
  files: getListOfFilesFromEachWorkspace(),
};

/**
 * By default, electron-builder copies each package into the output compilation entirety,
 * including the source code, tests, configuration, assets, and any other files.
 *
 * So you may get compiled app structure like this:
 * ```
 * app/
 * ├── node_modules/
 * │   └── workspace-packages/
 * │       ├── package-a/
 * │       │   ├── src/            # Garbage. May be safely removed
 * │       │   ├── dist/
 * │       │   │   └── index.js    # Runtime code
 * │       │   ├── vite.config.js  # Garbage
 * │       │   ├── .env            # some sensitive config
 * │       │   └── package.json
 * │       ├── package-b/
 * │       ├── package-c/
 * │       └── package-d/
 * ├── packages/
 * │   └── entry-point.js
 * └── package.json
 * ```
 *
 * To prevent this, we read the “files”
 * property from each package's package.json
 * and add all files that do not match the patterns to the exclusion list.
 *
 * This way,
 * each package independently determines which files will be included in the final compilation and which will not.
 *
 * So if `package-a` in its `package.json` describes
 * ```json
 * {
 *   "name": "package-a",
 *   "files": [
 *     "dist/**\/"
 *   ]
 * }
 * ```
 *
 * Then in the compilation only those files and `package.json` will be included:
 * ```
 * app/
 * ├── node_modules/
 * │   └── workspace-packages/
 * │       ├── package-a/
 * │       │   ├── dist/
 * │       │   │   └── index.js    # Runtime code
 * │       │   └── package.json
 * │       ├── package-b/
 * │       ├── package-c/
 * │       └── package-d/
 * ├── packages/
 * │   └── entry-point.js
 * └── package.json
 * ```
 */
async function getListOfFilesFromEachWorkspace() {
  const allWorkspaces = await getDirectories("packages");
  const allFilesToInclude = [];
  for (const project of allWorkspaces) {
    const pkgPath = join("packages", project, "package.json");
    const { default: workspacePkg } = await import(pathToFileURL(pkgPath), {
      with: { type: "json" },
    });

    let patterns = workspacePkg.files || ["dist/**", "package.json"];
    if (project === "renderer") {
      patterns = ["dist/client/**", "package.json"];
    }
    patterns = patterns.map((p) => join("node_modules", `@app/${project}`, p));
    allFilesToInclude.push(...patterns);
  }

  console.log(allFilesToInclude);
  return allFilesToInclude;
}

async function getDirectories(srcPath) {
  const entries = await readdir(srcPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}
