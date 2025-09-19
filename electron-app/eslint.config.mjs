import css from "@eslint/css";
import js from "@eslint/js";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import nodePlugin from "eslint-plugin-n";
import perfectionist from "eslint-plugin-perfectionist";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import { defineConfig } from "eslint/config";
import globals from "globals";

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
            // Additional noise reduction rules
            "sort-imports": "off", // Conflict with perfectionist/sort-imports, prefer perfectionist
            "no-underscore-dangle": "off", // Allow underscore prefixes for private properties and test globals
            "no-use-before-define": ["warn", { functions: false, classes: false }], // Allow function hoisting
            "max-params": "off", // Allow functions with many parameters for now
            "no-continue": "off", // Continue statements are fine
            "no-plusplus": "off", // Allow ++ and -- operators
            "require-await": "off", // Many async functions don't require await
            "class-methods-use-this": "off", // Class methods don't always need to use this
            "camelcase": ["warn", { allow: ["^[a-z]+(_[a-z0-9]+)*$"] }], // Allow snake_case for certain patterns
            "capitalized-comments": "off", // Comments don't need to be capitalized
            "func-names": "off", // Allow anonymous functions
            "no-param-reassign": "off", // Allow parameter reassignment
            "no-undefined": "off", // Allow explicit undefined usage
            "no-eq-null": "off", // Allow == null checks
            "eqeqeq": ["warn", "smart"], // Allow smart equality checks
            "prefer-destructuring": "warn", // Encourage but don't require destructuring
            "no-shadow": "warn", // Warn about variable shadowing
            "consistent-return": "off", // Allow inconsistent returns
            "default-case": "off", // Switch statements don't always need default case
            "no-fallthrough": "warn", // Warn about switch fallthrough
            "no-alert": "warn", // Warn about alert usage but don't error
            "prefer-const": "warn", // Warn about let that could be const
            "no-var": "warn", // Warn about var usage
            "prefer-arrow-callback": "off", // Don't require arrow functions
            "object-shorthand": "off", // Don't require object shorthand
            "prefer-template": "off", // Don't require template literals
            "no-lonely-if": "off", // Allow lonely if statements
            "no-negated-condition": "off", // Allow negated conditions
            "no-nested-ternary": "off", // Allow nested ternary operators
            "no-unneeded-ternary": "off", // Allow unneeded ternary operators
            "prefer-rest-params": "warn", // Encourage rest params over arguments
            // Additional round of noise reduction
            "max-depth": "off", // Allow deeply nested blocks
            "init-declarations": "off", // Allow uninitialized variable declarations
            "require-unicode-regexp": "off", // Don't require unicode flag on regexes
            "prefer-named-capture-group": "off", // Don't require named capture groups
            "no-useless-assignment": "off", // Allow assignments that might seem useless
            "no-empty-function": "off", // Allow empty functions (placeholders, overrides)
            "preserve-caught-error": "off", // Allow throwing new errors without preserving original
            "new-cap": ["warn", { capIsNewExceptions: ["DataTable"] }], // Warn about constructor capitalization
            "no-await-in-loop": "warn", // Warn about await in loops
            "array-callback-return": "warn", // Warn about missing returns in array callbacks
            "require-atomic-updates": "off", // Turn off race condition warnings
            "no-multi-assign": "off", // Allow chained assignment
            "no-lone-blocks": "off", // Allow lone blocks
            "no-useless-constructor": "off", // Allow empty constructors
            "no-loop-func": "warn", // Warn about functions in loops
            "radix": "off", // Don't require radix parameter for parseInt
            "no-bitwise": "off", // Allow bitwise operators
            "prefer-spread": "warn", // Encourage spread operator
            "unicorn/no-useless-switch-case": "off", // Allow useless switch cases
            "unicorn/no-array-reverse": "off", // Allow array reverse
            "unicorn/prefer-code-point": "off", // Allow String.fromCharCode
            "unicorn/text-encoding-identifier-case": "off", // Allow utf-8 vs utf8
            "no-unused-expressions": "off", // Allow expressions statements (useful for debugging)
            "no-duplicate-imports": "off", // Allow duplicate imports for different purposes
            "unicorn/no-empty-file": "off", // Allow empty files (placeholders)
            "unicorn/consistent-destructuring": "off", // Don't require consistent destructuring
            "unicorn/no-await-expression-member": "off", // Allow await expression member access
            "n/no-top-level-await": "off", // Allow top-level await
            "css/font-family-fallbacks": "off", // Don't require font fallbacks in CSS
            "consistent-this": "off", // Allow any name for this alias
            "default-param-last": "warn", // Warn about default parameters not being last
            "max-classes-per-file": "off", // Allow multiple classes per file
            "unicorn/error-message": "off", // Allow Error() without message
            "unicorn/no-array-callback-reference": "off", // Allow direct function references in array callbacks
            "unicorn/no-new-array": "off", // Allow new Array()
            "no-implicit-globals": "warn", // Warn about implicit globals
            "no-invalid-this": "warn", // Warn about invalid this usage
            "n/no-deprecated-api": "warn", // Warn about deprecated APIs
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
            "unicorn/no-keyword-prefix": "off", // Allow variables starting with keywords like new, class
            "unicorn/prefer-query-selector": "off", // Allow getElementById usage
            "unicorn/consistent-function-scoping": "off", // Allow nested function declarations
            "unicorn/no-this-assignment": "off", // Allow this assignment patterns
            "unicorn/prefer-ternary": "off", // Don't require ternary over if statements
            "unicorn/prefer-spread": "off", // Don't require spread over slice/split
            "unicorn/explicit-length-check": "off", // Allow .length checks
            "unicorn/prefer-number-properties": "off", // Allow global Number methods
            "unicorn/no-array-sort": "off", // Allow Array.sort() usage
            "unicorn/prefer-structured-clone": "off", // Allow JSON.parse(JSON.stringify()) patterns
            "unicorn/prefer-dom-node-remove": "off", // Allow parentNode.removeChild()
            "unicorn/prefer-add-event-listener": "off", // Allow onclick and similar patterns
            "unicorn/prefer-blob-reading-methods": "off", // Allow FileReader patterns
            "unicorn/prefer-default-parameters": "off", // Allow parameter reassignment patterns
            "unicorn/no-unused-properties": "off", // Allow unused object properties

            // Node plugin adjustments to avoid false positives in Electron/bundled context
            "n/no-missing-import": "off",
            "n/no-missing-require": "off",
            "n/no-extraneous-import": "off",
            "n/no-extraneous-require": "off",
            "n/no-unpublished-import": "off", // Allow importing dev dependencies
            "n/no-unpublished-require": "off", // Allow requiring dev dependencies
            "n/no-process-exit": "warn",
            "n/no-process-env": "off", // Allow process.env usage in Electron
            "n/no-unsupported-features/es-builtins": "off",
            "n/no-unsupported-features/es-syntax": "off",
            "n/no-unsupported-features/node-builtins": "off",
            "n/no-sync": "off", // Allow sync fs methods in scripts and setup code
            "n/global-require": "off", // Allow require() in functions
            "n/no-mixed-requires": "off", // Allow mixing require and other declarations
            "n/callback-return": "off", // Don't enforce callback returns
            "n/no-deprecated-api": "warn", // Warn about deprecated Node.js APIs
            "n/prefer-global/buffer": "off", // Allow require('buffer').Buffer
            "n/prefer-promises/fs": "off", // Allow sync fs methods

            // Perfectionist: start as warnings to avoid blocking adoption
            "perfectionist/sort-imports": "warn",
            "perfectionist/sort-named-imports": "warn",
            "perfectionist/sort-named-exports": "warn",
            "perfectionist/sort-objects": "off", // Too noisy for existing codebase
            "perfectionist/sort-variable-declarations": "off",
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
        ignores: ["**/tsconfig*.json"],  // Exclude TypeScript config files (they use JSONC format)
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
            "**/*.test.ts", // Skip TypeScript test files (no TS parser configured)
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
