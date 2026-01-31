// @ts-check
import { defineConfig, globalIgnores } from "@eslint/config-helpers";
import css from "@eslint/css";
import js from "@eslint/js";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import html from "@html-eslint/eslint-plugin";
import * as htmlParser from "@html-eslint/parser";
import tseslint from "@typescript-eslint/eslint-plugin";
import tseslintParser from "@typescript-eslint/parser";
import vitest from "@vitest/eslint-plugin";
import gitignore from "eslint-config-flat-gitignore";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import * as eslintMdx from "eslint-mdx";
import pluginCompat from "eslint-plugin-compat";
import depend from "eslint-plugin-depend";
import { importX } from "eslint-plugin-import-x";
import jsdocPlugin from "eslint-plugin-jsdoc";
import eslintPluginJsonc from "eslint-plugin-jsonc";
import jsxA11y from "eslint-plugin-jsx-a11y";
import eslintPluginMath from "eslint-plugin-math";
import * as mdx from "eslint-plugin-mdx";
import nodePlugin from "eslint-plugin-n";
import noSecrets from "eslint-plugin-no-secrets";
import nounsanitized from "eslint-plugin-no-unsanitized";
import packageJson from "eslint-plugin-package-json";
import pluginPerfectionist from "eslint-plugin-perfectionist";
import playwright from "eslint-plugin-playwright";
import pluginPreferArrow from "eslint-plugin-prefer-arrow";
import pluginPrettier from "eslint-plugin-prettier";
import pluginPromise from "eslint-plugin-promise";
import pluginReact from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactPerfPlugin from "eslint-plugin-react-perf";
import pluginRedos from "eslint-plugin-redos";
import pluginRegexp from "eslint-plugin-regexp";
import pluginSecurity from "eslint-plugin-security";
import sonarjs, { configs as sonarjsConfigs } from "eslint-plugin-sonarjs";
import pluginSortClassMembers from "eslint-plugin-sort-class-members";
import storybook from "eslint-plugin-storybook";
import styledA11y from "eslint-plugin-styled-components-a11y";
import pluginTestingLibrary from "eslint-plugin-testing-library";
import eslintPluginToml from "eslint-plugin-toml";
import pluginUnicorn from "eslint-plugin-unicorn";
import pluginUnusedImports from "eslint-plugin-unused-imports";
import pluginWriteGood from "eslint-plugin-write-good-comments";
import xss from "eslint-plugin-xss";
import eslintPluginYml from "eslint-plugin-yml";
import globals from "globals";
import jsoncEslintParser from "jsonc-eslint-parser";
import { createRequire } from "node:module";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as tomlEslintParser from "toml-eslint-parser";
import * as yamlEslintParser from "yaml-eslint-parser";

/**
 * @see {@link https://www.schemastore.org/eslintrc.json} for JSON schema validation
 */

/** @typedef {import("eslint").Linter.Config} EslintConfig */
/** @typedef {import("eslint").Linter.BaseConfig} BaseEslintConfig */
/** @typedef {import("eslint").Linter.LinterOptions} LinterOptions */
/** @typedef {import("eslint").ESLint.Plugin} EslintPlugin */
/** @typedef {Record<string, EslintPlugin>} EslintPluginMap */
/** @typedef {import("@eslint/config-helpers").ConfigWithExtends} EslintConfigWithExtends */
/** @typedef {import("@eslint/config-helpers").ConfigWithExtendsArray} EslintConfigWithExtendsArray */
/**
 * @typedef {EslintPlugin & {
 *     configs: Record<string, { rules?: import("eslint").Linter.RulesRecord }>;
 * }} EslintPluginWithConfigs
 */

/**
 * Coerce plugin maps to ESLint's Plugin typing.
 *
 * Many third-party plugins still ship ESLint 8-era types that do not
 * structurally match ESLint 9's stricter Plugin interface. ESLint accepts these
 * plugins at runtime, so we intentionally coerce the plugin map to avoid noisy
 * TypeScript false-positives in this config.
 *
 * @param {Record<string, unknown>} plugins
 *
 * @returns {EslintPluginMap}
 */
const coerceEslintPluginMap = (plugins) =>
    /** @type {EslintPluginMap} */ (/** @type {unknown} */ (plugins));

/**
 * Coerce third-party rule sets to ESLint's RulesRecord typing.
 *
 * @param {unknown} rules
 *
 * @returns {import("eslint").Linter.RulesRecord}
 */
const coerceRulesRecord = (rules) =>
    /** @type {import("eslint").Linter.RulesRecord} */ (
        /** @type {unknown} */ (rules)
    );

/**
 * Coerce config arrays coming from third-party plugin exports.
 *
 * @param {unknown} configs
 *
 * @returns {EslintConfigWithExtendsArray}
 */
const coerceConfigWithExtendsArray = (configs) =>
    /** @type {EslintConfigWithExtendsArray} */ (
        /** @type {unknown} */ (configs)
    );

/**
 * Some plugins omit `configs` from their published typings. Normalize locally
 * so we can safely consume their flat config presets.
 *
 * @type {EslintPluginWithConfigs}
 */
const pluginPromiseWithConfigs = /** @type {EslintPluginWithConfigs} */ (
    /** @type {unknown} */ (pluginPromise)
);

// NOTE: eslint-plugin-json-schema-validator may attempt to fetch remote schemas
// at lint time. That makes linting flaky/offline-hostile.
// Keep it opt-in via UW_ENABLE_JSON_SCHEMA_VALIDATION=1.
const enableJsonSchemaValidation =
    process.env["UW_ENABLE_JSON_SCHEMA_VALIDATION"] === "1";

const configRootDir = path.dirname(fileURLToPath(import.meta.url));
const moduleResolver = createRequire(import.meta.url);

let eslintPluginJsonSchemaValidator = undefined;

if (enableJsonSchemaValidation) {
    eslintPluginJsonSchemaValidator = (
        await import("eslint-plugin-json-schema-validator")
    ).default;
}

const jsonSchemaValidatorPlugins = enableJsonSchemaValidation
    ? { "json-schema-validator": eslintPluginJsonSchemaValidator }
    : {};

/** @type {import("eslint").Linter.RulesRecord} */
const jsonSchemaValidatorRules = enableJsonSchemaValidation
    ? { "json-schema-validator/no-invalid": "error" }
    : {};

if (!process.env["RECHECK_JAR"]) {
    const resolvedRecheckJarPath = (() => {
        const candidateSpecifiers = [
            "recheck-jar/recheck.jar",
            "recheck-jar/dist/recheck.jar",
            "recheck-jar/lib/recheck.jar",
            "recheck-jar/bin/recheck.jar",
        ];

        for (const specifier of candidateSpecifiers) {
            try {
                return moduleResolver.resolve(specifier);
            } catch {
                // Continue
            }
        }

        console.warn(
            "[eslint.config] Unable to resolve recheck-jar JAR file path. eslint-plugin-redos will rely on its internal resolution logic."
        );
        return undefined;
    })();

    if (resolvedRecheckJarPath) {
        process.env["RECHECK_JAR"] = path.normalize(resolvedRecheckJarPath);
    }
}

// NOTE: We are not enabling TypeScript-specific ESLint rules in this flat config.
// If future TS linting is needed, bring in typescript-eslint and extend its configs.

export default defineConfig([
    globalIgnores(["**/CHANGELOG.md"]),
    gitignore({
        name: "Global - .gitignore Rules",
        root: false,
        strict: true,
    }), // MARK: Global Configs and Rules
    // stylistic.configs.customize({
    //     arrowParens: true,
    //     blockSpacing: true,
    //     braceStyle: "stroustrup",
    //     commaDangle: "always-multiline",
    //     experimental: true,
    //     // The following options are the default values
    //     indent: 4,
    //     jsx: true,
    //     pluginName: "@stylistic",
    //     quoteProps: "as-needed",
    //     quotes: 'double',
    //     semi: true,
    //     severity: "warn",
    //     // ...
    //   }),
    {
        // NOTE: In ESLint flat config, ignore-only entries are safest when
        // placed near the start of the config array.
        // ═══════════════════════════════════════════════════════════════════════════════
        // MARK: Global Ignore Patterns
        // Add patterns here to ignore files and directories globally
        // ═══════════════════════════════════════════════════════════════════════════════
        ignores: [
            "**/**-instructions.md",
            "**/**.instructions.md",
            "**/**dist**/**",
            "**/.agentic-tools*",
            "**/.cache/**",
            "**/Coverage/**",
            "**/_ZENTASKS*",
            "**/chatproject.md",
            "**/coverage-results.json",
            "**/coverage/**",
            "**/dist-scripts/**",
            "**/dist/**",
            "**/html/**",
            "**/node_modules/**",
            "**/package-lock.json",
            "**/release/**",
            ".devskim.json",
            ".github/ISSUE_TEMPLATE/**",
            ".github/PULL_REQUEST_TEMPLATE/**",
            ".github/chatmodes/**",
            ".github/instructions/**",
            ".github/prompts/**",
            ".stryker-tmp/**",
            "**/CHANGELOG.md",
            "coverage-report.json",
            "docs/Archive/**",
            "docs/Logger-Error-report.md",
            "docs/Packages/**",
            "docs/Reviews/**",
            "docs/docusaurus/.docusaurus/**",
            "docs/docusaurus/build/**",
            "docs/docusaurus/docs/**",
            "docs/docusaurus/static/eslint-inspector/**",
            "report/**",
            "reports/**",
            "scripts/devtools-snippets/**",
            "storybook-static/**",
            "playwright/reports/**",
            "playwright/test-results/**",
            "public/mockServiceWorker.js",
            "storybook/test-runner-jest.config.js",
            "temp/**",
            ".temp/**",
            "vendor/**",
            "vendor/leafletMeasure/**/*",
            "scripts/extractLeafletTemplates.cjs",
            "./temp**",
            "./.temp**",
            "./.temp*/**",
            "node_modules/**",
            "dist/**",
            "**/*.d.ts",
        ],
        name: "Global: Ignore Patterns **/**",
    },
    // ═══════════════════════════════════════════════════════════════════════════════
    // MARK: Global Language Options
    // ═══════════════════════════════════════════════════════════════════════════════
    {
        languageOptions: {
            globals: {
                ...globals.node,
                ...vitest.environments.env.globals,
                __dirname: "readonly",
                __filename: "readonly",
                afterAll: "readonly",
                afterEach: "readonly",
                beforeAll: "readonly",
                beforeEach: "readonly",
                Buffer: "readonly",
                describe: "readonly",
                document: "readonly",
                expect: "readonly",
                global: "readonly",
                globalThis: "readonly",
                it: "readonly",
                module: "readonly",
                process: "readonly",
                require: "readonly",
                test: "readonly",
                vi: "readonly",
                window: "readonly",
            },
        },
        name: "Global Language Options **/**",
    },
    // ═══════════════════════════════════════════════════════════════════════════════
    // MARK: Global Settings
    // ═══════════════════════════════════════════════════════════════════════════════
    {
        name: "Global Settings Options **/**",
        settings: {
            "import-x/resolver": {
                node: true,
            },
            "import-x/resolver-next": [
                createTypeScriptImportResolver({
                    alwaysTryTypes: true, // Always try to resolve types under `<root>@types` directory even if it doesn't contain any source code, like `@types/unist`
                    bun: true, // Resolve Bun modules (https://github.com/import-js/eslint-import-resolver-typescript#bun)
                    noWarnOnMultipleProjects: true, // Don't warn about multiple projects
                    // Use an array
                    project: [
                        "tsconfig.vitest.json",
                        "tsconfig.json",
                        "../docusaurus/tsconfig.json",
                    ],
                }),
            ],
            react: { version: "19" },
            "react-x": {
                importSource: "react", // Customize the import source for the React module (defaults to "react")
                polymorphicPropName: "as", // Define the prop name used for polymorphic components (e.g., <Component as="div">)
                version: "detect", // Specify the React version for semantic analysis (can be "detect" for auto-detection)
            },
        },
    },
    {
        // Use the sane defaults instead of the extremely strict "all" ruleset.
        // This aligns with common practice and reduces noisy stylistic errors
        // while keeping correctness-focused rules.
        files: ["**/*.{js,mjs,cjs,ts}"],
        plugins: coerceEslintPluginMap({
            "@typescript-eslint": tseslint,
            compat: pluginCompat,
            css: css,
            depend: depend,
            "import-x": importX,
            js: js,
            "jsx-a11y": jsxA11y,
            math: eslintPluginMath,
            n: nodePlugin,
            "no-unsanitized": nounsanitized,
            perfectionist: pluginPerfectionist,
            "prefer-arrow": pluginPreferArrow,
            prettier: pluginPrettier,
            promise: pluginPromise,
            react: pluginReact,
            "react-hooks": reactHooks,
            "react-perf": reactPerfPlugin,
            redos: pluginRedos,
            regexp: pluginRegexp,
            security: pluginSecurity,
            sonarjs: sonarjs,
            "sort-class-members": pluginSortClassMembers,
            unicorn: pluginUnicorn,
            "unused-imports": pluginUnusedImports,
            "write-good-comments": pluginWriteGood,
        }),
        rules: {
            "array-callback-return": "warn", // Warn about missing returns in array callbacks
            camelcase: "off", // Allow snake_case and other naming patterns for test variables and external APIs
            "capitalized-comments": "off", // Comments don't need to be capitalized
            "class-methods-use-this": "off", // Class methods don't always need to use this
            complexity: "off",
            "consistent-return": "off", // Allow inconsistent returns
            "consistent-this": "off", // Allow any name for this alias
            "css/font-family-fallbacks": "off", // Don't require font fallbacks in CSS
            "default-case": "off", // Switch statements don't always need default case
            "default-param-last": "warn", // Warn about default parameters not being last
            eqeqeq: [
                "warn",
                "smart",
            ], // Allow smart equality checks
            "func-names": "off", // Allow anonymous functions
            "func-style": "off",
            "id-length": "off",
            "init-declarations": "off", // Allow uninitialized variable declarations
            "max-classes-per-file": "off", // Allow multiple classes per file
            // Additional round of noise reduction
            "max-depth": "off", // Allow deeply nested blocks
            // Complexity/size limits are not enforced right now; revisit later with targeted refactors
            "max-lines": [
                "warn",
                { max: 600, skipBlankLines: true, skipComments: true },
            ],
            "max-lines-per-function": "off",
            "max-params": "off", // Allow functions with many parameters for now
            "max-statements": "off",
            "n/no-deprecated-api": "warn", // Warn about deprecated APIs
            "n/no-top-level-await": "off", // Allow top-level await
            "new-cap": [
                "warn",
                { capIsNewExceptions: ["DataTable"] },
            ], // Warn about constructor capitalization
            "no-alert": "warn", // Warn about alert usage but don't error
            "no-await-in-loop": "warn", // Warn about await in loops
            "no-bitwise": "off", // Allow bitwise operators
            // Allow console usage in Electron (renderer/main) – retain as a warning for visibility
            "no-console": "off",
            "no-continue": "off", // Continue statements are fine
            "no-duplicate-imports": "off", // Allow duplicate imports for different purposes
            // Project contains intentional placeholder blocks and try/catch boundaries; warn instead of error
            "no-empty": "warn",
            "no-empty-function": "off", // Allow empty functions (placeholders, overrides)
            "no-eq-null": "off", // Allow == null checks
            "no-fallthrough": "warn", // Warn about switch fallthrough
            // Allow temporary assignments used in mocks/dev utilities without failing the build
            "no-global-assign": "warn",
            "no-implicit-globals": "warn", // Warn about implicit globals
            "no-inline-comments": "off",
            "no-invalid-this": "warn", // Warn about invalid this usage
            "no-lone-blocks": "off", // Allow lone blocks
            "no-lonely-if": "off", // Allow lonely if statements
            "no-loop-func": "warn", // Warn about functions in loops
            "no-magic-numbers": "off",
            "no-multi-assign": "off", // Allow chained assignment
            "no-negated-condition": "off", // Allow negated conditions
            "no-nested-ternary": "off", // Allow nested ternary operators
            "no-param-reassign": "off", // Allow parameter reassignment
            "no-plusplus": "off", // Allow ++ and -- operators
            "no-shadow": "warn", // Warn about variable shadowing
            // These rules are overly restrictive for this codebase; disable to reduce noise
            "no-ternary": "off",
            // Some files refer to globals provided at runtime (Electron preload, injected helpers in tests)
            // Keep as a warning for now to reduce noise until refactors add explicit imports.
            "no-undef": "warn",
            "no-undefined": "off", // Allow explicit undefined usage
            "no-underscore-dangle": "off", // Allow underscore prefixes for private properties and test globals
            "no-unneeded-ternary": "off", // Allow unneeded ternary operators
            "no-unused-expressions": "off", // Allow expressions statements (useful for debugging)
            // Allow intentionally unused parameters prefixed with underscore (common for Electron event placeholders)
            // Keep as a warning to avoid blocking CI while still surfacing issues.
            "no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
            ],
            "no-use-before-define": [
                "warn",
                { classes: false, functions: false },
            ], // Allow function hoisting
            "no-useless-assignment": "off", // Allow assignments that might seem useless
            "no-useless-catch": "warn",
            "no-useless-constructor": "off", // Allow empty constructors
            "no-var": "warn", // Warn about var usage
            "object-shorthand": "off", // Don't require object shorthand
            "one-var": "off",
            "prefer-arrow-callback": "off", // Don't require arrow functions
            "prefer-const": "warn", // Warn about let that could be const
            "prefer-destructuring": "warn", // Encourage but don't require destructuring
            "prefer-named-capture-group": "off", // Don't require named capture groups
            "prefer-rest-params": "warn", // Encourage rest params over arguments
            "prefer-spread": "warn", // Encourage spread operator
            "prefer-template": "off", // Don't require template literals
            "preserve-caught-error": "off", // Allow throwing new errors without preserving original
            radix: "off", // Don't require radix parameter for parseInt
            "require-atomic-updates": "off", // Turn off race condition warnings
            "require-await": "off", // Many async functions don't require await
            "require-unicode-regexp": "off", // Don't require unicode flag on regexes
            // Additional noise reduction rules
            "sort-imports": "off", // Conflict with perfectionist/sort-imports, prefer perfectionist
            "sort-keys": "off",
            "sort-vars": "off",
            "unicorn/consistent-destructuring": "off", // Don't require consistent destructuring
            "unicorn/error-message": "off", // Allow Error() without message
            "unicorn/no-array-callback-reference": "off", // Allow direct function references in array callbacks
            "unicorn/no-array-reverse": "off", // Allow array reverse
            "unicorn/no-await-expression-member": "off", // Allow await expression member access
            "unicorn/no-empty-file": "off", // Allow empty files (placeholders)
            "unicorn/no-new-array": "off", // Allow new Array()
            "unicorn/no-useless-switch-case": "off", // Allow useless switch cases
            "unicorn/prefer-code-point": "off", // Allow String.fromCharCode
            "unicorn/text-encoding-identifier-case": "off", // Allow utf-8 vs utf8
        },
    },
    // Apply strict rule-sets from Unicorn, Node (n), and Perfectionist, scoped to JS/TS only to avoid
    // running JS rules on JSON/Markdown/CSS which can cause parser/sourceCode mismatches.
    {
        files: [
            "**/*.{js,mjs,cjs,ts}",
            "**/*.jsx",
            "**/*.tsx",
        ],
        rules: {
            "n/callback-return": "off", // Don't enforce callback returns
            "n/global-require": "off", // Allow require() in functions
            "n/no-deprecated-api": "warn", // Warn about deprecated Node.js APIs
            "n/no-extraneous-import": "off",
            "n/no-extraneous-require": "off",
            // Node plugin adjustments to avoid false positives in Electron/bundled context
            "n/no-missing-import": "off",
            "n/no-missing-require": "off",
            "n/no-mixed-requires": "off", // Allow mixing require and other declarations
            "n/no-process-env": "off", // Allow process.env usage in Electron
            "n/no-process-exit": "warn",
            "n/no-sync": "off", // Allow sync fs methods in scripts and setup code
            "n/no-unpublished-import": "off", // Allow importing dev dependencies
            "n/no-unpublished-require": "off", // Allow requiring dev dependencies
            "n/no-unsupported-features/es-builtins": "off",
            "n/no-unsupported-features/es-syntax": "off",
            "n/no-unsupported-features/node-builtins": "off",
            "n/prefer-global/buffer": "off", // Allow require('buffer').Buffer
            // Prefer node: protocol gradually; don't fail builds
            "n/prefer-node-protocol": "warn",
            "n/prefer-promises/fs": "off", // Allow sync fs methods
            "perfectionist/sort-classes": "warn",
            "perfectionist/sort-enums": "warn",
            // Perfectionist: start as warnings to avoid blocking adoption
            "perfectionist/sort-imports": "warn",
            "perfectionist/sort-interfaces": "warn",
            "perfectionist/sort-jsx-props": "warn",

            "perfectionist/sort-maps": "warn",
            "perfectionist/sort-named-exports": "warn",
            "perfectionist/sort-named-imports": "warn",
            "perfectionist/sort-objects": "off", // Too noisy for existing codebase
            "perfectionist/sort-sets": "warn",
            "perfectionist/sort-union-types": "warn",
            "perfectionist/sort-variable-declarations": "off",
            "unicorn/consistent-function-scoping": "off", // Allow nested function declarations
            "unicorn/explicit-length-check": "off", // Allow .length checks
            "unicorn/filename-case": "off", // Preserve existing filenames
            "unicorn/import-style": "off",
            "unicorn/no-array-reduce": "off", // Allow Array#reduce when appropriate
            "unicorn/no-array-sort": "off", // Allow Array.sort() usage
            "unicorn/no-keyword-prefix": "off", // Allow variables starting with keywords like new, class
            "unicorn/no-null": "off", // Codebase uses null intentionally in places
            "unicorn/no-this-assignment": "off", // Allow this assignment patterns
            "unicorn/no-unused-properties": "off", // Allow unused object properties
            "unicorn/prefer-add-event-listener": "off", // Allow onclick and similar patterns
            "unicorn/prefer-blob-reading-methods": "off", // Allow FileReader patterns

            "unicorn/prefer-default-parameters": "off", // Allow parameter reassignment patterns
            "unicorn/prefer-dom-node-remove": "off", // Allow parentNode.removeChild()
            "unicorn/prefer-event-target": "off", // Node/Electron often uses EventEmitter
            // Electron/CommonJS friendly adjustments
            "unicorn/prefer-module": "off", // Project uses CommonJS entrypoints
            "unicorn/prefer-node-protocol": "warn", // Encourage gradually
            "unicorn/prefer-number-properties": "off", // Allow global Number methods
            "unicorn/prefer-query-selector": "off", // Allow getElementById usage
            "unicorn/prefer-spread": "off", // Don't require spread over slice/split
            "unicorn/prefer-structured-clone": "off", // Allow JSON.parse(JSON.stringify()) patterns
            "unicorn/prefer-ternary": "off", // Don't require ternary over if statements
            "unicorn/prefer-top-level-await": "off", // Not always viable in CJS/Electron context
            "unicorn/prevent-abbreviations": "off", // Allow common abbreviations (ctx, env, etc.)
        },
    },
    // File-specific relaxations for legacy or intentionally dynamic code
    {
        files: ["utils/state/core/masterStateManager.js"],
        rules: {
            // MasterStateManager uses eval in controlled ways; avoid failing CI
            "no-eval": "off",
        },
    },
    {
        // Legacy modules pending modularisation; silence max-lines noise until refactors land.
        files: [
            "preload.js",
            "renderer.js",
            "utils/app/menu/createAppMenu.js",
            "utils/charts/core/renderChartJS.js",
            "utils/files/export/exportUtils.js",
            "utils/maps/layers/mapDrawLaps.js",
            "utils/maps/core/renderMap.js",
            "utils/state/core/masterStateManager.js",
            "utils/state/integration/mainProcessStateManager.js",
            "utils/ui/browser/fileBrowserTab.js",
            "utils/ui/components/createSettingsHeader.js",
            "utils/ui/controls/createInlineZoneColorSelector.js",
            "utils/ui/modals/injectModalStyles.js",
        ],
        rules: {
            "max-lines": "off",
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
        files: ["**/*.css"],
        language: "css/css",
        plugins: coerceEslintPluginMap({ css: css }),
        rules: {
            ...css.configs.recommended.rules,
            // Allow empty blocks (sometimes placeholder for theming) to reduce noise.
            "css/no-empty-blocks": "off",
            // Allow id selectors/universal selectors given existing stylesheet structure.
            "css/no-id-selectors": "off",
            // Disabling 'css/no-important' because certain styles require the use of !important for overriding specificity issues.
            "css/no-important": "off",
            // Project uses gradients, custom properties, and utility patterns that the strict property validator flags.
            // Disable for now to prioritize JS lint health; revisit with a tailored allowlist if needed.
            "css/no-invalid-properties": "off",
            "css/no-universal-selectors": "off",
            // Disabling 'css/use-baseline' as the project does not strictly adhere to a baseline grid system.
            "css/use-baseline": "off",
        },
    },
    {
        files: ["**/package.json"],
        languageOptions: {
            parser: jsoncEslintParser,
            parserOptions: { jsonSyntax: "JSON" },
        },
        name: "Package - **/Package.json",
        plugins: coerceEslintPluginMap({
            json: json,
            "package-json": packageJson,
        }),
        rules: {
            ...json.configs.recommended.rules,
            // Package.json Plugin Rules (package-json/*)
            "package-json/bin-name-casing": "warn",
            "package-json/exports-subpaths-style": "warn",
            "package-json/no-empty-fields": "warn",
            "package-json/no-redundant-files": "warn",
            "package-json/no-redundant-publishConfig": "warn",
            "package-json/order-properties": "warn",
            "package-json/repository-shorthand": "warn",
            "package-json/require-attribution": "warn",
            "package-json/require-author": "warn",
            "package-json/require-bugs": "warn",
            "package-json/require-bundleDependencies": "off",
            "package-json/require-dependencies": "warn",
            "package-json/require-description": "warn",
            "package-json/require-devDependencies": "warn",
            "package-json/require-engines": "warn",
            "package-json/require-exports": "warn",
            "package-json/require-files": "off", // Not needed for Electron applications
            "package-json/require-homepage": "warn",
            "package-json/require-keywords": "warn",
            "package-json/require-license": "warn",
            "package-json/require-name": "warn",
            "package-json/require-optionalDependencies": "off", // Not needed for Electron applications
            "package-json/require-peerDependencies": "off",
            "package-json/require-repository": "error",
            "package-json/require-scripts": "warn",
            "package-json/require-sideEffects": "warn",
            "package-json/require-type": "warn",
            "package-json/require-types": "off", // Not needed for Electron applications
            "package-json/require-version": "warn",
            "package-json/restrict-dependency-ranges": "warn",
            "package-json/restrict-private-properties": "warn",
            "package-json/scripts-name-casing": "warn",
            "package-json/sort-collections": "warn",
            "package-json/specify-peers-locally": "warn",
            "package-json/unique-dependencies": "warn",
            "package-json/valid-author": "warn",
            "package-json/valid-bin": "warn",
            "package-json/valid-bundleDependencies": "warn",
            "package-json/valid-config": "warn",
            "package-json/valid-contributors": "warn",
            "package-json/valid-cpu": "warn",
            "package-json/valid-dependencies": "warn",
            "package-json/valid-description": "warn",
            "package-json/valid-devDependencies": "warn",
            "package-json/valid-directories": "warn",
            "package-json/valid-engines": "warn",
            "package-json/valid-exports": "warn",
            "package-json/valid-files": "warn",
            "package-json/valid-homepage": "warn",
            "package-json/valid-keywords": "warn",
            "package-json/valid-license": "warn",
            "package-json/valid-local-dependency": "off",
            "package-json/valid-main": "warn",
            "package-json/valid-man": "warn",
            "package-json/valid-module": "warn",
            "package-json/valid-name": "warn",
            "package-json/valid-optionalDependencies": "warn",
            "package-json/valid-os": "warn",
            "package-json/valid-peerDependencies": "warn",
            "package-json/valid-private": "warn",
            "package-json/valid-publishConfig": "warn",
            "package-json/valid-repository": "warn",
            "package-json/valid-repository-directory": "warn",
            "package-json/valid-scripts": "warn",
            "package-json/valid-sideEffects": "warn",
            "package-json/valid-type": "warn",
            "package-json/valid-version": "warn",
            "package-json/valid-workspaces": "warn",
        },
    },
    // ═══════════════════════════════════════════════════════════════════════════════
    // MARK: MDX Eslint Rules (mdx/*)
    // ═══════════════════════════════════════════════════════════════════════════════
    // Main MDX Configuration - for MDX files with comprehensive remark linting
    {
        files: ["**/*.mdx"],
        languageOptions: {
            ecmaVersion: "latest",
            globals: {
                React: false,
            },
            parser: eslintMdx,
            sourceType: "module",
        },
        name: "MDX - **/*.MDX (Main with Remark)",
        plugins: coerceEslintPluginMap({ mdx: mdx }),
        rules: {
            ...mdx.flat.rules,
            // MDX-specific rules
            "mdx/remark": "warn",
            "no-unused-expressions": "error",
            // React rules for MDX components
            "react/react-in-jsx-scope": "off",
        },
    },
    // ═══════════════════════════════════════════════════════════════════════════════
    // MARK: MDX CodeBlocks
    // ═══════════════════════════════════════════════════════════════════════════════
    {
        files: ["**/*.mdx"],
        languageOptions: {
            ecmaVersion: "latest",
            globals: {
                React: false,
            },
            parser: eslintMdx,
            sourceType: "module",
        },
        name: "MDX - **/*.MDX (Code Blocks)",
        plugins: coerceEslintPluginMap({ mdx: mdx }),
        rules: {
            ...mdx.flatCodeBlocks.rules,
            // Additional rules for code blocks
            "no-console": "warn",
            "no-unused-vars": "error",
            // Core Plugin ESLint Rules for code blocks
            "no-var": "error",
            "prefer-const": "error",
        },
    },
    // ═══════════════════════════════════════════════════════════════════════════════
    // MARK: Markdown (md/*, markdown/*, markup/*, atom/*, rss/*)
    // ═══════════════════════════════════════════════════════════════════════════════
    {
        files: ["**/*.{md,markup,atom,rss,markdown}"],
        ignores: [
            "**/docs/packages/**",
            "**/docs/TSDoc/**",
            "**/.github/agents/**",
        ],
        language: "markdown/gfm",
        name: "MD - **/*.{MD,MARKUP,ATOM,RSS,MARKDOWN} (with Remark)",
        plugins: coerceEslintPluginMap({
            markdown: markdown,
            mdx: mdx,
        }),
        rules: {
            // Markdown Plugin Eslint Rules (markdown/*)
            "markdown/fenced-code-language": "warn",
            "markdown/heading-increment": "warn",
            "markdown/no-bare-urls": "warn",
            "markdown/no-duplicate-definitions": "warn",
            "markdown/no-duplicate-headings": "warn",
            "markdown/no-empty-definitions": "warn",
            "markdown/no-empty-images": "warn",
            "markdown/no-empty-links": "warn",
            "markdown/no-html": "off",
            "markdown/no-invalid-label-refs": "warn",
            "markdown/no-missing-atx-heading-space": "warn",
            "markdown/no-missing-label-refs": "warn",
            "markdown/no-missing-link-fragments": "warn",
            "markdown/no-multiple-h1": "warn",
            "markdown/no-reference-like-urls": "warn",
            "markdown/no-reversed-media-syntax": "warn",
            "markdown/no-space-in-emphasis": "warn",
            "markdown/no-unused-definitions": "warn",
            "markdown/require-alt-text": "warn",
            "markdown/table-column-count": "warn",
            // Remark linting integration
            "mdx/remark": "warn",
        },
        settings: {
            processor: mdx.createRemarkProcessor({
                // Enable remark configuration file (.remarkrc.mjs) for comprehensive linting
                ignoreRemarkConfig: false,
                // Disable code block linting for regular markdown (use markdown plugin instead)
                lintCodeBlocks: false,
                // Path to remark config (optional, will auto-discover .remarkrc.mjs)
                remarkConfigPath: ".remarkrc.mjs",
            }),
        },
    },
    // ═══════════════════════════════════════════════════════════════════════════════
    // MARK: CSS (css/*)
    // ═══════════════════════════════════════════════════════════════════════════════
    {
        files: ["**/*.css"],
        ignores: [
            "docs/**",
            "**/test/**",
        ],
        language: "css/css",
        languageOptions: {
            tolerant: true,
        },
        name: "CSS - **/*.CSS",
        plugins: coerceEslintPluginMap({ css: css }),
        rules: {
            ...css.configs.recommended.rules,
            // CSS Eslint Rules (css/*)
            "css/no-empty-blocks": "error",
            "css/no-important": "off",
            "css/no-invalid-at-rules": "off",
            "css/no-invalid-properties": "off",
            "css/prefer-logical-properties": "warn",
            "css/relative-font-units": "warn",
            "css/selector-complexity": "off",
            "css/use-baseline": "off",
            "css/use-layers": "off",
        },
    },
    // ═══════════════════════════════════════════════════════════════════════════════
    // MARK: JSONC (jsonc/*)
    // ═══════════════════════════════════════════════════════════════════════════════
    {
        files: [
            "**/*.jsonc",
            ".vscode/*.json",
        ],
        ignores: [],
        name: "JSONC - **/*.JSONC",
        // ═══════════════════════════════════════════════════════════════════════════════
        // Plugin Config for eslint-plugin-jsonc to enable Prettier formatting
        // ═══════════════════════════════════════════════════════════════════════════════
        ...eslintPluginJsonc.configs["flat/prettier"][0],
        language: "json/jsonc",
        languageOptions: {
            parser: jsoncEslintParser,
            parserOptions: { jsonSyntax: "JSON" },
        },
        plugins: coerceEslintPluginMap({
            json: json,
            jsonc: eslintPluginJsonc,
            ...jsonSchemaValidatorPlugins,
            "no-secrets": noSecrets,
        }),
        rules: {
            ...json.configs.recommended.rules,
            "jsonc/array-bracket-newline": "warn",
            "jsonc/array-bracket-spacing": "warn",
            "jsonc/array-element-newline": "off", // Handled by Prettier
            "jsonc/auto": "warn",
            "jsonc/comma-dangle": "warn",
            "jsonc/comma-style": "warn",
            "jsonc/indent": "off", // Handled by Prettier
            "jsonc/key-name-casing": "off",
            "jsonc/key-spacing": "warn",
            "jsonc/no-bigint-literals": "warn",
            "jsonc/no-binary-expression": "warn",
            "jsonc/no-binary-numeric-literals": "warn",
            "jsonc/no-comments": "warn",
            "jsonc/no-dupe-keys": "warn",
            "jsonc/no-escape-sequence-in-identifier": "warn",
            "jsonc/no-floating-decimal": "warn",
            "jsonc/no-hexadecimal-numeric-literals": "warn",
            "jsonc/no-infinity": "warn",
            "jsonc/no-irregular-whitespace": "warn",
            "jsonc/no-multi-str": "warn",
            "jsonc/no-nan": "warn",
            "jsonc/no-number-props": "warn",
            "jsonc/no-numeric-separators": "warn",
            "jsonc/no-octal": "warn",
            "jsonc/no-octal-escape": "warn",
            "jsonc/no-octal-numeric-literals": "warn",
            "jsonc/no-parenthesized": "warn",
            "jsonc/no-plus-sign": "warn",
            "jsonc/no-regexp-literals": "warn",
            "jsonc/no-sparse-arrays": "warn",
            "jsonc/no-template-literals": "warn",
            "jsonc/no-undefined-value": "warn",
            "jsonc/no-unicode-codepoint-escapes": "warn",
            "jsonc/no-useless-escape": "warn",
            "jsonc/object-curly-newline": "warn",
            "jsonc/object-curly-spacing": "warn",
            "jsonc/object-property-newline": "warn",
            "jsonc/quote-props": "warn",
            "jsonc/quotes": "warn",
            "jsonc/sort-array-values": [
                "error",
                {
                    order: { type: "asc" },
                    pathPattern: "^files$", // Hits the files property
                },
                {
                    order: [
                        "eslint",
                        "eslintplugin",
                        "eslint-plugin",
                        {
                            // Fallback order
                            order: { type: "asc" },
                        },
                    ],
                    pathPattern: "^keywords$", // Hits the keywords property
                },
            ],
            "jsonc/sort-keys": [
                "error",
                // For example, a definition for package.json
                {
                    order: [
                        "name",
                        "version",
                        "private",
                        "publishConfig",
                        // ...
                    ],
                    pathPattern: "^$", // Hits the root properties
                },
                {
                    order: { type: "asc" },
                    pathPattern:
                        "^(?:dev|peer|optional|bundled)?[Dd]ependencies$",
                },
                // ...
            ],
            "jsonc/space-unary-ops": "warn",
            "jsonc/valid-json-number": "warn",
            "jsonc/vue-custom-block/no-parsing-error": "warn",
            "no-secrets/no-pattern-match": "off",
            "no-secrets/no-secrets": [
                "error",
                {
                    tolerance: 5,
                },
            ],
        },
    },
    // Treat tsconfig files as JSONC (they include comments)
    {
        files: ["**/tsconfig*.json"],
        language: "json/jsonc",
        languageOptions: {
            parser: jsoncEslintParser,
            parserOptions: { jsonSyntax: "JSONC" },
        },
        name: "JSONC - tsconfig files",
        plugins: coerceEslintPluginMap({
            json: json,
            jsonc: eslintPluginJsonc,
            ...jsonSchemaValidatorPlugins,
            "no-secrets": noSecrets,
        }),
        rules: {
            ...json.configs.recommended.rules,
            ...jsonSchemaValidatorRules,
            "no-secrets/no-pattern-match": "off",
            "no-secrets/no-secrets": [
                "error",
                {
                    tolerance: 5,
                },
            ],
        },
    },
    // ═══════════════════════════════════════════════════════════════════════════════
    // MARK: JSON (json/*)
    // ═══════════════════════════════════════════════════════════════════════════════
    {
        files: ["**/*.json"],
        ignores: ["**/tsconfig*.json"],
        language: "json/json",
        name: "JSON - **/*.JSON",
        plugins: coerceEslintPluginMap({
            json: json,
            ...jsonSchemaValidatorPlugins,
            "no-secrets": noSecrets,
        }),
        rules: {
            ...json.configs.recommended.rules,
            ...jsonSchemaValidatorRules,
            "json/sort-keys": ["warn"],
            "json/top-level-interop": "warn",
            "no-secrets/no-pattern-match": "off",
            "no-secrets/no-secrets": [
                "error",
                {
                    tolerance: 5,
                },
            ],
        },
    },
    // ═══════════════════════════════════════════════════════════════════════════════
    // MARK: JSON5 (json5/*)
    // ═══════════════════════════════════════════════════════════════════════════════
    {
        files: ["**/*.json5"],
        language: "json/json5",
        name: "JSON5 - **/*.JSON5",
        plugins: coerceEslintPluginMap({
            json: json,
            ...jsonSchemaValidatorPlugins,
            "no-secrets": noSecrets,
        }),
        rules: {
            ...json.configs.recommended.rules,
            ...jsonSchemaValidatorRules,
            "no-secrets/no-pattern-match": "off",
            "no-secrets/no-secrets": [
                "error",
                {
                    tolerance: 5,
                },
            ],
        },
    },
    // ═══════════════════════════════════════════════════════════════════════════════
    // MARK: TOML (toml/*)
    // ═══════════════════════════════════════════════════════════════════════════════
    {
        files: ["**/*.toml"],
        ignores: ["lychee.toml"],
        languageOptions: {
            parser: tomlEslintParser,
            parserOptions: { tomlVersion: "1.0.0" },
        },
        name: "TOML - **/*.TOML",
        plugins: coerceEslintPluginMap({ toml: eslintPluginToml }),
        rules: {
            // TOML Eslint Plugin Rules (toml/*)
            "toml/array-bracket-newline": "warn",
            "toml/array-bracket-spacing": "warn",
            "toml/array-element-newline": "warn",
            "toml/comma-style": "warn",
            "toml/indent": "off",
            "toml/inline-table-curly-spacing": "warn",
            "toml/key-spacing": "off",
            "toml/keys-order": "warn",
            "toml/no-mixed-type-in-array": "warn",
            "toml/no-non-decimal-integer": "warn",
            "toml/no-space-dots": "warn",
            "toml/no-unreadable-number-separator": "warn",
            "toml/padding-line-between-pairs": "warn",
            "toml/padding-line-between-tables": "warn",
            "toml/precision-of-fractional-seconds": "warn",
            "toml/precision-of-integer": "warn",
            "toml/quoted-keys": "warn",
            "toml/spaced-comment": "warn",
            "toml/table-bracket-spacing": "warn",
            "toml/tables-order": "warn",
            "toml/vue-custom-block/no-parsing-error": "warn",
        },
    },
    // ═══════════════════════════════════════════════════════════════════════════════
    // MARK: YAML/YML files
    // ═══════════════════════════════════════════════════════════════════════════════
    {
        files: ["**/*.{yaml,yml}"],
        ignores: [],
        language: "yml/yaml",
        languageOptions: {
            parser: yamlEslintParser,
            // Options used with yaml-eslint-parser.
            parserOptions: {
                defaultYAMLVersion: "1.2",
            },
        },
        name: "YAML/YML - **/*.{YAML,YML}",
        plugins: coerceEslintPluginMap({
            ...jsonSchemaValidatorPlugins,
            yml: eslintPluginYml,
        }),
        rules: {
            ...jsonSchemaValidatorRules,
            "yml/block-mapping": "warn",
            "yml/block-mapping-colon-indicator-newline": "error",
            "yml/block-mapping-question-indicator-newline": "error",
            "yml/block-sequence": "warn",
            "yml/block-sequence-hyphen-indicator-newline": "error",
            "yml/file-extension": "off",
            "yml/flow-mapping-curly-newline": "error",
            "yml/flow-mapping-curly-spacing": "error",
            "yml/flow-sequence-bracket-newline": "error",
            "yml/flow-sequence-bracket-spacing": "error",
            "yml/indent": "off",
            "yml/key-name-casing": "off",
            "yml/key-spacing": "error",
            "yml/no-empty-document": "error",
            "yml/no-empty-key": "error",
            "yml/no-empty-mapping-value": "error",
            "yml/no-empty-sequence-entry": "error",
            "yml/no-irregular-whitespace": "error",
            "yml/no-multiple-empty-lines": "error",
            "yml/no-tab-indent": "error",
            "yml/no-trailing-zeros": "error",
            "yml/plain-scalar": "off",
            "yml/quotes": "error",
            "yml/require-string-key": "error",
            // Re-enabled: eslint-plugin-yml v2.0.1 fixes the diff-sequences
            // import crash (TypeError: diff is not a function).
            "yml/sort-keys": "error",
            "yml/sort-sequence-values": "off",
            "yml/spaced-comment": "warn",
            "yml/vue-custom-block/no-parsing-error": "warn",
        },
    },
    // ═══════════════════════════════════════════════════════════════════════════════
    // MARK: HTML files
    // ═══════════════════════════════════════════════════════════════════════════════
    {
        files: ["**/*.{html,htm,xhtml}"],
        ignores: ["report/**"],
        languageOptions: {
            parser: htmlParser,
        },
        name: "HTML - **/*.{HTML,HTM,XHTML}",
        plugins: coerceEslintPluginMap({
            html: html,
            "styled-components-a11y": styledA11y,
            xss: xss,
        }),
        rules: {
            ...html.configs.recommended.rules,
            "html/class-spacing": "warn",
            "html/css-no-empty-blocks": "warn",
            "html/id-naming-convention": "warn",
            "html/indent": "error",
            "html/lowercase": "warn",
            "html/max-element-depth": "warn",
            "html/no-abstract-roles": "warn",
            "html/no-accesskey-attrs": "warn",
            "html/no-aria-hidden-body": "warn",
            "html/no-aria-hidden-on-focusable": "warn",
            "html/no-duplicate-class": "warn",
            "html/no-empty-headings": "warn",
            "html/no-extra-spacing-attrs": [
                "error",
                { enforceBeforeSelfClose: true },
            ],
            "html/no-extra-spacing-text": "warn",
            "html/no-heading-inside-button": "warn",
            "html/no-ineffective-attrs": "warn",
            // HTML Eslint Plugin Rules (html/*)
            "html/no-inline-styles": "warn",
            "html/no-invalid-entity": "warn",
            "html/no-invalid-role": "warn",
            "html/no-multiple-empty-lines": "warn",
            "html/no-nested-interactive": "warn",
            "html/no-non-scalable-viewport": "warn",
            "html/no-positive-tabindex": "warn",
            "html/no-restricted-attr-values": "warn",
            "html/no-restricted-attrs": "warn",
            "html/no-restricted-tags": "warn",
            "html/no-script-style-type": "warn",
            "html/no-skip-heading-levels": "warn",
            "html/no-target-blank": "warn",
            "html/no-trailing-spaces": "warn",
            "html/no-whitespace-only-children": "warn",
            "html/prefer-https": "warn",
            "html/require-attrs": "warn",
            "html/require-button-type": "warn",
            "html/require-closing-tags": "off",
            "html/require-explicit-size": "warn",
            "html/require-form-method": "warn",
            "html/require-frame-title": "warn",
            "html/require-input-label": "warn",
            "html/require-meta-charset": "warn",
            "html/require-meta-description": "warn",
            "html/require-meta-viewport": "warn",
            "html/require-open-graph-protocol": "warn",
            "html/sort-attrs": "warn",
            "html/use-baseline": "off",
            "styled-components-a11y/lang": "off",
            "xss/no-mixed-html": [
                "off",
                {
                    encoders: [
                        "utils.htmlEncode()",
                        "CSS.escape()",
                        "Number()",
                    ],
                    unsafe: [".html()"],
                },
            ],
        },
    },
    // ═══════════════════════════════════════════════════════════════════════════════
    // MARK: HTML in JS/TS files (HTML Literals)
    // ═══════════════════════════════════════════════════════════════════════════════
    {
        files: ["**/*.{ts,tsx,mts,cts,mjs,js,jsx,cjs}"],
        ignores: ["report/**"],
        name: "HTML in JS/TS - **/*.{TS,TSX,MTS,CTS,MJS,JS,JSX,CJS}",
        plugins: coerceEslintPluginMap({
            html: html,
            "styled-components-a11y": styledA11y,
            xss: xss,
        }),
        rules: {
            // HTML Eslint Plugin Rules (html/*)
            ...html.configs.recommended.rules,
            "html/indent": "error",
            "html/no-extra-spacing-attrs": [
                "error",
                { enforceBeforeSelfClose: true },
            ],
            "html/require-closing-tags": "off",
            "styled-components-a11y/lang": "off",
            "xss/no-mixed-html": [
                "off",
                {
                    encoders: [
                        "utils.htmlEncode()",
                        "CSS.escape()",
                        "Number()",
                    ],
                    unsafe: [".html()"],
                },
            ],
        },
    },
    // ═══════════════════════════════════════════════════════════════════════════════
    // MARK: JS JsDoc
    // ═══════════════════════════════════════════════════════════════════════════════
    {
        files: ["**/*.{js,cjs}"],
        languageOptions: {
            globals: {
                ...globals.node,
                __dirname: "readonly",
                __filename: "readonly",
                module: "readonly",
                process: "readonly",
                require: "readonly",
            },
        },
        name: "JS JSDoc - **/*.{JS,CJS}",
        plugins: coerceEslintPluginMap({ jsdoc: jsdocPlugin }),
        rules: {
            // "jsdoc/check-access": "warn", // Recommended
            // "jsdoc/check-alignment": "warn", // Recommended
            // "jsdoc/check-indentation": "warn",
            // "jsdoc/check-line-alignment": "warn",
            // "jsdoc/check-param-names": "warn", // Recommended
            // "jsdoc/check-property-names": "warn", // Recommended
            // "jsdoc/check-syntax": "warn",
            // "jsdoc/check-tag-names": "off", // Recommended
            // "jsdoc/check-template-names": "warn",
            // "jsdoc/check-types": "warn", // Recommended
            // "jsdoc/check-values": "warn", // Recommended
            // "jsdoc/convert-to-jsdoc-comments": "warn",
            // "jsdoc/empty-tags": "warn", // Recommended
            // "jsdoc/escape-inline-tags": "warn", // Recommended for TS configs
            // "jsdoc/implements-on-classes": "warn", // Recommended
            // "jsdoc/imports-as-dependencies": "warn",
            // "jsdoc/informative-docs": "off",
            // "jsdoc/lines-before-block": "warn",
            // "jsdoc/match-description": "off",
            // "jsdoc/match-name": "off",
            // "jsdoc/multiline-blocks": "warn", // Recommended
            // "jsdoc/no-bad-blocks": "warn",
            // "jsdoc/no-blank-block-descriptions": "warn",
            // "jsdoc/no-blank-blocks": "warn", // Recommended
            // "jsdoc/no-defaults": "warn", // Recommended
            // "jsdoc/no-missing-syntax": "off",
            // "jsdoc/no-multi-asterisks": "warn", // Recommended
            // "jsdoc/no-restricted-syntax": "off",
            // "jsdoc/no-types": "off", // Recommended for TS configs
            // "jsdoc/no-undefined-types": "warn", // Recommended for non-TS configs
            // "jsdoc/prefer-import-tag": "off",
            // "jsdoc/reject-any-type": "off",
            // "jsdoc/reject-function-type": "warn", // Recommended
            // "jsdoc/require-asterisk-prefix": "warn",
            // "jsdoc/require-description": "off",
            // "jsdoc/require-description-complete-sentence": "off",
            // "jsdoc/require-example": "off",
            // "jsdoc/require-file-overview": "off",
            // "jsdoc/require-hyphen-before-param-description": "warn",
            // "jsdoc/require-jsdoc": "warn", // Recommended
            // "jsdoc/require-next-description": "warn",
            // "jsdoc/require-next-type": "warn", // Recommended
            // "jsdoc/require-param": "off", // Recommended
            // "jsdoc/require-param-description": "off", // Recommended
            // "jsdoc/require-param-name": "warn", // Recommended
            // "jsdoc/require-param-type": "warn", // Recommended in non-TS configs
            // "jsdoc/require-property": "warn", // Recommended
            // "jsdoc/require-property-description": "off", // Recommended
            // "jsdoc/require-property-name": "warn", // Recommended
            // "jsdoc/require-property-type": "warn", // Recommended in non-TS configs
            // "jsdoc/require-rejects": "warn", // Recommended
            // "jsdoc/require-returns": "off", // Recommended
            // "jsdoc/require-returns-check": "warn", // Recommended
            // "jsdoc/require-returns-description": "off", // Recommended
            // "jsdoc/require-returns-type": "warn", // Recommended in non-TS configs
            // "jsdoc/require-tags": "off",
            // "jsdoc/require-template": "warn",
            // "jsdoc/require-template-description": "warn",
            // "jsdoc/require-throws": "off",
            // "jsdoc/require-throws-description": "off",
            // "jsdoc/require-throws-type": "warn", // Recommended
            // "jsdoc/require-yields": "warn", // Recommended
            // "jsdoc/require-yields-check": "warn", // Recommended
            // "jsdoc/require-yields-description": "warn",
            // "jsdoc/require-yields-type": "warn", // Recommended
            // "jsdoc/sort-tags": "off",
            // "jsdoc/tag-lines": "off", // Recommended
            // "jsdoc/text-escaping": "off",
            // "jsdoc/ts-method-signature-style": "warn",
            // "jsdoc/ts-no-empty-object-type": "warn",
            // "jsdoc/ts-no-unnecessary-template-expression": "warn",
            // "jsdoc/ts-prefer-function-type": "warn",
            // "jsdoc/type-formatting": "off",
            // "jsdoc/valid-types": "warn", // Recommended
            // "jsdoc/check-examples": "warn", // Deprecated and not for ESLint >= 8
            // "jsdoc/rejct-any-type": "warn", // broken
        },
    },
    // ═══════════════════════════════════════════════════════════════════════════════
    // MARK: JS/MJS Configuration files
    // ═══════════════════════════════════════════════════════════════════════════════
    {
        files: [
            "**/*.config.{js,mjs,cts,cjs}",
            "**/*.config.**.*.{js,mjs,cts,cjs}",
        ],
        languageOptions: {
            globals: {
                ...globals.node,
                __dirname: "readonly",
                __filename: "readonly",
                module: "readonly",
                process: "readonly",
                require: "readonly",
            },
        },
        name: "JS/MJS Config - **/*.config.{JS,MJS,CTS,CJS}",
        plugins: coerceEslintPluginMap({
            "@typescript-eslint": tseslint,
            compat: pluginCompat,
            css: css,
            depend: depend,
            "import-x": importX,
            js: js,
            "jsx-a11y": jsxA11y,
            math: eslintPluginMath,
            n: nodePlugin,
            "no-unsanitized": nounsanitized,
            perfectionist: pluginPerfectionist,
            "prefer-arrow": pluginPreferArrow,
            prettier: pluginPrettier,
            promise: pluginPromise,
            react: pluginReact,
            "react-hooks": reactHooks,
            "react-perf": reactPerfPlugin,
            redos: pluginRedos,
            regexp: pluginRegexp,
            security: pluginSecurity,
            sonarjs: sonarjs,
            "sort-class-members": pluginSortClassMembers,
            unicorn: pluginUnicorn,
            "unused-imports": pluginUnusedImports,
            "write-good-comments": pluginWriteGood,
        }),
        rules: {
            ...coerceRulesRecord(js.configs.all.rules),
            ...coerceRulesRecord(pluginRegexp.configs.all.rules),
            ...coerceRulesRecord(importX.flatConfigs.recommended.rules),
            ...coerceRulesRecord(importX.flatConfigs.electron.rules),
            ...coerceRulesRecord(importX.flatConfigs.react.rules),
            ...coerceRulesRecord(importX.flatConfigs.typescript.rules),
            ...coerceRulesRecord(
                pluginPromiseWithConfigs.configs["flat/recommended"].rules
            ),
            ...coerceRulesRecord(pluginUnicorn.configs.all.rules),
            ...coerceRulesRecord(pluginReact.configs.all.rules),
            ...coerceRulesRecord(
                reactHooks.configs["recommended-latest"].rules
            ),
            ...coerceRulesRecord(jsxA11y.flatConfigs.strict.rules),
            ...coerceRulesRecord(sonarjsConfigs.recommended.rules),
            ...coerceRulesRecord(
                pluginPerfectionist.configs["recommended-natural"].rules
            ),
            ...coerceRulesRecord(pluginRedos.configs.recommended.rules),
            ...coerceRulesRecord(pluginSecurity.configs.recommended.rules),
            ...coerceRulesRecord(nodePlugin.configs["flat/recommended"].rules),
            ...coerceRulesRecord(eslintPluginMath.configs.recommended.rules),
            camelcase: "off",
            "capitalized-comments": [
                "error",
                "always",
                {
                    ignoreConsecutiveComments: true,
                    ignoreInlineComments: true,
                    ignorePattern:
                        "pragma|ignored|import|prettier|eslint|tslint|copyright|license|eslint-disable|@ts-.*|jsx-a11y.*|@eslint.*|global|jsx|jsdoc|prettier|istanbul|jcoreio|metamask|microsoft|no-unsafe-optional-chaining|no-unnecessary-type-assertion|no-non-null-asserted-optional-chain|no-non-null-asserted-nullish-coalescing|@typescript-eslint.*|@docusaurus.*|@react.*|boundaries.*|depend.*|deprecation.*|etc.*|ex.*|functional.*|import-x.*|import-zod.*|jsx-a11y.*|loadable-imports.*|math.*|n.*|neverthrow.*|no-constructor-bind.*|no-explicit-type-exports.*|no-function-declare-after-return.*|no-lookahead-lookbehind-regexp.*|no-secrets.*|no-unary-plus.*|no-unawaited-dot-catch-throw.*|no-unsanitized.*|no-use-extend-native.*|observers.*|prefer-arrow.*|perfectionist.*|prettier.*|promise.*|react.*|react-hooks.*|react-hooks-addons.*|redos.*|regexp.*|require-jsdoc.*|safe-jsx.*|security.*|sonarjs.*|sort-class-members.*|sort-destructure-keys.*|sort-keys-fix.*|sql-template.*|ssr-friendly.*|styled-components-a11y.*|switch-case.*|total-functions.*|tsdoc.*|unicorn.*|unused-imports.*|usememo-recommendations.*|validate-jsx-nesting.*|write-good-comments.*|xss.*",
                },
            ],
            "class-methods-use-this": "off",
            "depend/ban-dependencies": [
                "warn",
                {
                    allowed: [
                        "eslint-plugin-react",
                        "axios",
                    ],
                },
            ],
            "dot-notation": "off",
            "func-style": "off",
            "id-length": "off",
            "max-classes-per-file": "off",
            "max-lines": "off",
            // Sonar quality helpers
            "max-lines-per-function": [
                "error",
                {
                    IIFEs: false,
                    max: 1000,
                    skipBlankLines: true,
                    skipComments: true,
                },
            ],
            "max-params": "off",
            "max-statements": "off",
            "no-console": "off",
            "no-inline-comments": "off",
            "no-magic-numbers": "off",
            "no-plusplus": "off",
            "no-ternary": "off",
            "no-undef-init": "off",
            "no-undefined": "off",
            "no-void": "off",
            "object-shorthand": "off",
            "one-var": "off",
            "prefer-arrow-callback": [
                "warn",
                { allowNamedFunctions: true, allowUnboundThis: true },
            ],
            "regexp/require-unicode-regexp": "off",
            "regexp/require-unicode-sets-regexp": "off",
            "require-await": "off",
            "require-unicode-regexp": "off",
            "sonarjs/arguments-usage": "warn",
            "sonarjs/array-constructor": "warn",
            "sonarjs/aws-iam-all-resources-accessible": "warn",
            "sonarjs/cognitive-complexity": [
                "warn",
                30,
            ],
            "sonarjs/comment-regex": "warn",
            "sonarjs/declarations-in-global-scope": "off",
            "sonarjs/elseif-without-else": "off",
            "sonarjs/for-in": "warn",
            "sonarjs/nested-control-flow": "off",
            "sonarjs/no-built-in-override": "warn",
            "sonarjs/no-collapsible-if": "warn",
            "sonarjs/no-duplicate-string": "off",
            "sonarjs/no-for-in-iterable": "warn",
            "sonarjs/no-function-declaration-in-block": "warn",
            "sonarjs/no-implicit-dependencies": "off",
            "sonarjs/no-inconsistent-returns": "warn",
            "sonarjs/no-incorrect-string-concat": "warn",
            "sonarjs/no-nested-incdec": "warn",
            "sonarjs/no-nested-switch": "warn",
            "sonarjs/no-reference-error": "warn",
            "sonarjs/no-require-or-define": "warn",
            "sonarjs/no-return-type-any": "warn",
            "sonarjs/no-sonar-comments": "error",
            "sonarjs/no-undefined-assignment": "off",
            "sonarjs/no-unused-function-argument": "warn",
            "sonarjs/non-number-in-arithmetic-expression": "warn",
            "sonarjs/operation-returning-nan": "warn",
            "sonarjs/prefer-immediate-return": "warn",
            "sonarjs/shorthand-property-grouping": "off",
            "sonarjs/strings-comparison": "warn",
            "sonarjs/too-many-break-or-continue-in-loop": "warn",
            "sort-imports": "off",
            "sort-keys": "off",
            "import-x/no-named-as-default-member": "off",
            "perfectionist/sort-objects": "off",
            // Config files routinely import devDependencies and local tooling.
            "n/no-extraneous-import": "off",
            "n/no-unpublished-import": "off",
            "unicorn/consistent-function-scoping": "off", // Configs often use different scoping
            "unicorn/filename-case": "off", // Allow config files to have any case
            "unicorn/import-style": [
                "error",
                {
                    styles: {
                        fs: { default: false, named: true, namespace: true },
                        // ─────────────────────────────────────────────────────────────
                        // crypto: disallow default imports, allow named + namespace
                        // (named is most common; namespace is sometimes handy)
                        // ─────────────────────────────────────────────────────────────
                        "node:crypto": {
                            default: false,
                            named: true,
                            namespace: true,
                        },
                        // ─────────────────────────────────────────────────────────────
                        // Filesystem: disallow default imports, but allow named + namespace
                        // (named is ergonomic; namespace is useful for vi.spyOn(fs, "..."))
                        // ─────────────────────────────────────────────────────────────
                        "node:fs": {
                            default: false,
                            named: true,
                            namespace: true,
                        },
                        "node:fs/promises": {
                            default: false,
                            named: true,
                            namespace: true,
                        },
                        // ─────────────────────────────────────────────────────────────
                        // Node “path-like” modules: allow ONLY namespace imports
                        // (prevents `import path from "node:path"` which relies on default interop)
                        // ─────────────────────────────────────────────────────────────
                        "node:path": { default: false, namespace: true },
                        "node:path/posix": { default: false, namespace: true },
                        "node:path/win32": { default: false, namespace: true },
                        // ─────────────────────────────────────────────────────────────
                        // timers/promises: named is the common usage
                        // ─────────────────────────────────────────────────────────────
                        "node:timers/promises": { named: true },
                        // ─────────────────────────────────────────────────────────────
                        // util: keep unicorn’s intent (named only)
                        // ─────────────────────────────────────────────────────────────
                        "node:util": { named: true },
                        path: { default: false, namespace: true }, // Just in case any non-node: path remains
                        util: { named: true },
                    },
                },
            ],
            "unicorn/no-await-expression-member": "off", // Allow await in config expressions
            "unicorn/no-keyword-prefix": [
                "error",
                {
                    checkProperties: false,
                    disallowedPrefixes: [
                        "interface",
                        "type",
                        "enum",
                    ],
                },
            ], // Allow "class" prefix for className and other legitimate uses
            "unicorn/no-null": "off", // Null is common in config setups
            "unicorn/no-unused-properties": "off", // Allow unused properties in config setups
            "unicorn/no-useless-undefined": "off", // Allow undefined in config setups
            "unicorn/prefer-import-meta-properties": "off", // Allow explicit import.meta.url handling
            "unicorn/prefer-module": "off", // Config files may use CommonJS
            "unicorn/prevent-abbreviations": "off", // Too many false positives in configs
            "unused-imports/no-unused-imports": "error",
        },
        settings: {
            "import-x/resolver": {
                node: true,
            },
            n: {
                allowModules: [
                    "electron",
                    "node",
                    "electron-devtools-installer",
                ],
            },
            react: { version: "19" },
        },
    },
    // ═══════════════════════════════════════════════════════════════════════════════
    // MARK: Tests (Playwright)
    // ═══════════════════════════════════════════════════════════════════════════════
    {
        files: [
            "playwright/**/*.{ts,tsx,mts,cts,mjs,js,jsx,cjs}",
            "**/*.playwright.{ts,tsx,mts,cts,mjs,js,jsx,cjs}",
            "**/playwright/*.{ts,tsx,mts,cts,mjs,js,jsx,cjs}",
        ],
        name: "Playwright E2E Tests - playwright/**/*.{TS,TSX,MTS,CTS,MJS,JS,JSX,CJS}",
        ...playwright.configs["flat/recommended"],
        languageOptions: {
            globals: {
                ...globals.node,
                ...vitest.environments.env.globals,
                __dirname: "readonly",
                __filename: "readonly",
                Buffer: "readonly",
                global: "readonly",
                module: "readonly",
                process: "readonly",
                require: "readonly",
            },
            parser: tseslintParser,
            parserOptions: {
                ecmaFeatures: {
                    impliedStrict: true,
                    jsx: true,
                },
                ecmaVersion: "latest",
                jsDocParsingMode: "all",
                project: "playwright/tsconfig.json",
                sourceType: "module",
                tsconfigRootDir: configRootDir,
                warnOnUnsupportedTypeScriptVersion: true,
            },
        },
        plugins: coerceEslintPluginMap({
            ...playwright.configs["flat/recommended"].plugins,
            "@typescript-eslint": tseslint,
            playwright: playwright,
            "testing-library": pluginTestingLibrary,
            vitest: vitest,
        }),
        rules: {
            ...playwright.configs["flat/recommended"].rules,
            ...pluginTestingLibrary.configs["flat/dom"].rules,
            "@jcoreio/implicit-dependencies/no-implicit": "off",
            // TypeScript and testing-specific overrides for Playwright
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    args: "after-used",
                    argsIgnorePattern: "^_",
                    ignoreRestSiblings: true,
                    varsIgnorePattern: "^_",
                },
            ],
            "import-x/no-unresolved": "off", // Playwright has special imports
            "no-console": "off", // Allow console in tests
            "no-magic-numbers": "off", // Test data may have magic numbers
            // Enhanced Playwright-specific rules
            "playwright/expect-expect": "error",
            "playwright/max-expects": [
                "error",
                { max: 10 },
            ],
            "playwright/max-nested-describe": [
                "error",
                { max: 4 },
            ],
            "playwright/missing-playwright-await": "error",
            "playwright/no-commented-out-tests": "warn",
            // Conditional logic in tests is usually an indication that a test is attempting to cover too much, and not testing the logic it intends to. Each branch of code executing within a conditional statement will usually be better served by a test devoted to it.
            "playwright/no-conditional-in-test": "error",
            "playwright/no-duplicate-hooks": "error",
            "playwright/no-element-handle": "warn",
            "playwright/no-eval": "error",
            "playwright/no-focused-test": "error",
            "playwright/no-force-option": "warn",
            "playwright/no-get-by-title": "error",
            "playwright/no-hooks": "off", // Disabling - hooks are needed in most projects
            "playwright/no-nested-step": "error",
            "playwright/no-networkidle": "warn",
            "playwright/no-nth-methods": "off",
            "playwright/no-page-pause": "warn",
            "playwright/no-raw-locators": [
                "error",
                {
                    allowed: [
                        "iframe",
                        "[aria-busy='false']",
                    ],
                },
            ],
            "playwright/no-restricted-locators": "off", // Disabling - restricting locators is often unnecessary
            "playwright/no-restricted-matchers": "off", // Disabling - restricting matchers is often unnecessary
            "playwright/no-skipped-test": "warn",
            "playwright/no-slowed-test": "off",
            "playwright/no-useless-await": "error",
            "playwright/no-useless-not": "error",
            "playwright/no-wait-for-selector": "warn",
            "playwright/no-wait-for-timeout": "warn",
            "playwright/prefer-comparison-matcher": "warn",
            "playwright/prefer-equality-matcher": "warn",
            "playwright/prefer-hooks-in-order": "warn",
            "playwright/prefer-hooks-on-top": "warn",
            "playwright/prefer-locator": "warn",
            "playwright/prefer-lowercase-title": "warn",
            "playwright/prefer-native-locators": "warn",
            "playwright/prefer-strict-equal": "warn",
            "playwright/prefer-to-be": "warn",
            "playwright/prefer-to-contain": "warn",
            "playwright/prefer-to-have-count": "warn",
            "playwright/prefer-to-have-length": "warn",
            "playwright/prefer-web-first-assertions": "error",
            "playwright/require-hook": "off", // Disabling - not always required
            "playwright/require-soft-assertions": "off", // Disabling - soft assertions are not always desirable
            "playwright/require-to-throw-message": "warn",
            "playwright/require-top-level-describe": "warn",
            "playwright/valid-expect": "error",
            "playwright/valid-title": "error",
            "prefer-arrow-callback": "off", // Test functions don't need arrow syntax
            "testing-library/prefer-screen-queries": "off", // Allow destructuring from render result
            "unicorn/consistent-function-scoping": "off", // Test helpers
            "unicorn/no-await-expression-member": "off", // Common in Playwright
        },
        settings: {
            "import-x/resolver": {
                node: true,
                typescript: {
                    alwaysTryTypes: true,
                    project: [
                        "./tsconfig.json",
                        "./playwright.config.ts",
                    ],
                },
            },
            playwright: {
                additionalAssertFunctionNames: [
                    "expectToBeVisible",
                    "expectToHaveText",
                    "expectToHaveCount",
                ],
            },
        },
    },
    // ═══════════════════════════════════════════════════════════════════════════════
    // MARK: Storybook
    // ═══════════════════════════════════════════════════════════════════════════════
    ...coerceConfigWithExtendsArray(storybook.configs["flat/recommended"]),
    ...coerceConfigWithExtendsArray(storybook.configs["flat/csf-strict"]),
    ...coerceConfigWithExtendsArray(
        storybook.configs["flat/addon-interactions"]
    ),
    {
        files: [
            ".storybook/**/*.{ts,tsx,mts,cts}",
            "storybook/main.ts",
            "storybook/preview.ts",
        ],
        name: "Storybook Config - .storybook/**/*.{TS,TSX,MTS,CTS}",
        rules: {
            "@jcoreio/implicit-dependencies/no-implicit": "off",
            "canonical/filename-match-exported": "off",
            // Node-style config code is expected here
            "import-x/no-nodejs-modules": "off",
            "n/no-missing-import": "off",
            "n/no-unpublished-import": "off",
            "unicorn/prefer-import-meta-properties": "off",
        },
    },
    // ═══════════════════════════════════════════════════════════════════════════════
    // MARK: Storybook Stories
    // ═══════════════════════════════════════════════════════════════════════════════
    {
        files: ["storybook/**/*.stories.tsx"],
        name: "Storybook Stories - storybook/**/*.stories.tsx",
        rules: {
            "@arthurgeron/react-usememo/require-usememo": "off",
            "@eslint-react/jsx-no-iife": "off",
            "@eslint-react/jsx-shorthand-fragment": "off",
            "@eslint-react/no-useless-fragment": "off",
            "@eslint-react/prefer-destructuring-assignment": "off",
            // Storybook stories are demo code, loosen the grip for now
            "@eslint-react/prefer-read-only-props": "off",
            "@eslint-react/prefer-shorthand-fragment": "off",
            "@jcoreio/implicit-dependencies/no-implicit": "off",
            "@metamask/design-tokens/color-no-hex": "off",
            "@typescript-eslint/array-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-confusing-void-expression": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-shadow": "off",
            "@typescript-eslint/no-unnecessary-condition": "off",
            "@typescript-eslint/no-unnecessary-type-parameters": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-return": "off",
            "@typescript-eslint/no-unsafe-type-assertion": "off",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { args: "none", varsIgnorePattern: "^_ignored$" },
            ],
            "@typescript-eslint/no-useless-default-assignment": "warn",
            "@typescript-eslint/require-await": "off",
            "@typescript-eslint/strict-void-return": "warn",
            "canonical/filename-match-exported": "off",
            "capitalized-comments": "off",
            "clean-timer/assign-timer-id": "off",
            "function-name/starts-with-verb": "off",
            "jsx-a11y/label-has-associated-control": "off",
            "nitpick/no-redundant-vars": "off",
            "perfectionist/sort-jsx-props": "off",
            "perfectionist/sort-objects": "off",
            "perfectionist/sort-union-types": "off",
            "prettier/prettier": "off", // Using in Prettier directly for less noise for AI
            "react-perf/jsx-no-jsx-as-prop": "off",
            "react-perf/jsx-no-new-function-as-prop": "off",
            "react-perf/jsx-no-new-object-as-prop": "off",
            "react/jsx-fragments": "off",
            "react/jsx-no-bind": "off",
            "react/jsx-no-useless-fragment": "off",
            "react/no-array-index-key": "off",
            "regexp/letter-case": "off",
            "regexp/prefer-named-capture-group": "off",
            "regexp/require-unicode-regexp": "off",
            "regexp/require-unicode-sets-regexp": "off",
            "sonarjs/no-hardcoded-ip": "off",
            "sonarjs/pseudo-random": "off",
            "sonarjs/void-use": "off",
            "storybook/csf-component": "warn",
            "storybook/meta-inline-properties": "warn",
            "storybook/meta-satisfies-type": "warn",
            "storybook/no-renderer-packages": "warn",
            "storybook/no-stories-of": "warn",
            "storybook/no-title-property-in-meta": "warn",
            // Story metadata is already documented by component-level TSDoc.
            // Disable tsdoc-require here to avoid noisy warnings on Storybook
            // `meta` objects that are not part of the public API surface.
            "tsdoc-require/require": "off",
        },
    },
    // ═══════════════════════════════════════════════════════════════════════════════
    // MARK: Github Workflows YAML/YML
    // ═══════════════════════════════════════════════════════════════════════════════
    {
        files: [
            "**/.github/workflows/**/*.{yaml,yml}",
            "config/tools/flatpak-build.yml",
            "**/dependabot.yml",
            "**/.spellcheck.yml",
            "**/.pre-commit-config.yaml",
        ],
        name: "YAML/YML GitHub Workflows - Disables",
        rules: {
            "yml/block-mapping-colon-indicator-newline": "off",
            "yml/no-empty-key": "off",
            "yml/no-empty-mapping-value": "off",
            "yml/sort-keys": "off",
        },
    },
    // ═══════════════════════════════════════════════════════════════════════════════
    // MARK: Disable JSON Sort-keys
    // ═══════════════════════════════════════════════════════════════════════════════
    {
        files: [
            "**/package.json",
            "**/package-lock.json",
        ],
        name: "JSON: Files - Disables",
        rules: {
            "json/sort-keys": "off",
        },
    },
    {
        files: ["**/.vscode/**"],
        name: "VS Code Files - Disables",
        rules: {
            "jsonc/array-bracket-newline": "off",
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
        ],
    },
    // Place Prettier last to turn off rules that conflict with Prettier formatting
    eslintConfigPrettier,
]);
