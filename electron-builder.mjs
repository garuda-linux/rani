import pkg from "./package.json" with { type: "json" };

/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration
 */
export default {
  productName: "Garuda Rani",
  appId: "org.garudalinux.rani",
  copyright: "GPLv3",

  //compression: "normal",
  removePackageScripts: true,

  directories: {
    output: "dist",
    buildResources: "buildResources",
  },

  generateUpdatesFilesForAllChannels: false,

  artifactName: "${productName}-${version}-${os}-${arch}.${ext}",
  files: ["LICENSE*", pkg.main, "node_modules/**/*"],
};
