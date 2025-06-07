import pkg from "./package.json" with { type: "json" };

/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration
 */
export default {
  productName: "garuda-rani",
  appId: "org.garudalinux.rani",
  copyright: "GPL-3.0",

  compression: "normal",
  removePackageScripts: true,

  directories: {
    output: "dist",
    buildResources: "buildResources",
  },

  linux: {
    target: ["AppImage", "pacman"],
  },

  generateUpdatesFilesForAllChannels: false,

  artifactName: "${productName}-${version}-${os}-${arch}.${ext}",
  files: [
    "LICENSE*",
    pkg.main,
    "!node_modules/@app/**",
    ...(await getListOfFilesFromEachWorkspace()),
  ],
};

async function getListOfFilesFromEachWorkspace() {
  /**
   * @type {Map<string, string>}
   */
  const workspaces = await mapWorkspaces({
    cwd: process.cwd(),
    pkg,
  });

  const allFilesToInclude = [];

  for (const [name, path] of workspaces) {
    const pkgPath = join(path, "package.json");
    const { default: workspacePkg } = await import(pathToFileURL(pkgPath), {
      with: { type: "json" },
    });

    let patterns = workspacePkg.files || ["dist/**", "package.json"];

    patterns = patterns.map((p) => join("node_modules", name, p));
    allFilesToInclude.push(...patterns);
  }

  return allFilesToInclude;
}
