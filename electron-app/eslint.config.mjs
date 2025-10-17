import eslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import css from "@eslint/css";
import js from "@eslint/js";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import pluginArrayFunc from "eslint-plugin-array-func";
import pluginCommentLength from "eslint-plugin-comment-length";
import pluginEx from "eslint-plugin-ex";
import importXPlugin from "eslint-plugin-import-x";
import jsxA11y from "eslint-plugin-jsx-a11y";
import pluginListeners from "eslint-plugin-listeners";
import nodePlugin from "eslint-plugin-n";
import pluginNFDAR from "eslint-plugin-no-function-declare-after-return";
import pluginNoSecrets from "eslint-plugin-no-secrets";
import nounsanitized from "eslint-plugin-no-unsanitized";
import pluginNoUseExtendNative from "eslint-plugin-no-use-extend-native";
import perfectionist from "eslint-plugin-perfectionist";
import pluginPreferArrow from "eslint-plugin-prefer-arrow";
import pluginPromise from "eslint-plugin-promise";
import pluginReact from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import pluginRegexp from "eslint-plugin-regexp";
import pluginSecurity from "eslint-plugin-security";
import pluginSonarjs from "eslint-plugin-sonarjs";
import pluginSwitchCase from "eslint-plugin-switch-case";
import pluginTsdoc from "eslint-plugin-tsdoc";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import pluginUnusedImports from "eslint-plugin-unused-imports";
import { defineConfig } from "eslint/config";
import globals from "globals";

// TypeScript support is now enabled with @typescript-eslint parser and plugin

export default defineConfig([
    {
        files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
            },
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            "array-func": pluginArrayFunc,
            "comment-length": pluginCommentLength,
            "eslint-comments": eslintComments,
            ex: pluginEx,
            js,
            listeners: pluginListeners,
            "no-function-declare-after-return": pluginNFDAR,
            "no-secrets": pluginNoSecrets,
            "no-use-extend-native": pluginNoUseExtendNative,
            "prefer-arrow": pluginPreferArrow,
            promise: pluginPromise,
            security: pluginSecurity,
            "switch-case": pluginSwitchCase,
            tsdoc: pluginTsdoc,
            "unused-imports": pluginUnusedImports,
        },
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
            complexity: "off",
            // Additional noise reduction rules
            "sort-imports": "off", // Conflict with perfectionist/sort-imports, prefer perfectionist
            "no-underscore-dangle": "off", // Allow underscore prefixes for private properties and test globals
            "no-use-before-define": ["warn", { functions: false, classes: false }], // Allow function hoisting
            "max-params": "off", // Allow functions with many parameters for now
            "no-continue": "off", // Continue statements are fine
            "no-plusplus": "off", // Allow ++ and -- operators
            "require-await": "off", // Many async functions don't require await
            "class-methods-use-this": "off", // Class methods don't always need to use this
            camelcase: "off", // Allow snake_case and other naming patterns for test variables and external APIs
            "capitalized-comments": "off", // Comments don't need to be capitalized
            "func-names": "off", // Allow anonymous functions
            "no-param-reassign": "off", // Allow parameter reassignment
            "no-undefined": "off", // Allow explicit undefined usage
            "no-eq-null": "off", // Allow == null checks
            eqeqeq: ["warn", "smart"], // Allow smart equality checks
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
            radix: "off", // Don't require radix parameter for parseInt
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
            "eslint-comments/no-unlimited-disable": "off", // Allow unlimited disables in some files
            "eslint-comments/no-unused-disable": "warn", // Warn about unused disable directives
        },
    },
    // Apply strict rule-sets from Unicorn, Node (n), and Perfectionist, scoped to JS/TS only to avoid
    // running JS rules on JSON/Markdown/CSS which can cause parser/sourceCode mismatches.
    { ...eslintPluginUnicorn.configs.all, files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
    { ...nodePlugin.configs["flat/all"], files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
    { ...perfectionist.configs["recommended-natural"], files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
    { ...pluginSonarjs.configs.recommended, files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
    { ...pluginRegexp.configs["flat/recommended"], files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
    { ...importXPlugin.flatConfigs.electron, files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
    // @ts-expect-error - No types available
    { ...nounsanitized.configs.recommended, files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
    // TypeScript files configuration
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: "./tsconfig.json",
                ecmaVersion: 2024,
                sourceType: "module",
            },
        },
        plugins: {
            "@typescript-eslint": tseslint,
        },
        rules: {
            // TypeScript-specific rules (basic set, not overly strict)
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
            ],
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-non-null-assertion": "warn",
            "@typescript-eslint/prefer-nullish-coalescing": "warn",
            "@typescript-eslint/prefer-optional-chain": "warn",
        },
    },
    {
        files: ["**/*.{js,mjs,cjs,ts}", "**/*.jsx", "**/*.tsx"],
        settings: {
            // Configure import-x to skip parsing problematic modules
            "import-x/parsers": {
                espree: [".js", ".cjs", ".mjs", ".jsx"],
            },
            "import-x/ignore": [
                // Skip parsing eslint plugins that use newer syntax
                "eslint-plugin-unicorn",
                "eslint-plugin-.*",
                "node_modules",
            ],
        },
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
            // Prefer node: protocol gradually; don't fail builds
            "n/prefer-node-protocol": "warn",
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

            // Security plugin rules - start as warnings
            "security/detect-object-injection": "off", // Too many false positives
            "security/detect-non-literal-regexp": "off", // Allow dynamic regexps
            "security/detect-unsafe-regex": "warn",
            "security/detect-buffer-noassert": "warn",
            "security/detect-eval-with-expression": "error",
            "security/detect-no-csrf-before-method-override": "warn",
            "security/detect-possible-timing-attacks": "off", // Too many false positives
            "security/detect-pseudoRandomBytes": "warn",

            // Promise plugin rules
            "promise/always-return": "off", // Allow promises without explicit returns
            "promise/no-return-wrap": "warn",
            "promise/param-names": "warn",
            "promise/catch-or-return": "off", // Allow promises without catch
            "promise/no-nesting": "warn",
            "promise/no-promise-in-callback": "warn",
            "promise/no-callback-in-promise": "warn",
            "promise/avoid-new": "off", // Allow new Promise()
            "promise/no-new-statics": "error",
            "promise/no-return-in-finally": "error",
            "promise/valid-params": "error",
            "promise/prefer-await-to-then": "off", // Allow .then() usage

            // Unused imports plugin
            "unused-imports/no-unused-imports": "warn",
            "unused-imports/no-unused-vars": [
                "warn",
                { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" },
            ],

            // Import-x plugin rules
            "import-x/no-unresolved": "off", // Handled by TypeScript
            "import-x/named": "off",
            "import-x/namespace": "off",
            "import-x/default": "off",
            "import-x/export": "error",
            "import-x/no-named-as-default": "warn",
            "import-x/no-named-as-default-member": "warn",
            "import-x/no-duplicates": "warn",
            "import-x/no-namespace": "off", // Allow namespace imports
            "import-x/extensions": "off", // Don't enforce file extensions
            "import-x/order": "off", // Use perfectionist instead
            "import-x/newline-after-import": "warn",
            "import-x/no-mutable-exports": "warn",
            "import-x/no-unused-modules": "off", // Too slow for large projects

            // Regexp plugin rules
            "regexp/no-super-linear-backtracking": "error",
            "regexp/no-useless-lazy": "warn",
            "regexp/no-useless-quantifier": "warn",
            "regexp/optimal-quantifier-concatenation": "warn",
            "regexp/prefer-quantifier": "warn",

            // SonarJS rules adjustments
            "sonarjs/cognitive-complexity": ["warn", 30],
            "sonarjs/no-duplicate-string": "off", // Too noisy for test files
            "sonarjs/no-identical-functions": "warn",
            "sonarjs/no-nested-template-literals": "off",
            "sonarjs/prefer-immediate-return": "off",
            "sonarjs/no-nested-conditional": "warn", // Allow nested ternaries with warning
            "sonarjs/no-all-duplicated-branches": "warn", // Warn instead of error
            "sonarjs/no-redundant-boolean": "warn",
            "sonarjs/no-gratuitous-expressions": "warn",
            "sonarjs/no-unused-vars": "off", // Use built-in rule instead
            "sonarjs/no-dead-store": "warn", // Warn instead of error
            "sonarjs/pseudo-random": "warn", // Math.random() is fine for non-security uses
            "sonarjs/no-os-command-from-path": "warn", // PATH usage is sometimes necessary
            "sonarjs/no-useless-catch": "warn", // Sometimes needed for logging
            "sonarjs/single-character-alternation": "warn", // Sometimes more readable
            "sonarjs/no-duplicated-branches": "warn",
            "sonarjs/slow-regex": "error", // Keep as error for security
            "sonarjs/anchor-precedence": "warn",
            "sonarjs/no-unused-collection": "warn",

            // No-unsanitized rules
            "no-unsanitized/method": "off", // Too many false positives with dynamic imports
            "no-unsanitized/property": "off",

            // ESLint comments rules
            "eslint-comments/disable-enable-pair": "warn",
            "eslint-comments/no-aggregating-enable": "warn",
            "eslint-comments/no-duplicate-disable": "error",
            "eslint-comments/no-unlimited-disable": "off",
            "eslint-comments/no-unused-disable": "warn",
            "eslint-comments/no-unused-enable": "warn",

            // Array-func rules - better array method usage
            "array-func/from-map": "warn",
            "array-func/no-unnecessary-this-arg": "warn",
            "array-func/prefer-array-from": "warn",
            "array-func/avoid-reverse": "warn",
            "array-func/prefer-flat-map": "warn",
            "array-func/prefer-flat": "warn",

            // Comment-length rules - keep comments readable
            "comment-length/limit-single-line-comments": ["warn", { maxLength: 120 }],
            "comment-length/limit-multi-line-comments": ["warn", { maxLength: 120 }],

            // No-secrets rules - security
            "no-secrets/no-secrets": ["error", { tolerance: 4.5 }],

            // No-use-extend-native rules - prevent extending native prototypes
            "no-use-extend-native/no-use-extend-native": "error",

            // Prefer-arrow rules - consistency with arrow functions
            "prefer-arrow/prefer-arrow-functions": [
                "off",
                {
                    disallowPrototype: true,
                    singleReturnOnly: false,
                    classPropertiesAllowed: false,
                },
            ],


            // TSDoc rules - better JSDoc/TSDoc validation
            "tsdoc/syntax": "off",

            // Listeners plugin - event listener best practices
            "listeners/no-missing-remove-event-listener": "warn",
            "listeners/matching-remove-event-listener": "warn",

            // No-function-declare-after-return plugin
            "no-function-declare-after-return/no-function-declare-after-return": "warn",

            // Switch-case plugin - better switch statement handling
            "switch-case/no-case-curly": "warn",
            "switch-case/newline-between-switch-case": "off", // Can be noisy

            // Ex plugin - disallow specific ES features if needed (off by default)
            // Enable specific rules as needed, e.g., "ex/no-array-from": "warn"
        },
    },
    // Barrel/index files with re-exports
    {
        files: ["**/index.js", "**/index.mjs"],
        rules: {
            "import-x/export": "off", // Allow duplicate exports in barrel files
        },
    },
    // React and JSX rules for .jsx and .tsx files
    {
        files: ["**/*.{jsx,tsx}"],
        plugins: {
            react: pluginReact,
            "react-hooks": reactHooks,
            "jsx-a11y": jsxA11y,
        },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        settings: {
            react: {
                version: "detect",
            },
        },
        rules: {
            ...pluginReact.configs.recommended.rules,
            ...pluginReact.configs["jsx-runtime"].rules,
            ...reactHooks.configs.recommended.rules,
            ...jsxA11y.configs.recommended.rules,

            // React rules adjustments
            "react/react-in-jsx-scope": "off", // Not needed with React 17+
            "react/prop-types": "off", // Using TypeScript for type checking
            "react/jsx-uses-react": "off",
            "react/jsx-uses-vars": "error",
            "react/jsx-no-undef": "error",
            "react/jsx-key": "error",
            "react/no-unescaped-entities": "warn",
            "react/display-name": "off",
            "react/jsx-no-target-blank": ["error", { enforceDynamicLinks: "always" }],

            // React Hooks rules
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",

            // JSX a11y rules adjustments
            "jsx-a11y/anchor-is-valid": "warn",
            "jsx-a11y/click-events-have-key-events": "warn",
            "jsx-a11y/no-static-element-interactions": "warn",
            "jsx-a11y/alt-text": "error",
            "jsx-a11y/aria-props": "error",
            "jsx-a11y/aria-proptypes": "error",
            "jsx-a11y/aria-unsupported-elements": "error",
            "jsx-a11y/role-has-required-aria-props": "error",
            "jsx-a11y/role-supports-aria-props": "error",
        },
    },
    {
        files: ["**/*.jsx"],
        languageOptions: {
            sourceType: "module",
        },
    },
    // File-specific relaxations for legacy or intentionally dynamic code
    {
        files: ["utils/state/core/masterStateManager.js"],
        rules: {
            // masterStateManager uses eval in controlled ways; avoid failing CI
            "no-eval": "off",
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
        ignores: ["**/tsconfig*.json"], // Exclude TypeScript config files (they use JSONC format)
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
            // Allow !important for overriding specificity issues
            "css/no-important": "off",
            // Project does not strictly adhere to a baseline grid system
            "css/use-baseline": "off",
            // Project uses gradients and custom properties that trigger false positives
            // Disable for now to prioritize JS lint health; revisit with tailored allowlist if needed
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
            "tests/**",
            // Generated/minified HTML assets and bundles
            "html/**",
            "**/node_modules/**",
            "dist/**", // Built output (contains many vendor + d.ts artifacts not meant for linting)
            "**/*.d.ts", // Skip type declaration files (parsed as JS currently)
            "**/*.test.ts", // Skip TypeScript test files (no TS parser configured)
            // Generated reports and coverage outputs
            "coverage/**",
            "**/coverage/**",
            "**/lcov-report/**",
            "ffv/**",
            "coverage-*/**",
            "coverage-report.json",
            // Jest/Vitest/Electron mocks
            "__mocks__/**",
            // Vendor files
            "vendor/**",
        ],
    },
    // Place Prettier last to turn off rules that conflict with Prettier formatting
    eslintConfigPrettier,
]);
