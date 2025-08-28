import js from "@eslint/js";
import globals from "globals";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";

// NOTE: The project currently has residual references to @typescript-eslint rules in built JS (dist) files.
// We are not linting TypeScript specifically here; to suppress missing rule errors inside generated dist files,
// we ensure those files are ignored (see ignores below). If future TS linting is needed, add:
// import tseslint from 'typescript-eslint'; and extend its configs.

export default defineConfig([
        { files: ["**/*.{js,mjs,cjs,ts}"], plugins: { js: js }, extends: ["js/recommended"],
            rules: {
                // Allow intentionally unused parameters prefixed with underscore (common for Electron event placeholders)
                "no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
            }
        },
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
            // Project uses gradients, custom properties, and utility patterns that the strict property validator flags.
            // Disable for now to prioritize JS lint health; revisit with a tailored allowlist if needed.
            "css/no-invalid-properties": "off",
            // Allow id selectors/universal selectors given existing stylesheet structure.
            "css/no-id-selectors": "off",
            "css/no-universal-selectors": "off",
            // Allow empty blocks (sometimes placeholder for theming) to reduce noise.
            "css/no-empty-blocks": "off",
        },
    },
    {
        // Ignore third-party and generated output directories
        ignores: [
            "libs/**",
            "tests/**",
            "electron-app/libs/**",
            "**/node_modules/**",
            "dist/**", // built output (contains many vendor + d.ts artifacts not meant for linting)
            "**/*.d.ts", // skip type declaration files (parsed as JS currently)
        ],
    },
]);
