import pkg from "./package.json" with { type: "json" };

/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration
 */
export default {
  compression: "normal",
  removePackageScripts: true,

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
  files: ["LICENSE*", pkg.main, "node_modules/**/*"],
};
