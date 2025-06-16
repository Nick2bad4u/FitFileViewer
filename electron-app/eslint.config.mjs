import js from "@eslint/js";
import globals from "globals";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";

export default defineConfig([
    { files: ["**/*.{js,mjs,cjs,ts}"], plugins: { js: js }, extends: ["js/recommended"] },
    // Merging browser and node globals to support environments where both are used, such as Electron.
    { files: ["**/*.{js,mjs,cjs,ts}"], languageOptions: { globals: { ...globals.browser, ...globals.node } } },
    {
        files: ["**/*.json"],
        plugins: { json },
        language: "json/json",
        extends: ["json/recommended"],
        rules: { "json/no-empty-keys": "off" },
    },
    { files: ["**/*.jsonc"], plugins: { json }, language: "json/jsonc", extends: ["json/recommended"] },
    { files: ["**/*.json5"], plugins: { json }, language: "json/json5", extends: ["json/recommended"] },
    { files: ["**/*.md"], plugins: { markdown }, language: "markdown/commonmark", extends: ["markdown/recommended"] },
    {
        files: ["**/*.css"],
        plugins: { css },
        language: "css/css",
        extends: ["css/recommended"],
        rules: {
            // Disabling 'css/no-important' because certain styles require the use of !important for overriding specificity issues.
            "css/no-important": "off",
            // Disabling 'css/use-baseline' as the project does not strictly adhere to a baseline grid system.
            "css/use-baseline": "off",
        },
    },
    {
        // Ignoring 'libs/**' as it contains third-party libraries that should not be modified.
        // Ignoring 'tests/**' as test files may follow different coding standards.
        // Ignoring 'electron-app/libs/**' as it contains Electron-specific libraries that are not linted.
        ignores: ["libs/**", "tests/**", "electron-app/libs/**"],
    },
]);
