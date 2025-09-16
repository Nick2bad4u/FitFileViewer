import js from "@eslint/js";
import globals from "globals";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";
import tsEslintPlugin from "@typescript-eslint/eslint-plugin";
import { defineConfig } from "eslint/config";

// NOTE: The project currently has residual references to @typescript-eslint rules in built JS (dist) files.
// We are not linting TypeScript specifically here; to suppress missing rule errors inside generated dist files,
// We ensure those files are ignored (see ignores below). If future TS linting is needed, add:
// Import tseslint from 'typescript-eslint'; and extend its configs.

export default defineConfig([
    {
        files: ["**/*.{js,mjs,cjs,ts}"],
        plugins: { js, "@typescript-eslint": tsEslintPlugin },
        // Use the sane defaults instead of the extremely strict "all" ruleset.
        // This aligns with common practice and reduces noisy stylistic errors
        // while keeping correctness-focused rules.
        extends: ["js/recommended"],
        rules: {
            // Allow intentionally unused parameters prefixed with underscore (common for Electron event placeholders)
            // Keep as a warning to avoid blocking CI while still surfacing issues.
            "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
            // Some files refer to globals provided at runtime (Electron preload, injected helpers in tests)
            // Keep as a warning for now to reduce noise until refactors add explicit imports.
            "no-undef": "warn",
            // Allow console usage in Electron (renderer/main) – retain as a warning for visibility
            "no-console": "off",
            // Project contains intentional placeholder blocks and try/catch boundaries; warn instead of error
            "no-empty": "warn",
            "no-useless-catch": "warn",
            // Allow temporary assignments used in mocks/dev utilities without failing the build
            "no-global-assign": "warn",
            // These rules are overly restrictive for this codebase; disable to reduce noise
            "no-ternary": "off",
            "sort-keys": "off",
            "sort-vars": "off",
            "one-var": "off",
            "func-style": "off",
            "id-length": "off",
            "no-inline-comments": "off",
            // Complexity/size limits are not enforced right now; revisit later with targeted refactors
            "max-lines": "off",
            "max-lines-per-function": "off",
            "max-statements": "off",
            "complexity": "off",
        },
    },
    // Merging browser and node globals to support environments where both are used, such as Electron.
    {
        files: ["**/*.{js,mjs,cjs,ts}"],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                // Test helpers injected by Vitest or test harness shims
                __vitest_effective_document__: "readonly",
                __vitest_effective_stateManager__: "readonly",
            },
        },
    },
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
            // Generated/minified HTML assets and bundles
            "html/**",
            "**/node_modules/**",
            "dist/**", // Built output (contains many vendor + d.ts artifacts not meant for linting)
            "**/*.d.ts", // Skip type declaration files (parsed as JS currently)
            // Generated reports and coverage outputs
            "coverage/**",
            "coverage-*/**",
            "coverage-report.json",
            // Jest/Vitest/Electron mocks
            "__mocks__/**",
        ],
    },
]);
