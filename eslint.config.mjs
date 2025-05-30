import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfig from "@electron-toolkit/eslint-config";
import oxlint from "eslint-plugin-oxlint";

export default tseslint.config(
  {
    // config with just ignores is the replacement for `.eslintignore`
    ignores: ["**/build/**", "**/dist/**", "node_modules"],
  },
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      eslintConfig,
      tseslint.configs.strict,
      tseslint.configs.stylistic,
    ],
  },
  {
    files: ["**/*.html"],
    rules: {},
  },
  tseslint.configs.recommended,
  ...oxlint.buildFromOxlintConfigFile(".oxlintrc.json"),
);
