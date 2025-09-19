import js from "@eslint/js";
import globals from "globals";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import nodePlugin from "eslint-plugin-n";
import perfectionist from "eslint-plugin-perfectionist";
import eslintConfigPrettier from "eslint-config-prettier/flat";

// NOTE: We are not enabling TypeScript-specific ESLint rules in this flat config.
// If future TS linting is needed, bring in typescript-eslint and extend its configs.

export default defineConfig([
    {
        files: ["**/*.{js,mjs,cjs,ts}"],
        plugins: { js },
        // Use the sane defaults instead of the extremely strict "all" ruleset.
        // This aligns with common practice and reduces noisy stylistic errors
        // while keeping correctness-focused rules.
        extends: ["js/all"],
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
            "no-magic-numbers": "off",
            // Complexity/size limits are not enforced right now; revisit later with targeted refactors
            "max-lines": "off",
            "max-lines-per-function": "off",
            "max-statements": "off",
            "complexity": "off",
        },
    },
    // Apply strict rule-sets from Unicorn, Node (n), and Perfectionist, scoped to JS/TS only to avoid
    // running JS rules on JSON/Markdown/CSS which can cause parser/sourceCode mismatches.
    { ...eslintPluginUnicorn.configs.all, files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
    { ...nodePlugin.configs["flat/all"], files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
    { ...perfectionist.configs["recommended-natural"], files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
    {
        files: ["**/*.{js,mjs,cjs,ts}", "**/*.jsx", "**/*.tsx"],
        rules: {
            // Electron/CommonJS friendly adjustments
            "unicorn/prefer-module": "off", // Project uses CommonJS entrypoints
            "unicorn/no-null": "off", // Codebase uses null intentionally in places
            "unicorn/prevent-abbreviations": "off", // Allow common abbreviations (ctx, env, etc.)
            "unicorn/no-array-reduce": "off", // Allow Array#reduce when appropriate
            "unicorn/filename-case": "off", // Preserve existing filenames
            "unicorn/prefer-node-protocol": "warn", // Encourage gradually
            "unicorn/import-style": "off",
            "unicorn/prefer-event-target": "off", // Node/Electron often uses EventEmitter
            "unicorn/prefer-top-level-await": "off", // Not always viable in CJS/Electron context

            // Node plugin adjustments to avoid false positives in Electron/bundled context
            "n/no-missing-import": "off",
            "n/no-missing-require": "off",
            "n/no-extraneous-import": "off",
            "n/no-extraneous-require": "off",
            "n/no-process-exit": "warn",
            "n/no-unsupported-features/es-builtins": "off",
            "n/no-unsupported-features/es-syntax": "off",
            "n/no-unsupported-features/node-builtins": "off",
            "n/no-sync": "off", // Allow sync fs methods in scripts and setup code

            // Perfectionist: start as warnings to avoid blocking adoption
            "perfectionist/sort-imports": "warn",
            "perfectionist/sort-named-imports": "warn",
            "perfectionist/sort-named-exports": "warn",
            "perfectionist/sort-objects": "warn",
            "perfectionist/sort-variable-declarations": "warn",
            "perfectionist/sort-interfaces": "warn",
            "perfectionist/sort-union-types": "warn",
            "perfectionist/sort-enums": "warn",
            "perfectionist/sort-classes": "warn",
            "perfectionist/sort-jsx-props": "warn",
            "perfectionist/sort-sets": "warn",
            "perfectionist/sort-maps": "warn",
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
            sourceType: "module", // Parse .js files as ES modules to allow import/export syntax
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
    // Place Prettier last to turn off rules that conflict with Prettier formatting
    eslintConfigPrettier,
]);
