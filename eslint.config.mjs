import dependPlugin from "eslint-plugin-depend";
import nickTwoBadFourU from "eslint-config-nick2bad4u";
import globals from "globals";

const electronAppBasePath = "electron-app";
const electronAppSharedConfig = nickTwoBadFourU.configs.all.map((entry) => ({
    ...entry,
    basePath: electronAppBasePath,
}));

/** @type {import("eslint").Linter.Config[]} */
const config = [
    {
        ignores: ["playwright-report/**", "test-results/**"],
    },
    {
        basePath: electronAppBasePath,
        ignores: [
            ".cache/**",
            "coverage/**",
            "dist/**",
            "**/main.js",
            "**/tests/jsdomSetup.js",
            "**/*.css",
            "ffv/**",
            "fitParser.js",
            "**/*.html",
            "html/**",
            "main-ui.js",
            "main/**/*.js",
            "preload.js",
            "preload/**/*.js",
            "shared/**/*.js",
            "temp-win7/**",
            "test-results/**",
            "types/**",
            "ui/**/*.js",
            "utils/**/*.js",
            "utils.js",
            "vendor/**",
            "windowStateUtils.js",
        ],
    },
    ...nickTwoBadFourU.configs.all,
    ...electronAppSharedConfig,
    {
        basePath: electronAppBasePath,
        files: ["**/*.{cjs,js,mjs,ts,tsx}"],
        languageOptions: {
            parserOptions: {
                project: ["./tsconfig.electron-app.eslint.json"],
            },
        },
    },
    {
        basePath: electronAppBasePath,
        files: [
            "fitParser.ts",
            "main.ts",
            "preload.ts",
        ],
        languageOptions: {
            globals: globals.node,
        },
        rules: {
            "@typescript-eslint/consistent-type-imports": "off",
            "@typescript-eslint/explicit-member-accessibility": "off",
            "@typescript-eslint/no-require-imports": "off",
            "@typescript-eslint/no-unnecessary-type-parameters": "off",
            "@typescript-eslint/no-unsafe-type-assertion": "off",
            "@typescript-eslint/prefer-readonly-parameter-types": "off",
            "import-x/no-commonjs": "off",
            "import-x/unambiguous": "off",
            "n/no-missing-require": [
                "error",
                {
                    tryExtensions: [
                        ".js",
                        ".json",
                        ".node",
                        ".ts",
                    ],
                },
            ],
            "n/prefer-global/buffer": "off",
            "no-undef": "off",
            "perfectionist/sort-interfaces": "off",
            "perfectionist/sort-modules": "off",
            "tsdoc/syntax": "off",
            "unicorn/filename-case": "off",
            "unicorn/prefer-module": "off",
        },
    },
    {
        basePath: electronAppBasePath,
        files: ["global.d.ts"],
        rules: {
            "n/no-extraneous-import": "off",
            "n/no-unpublished-import": "off",
        },
    },
    {
        basePath: electronAppBasePath,
        files: ["main-ui.ts", "main.ts"],
        rules: {
            "@typescript-eslint/no-unsafe-type-assertion": "off",
            "@typescript-eslint/prefer-readonly-parameter-types": "off",
        },
    },
    {
        basePath: electronAppBasePath,
        files: ["renderer.ts"],
        rules: {
            "@typescript-eslint/ban-ts-comment": "off",
            "@typescript-eslint/no-redundant-type-constituents": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-return": "off",
            "@typescript-eslint/no-unsafe-type-assertion": "off",
            "@typescript-eslint/prefer-readonly-parameter-types": "off",
            "runtime-cleanup/no-floating-timers": "off",
            "runtime-cleanup/no-unmanaged-event-listeners": "off",
            "typedoc/no-duplicate-param-tags": "off",
            "typedoc/no-extra-param-tags": "off",
            "typedoc/no-unknown-tags": "off",
            "typedoc/require-throws-tag": "off",
            "tsdoc/syntax": "off",
        },
    },
    {
        basePath: electronAppBasePath,
        files: ["fitParser.ts"],
        rules: {
            "@typescript-eslint/consistent-type-imports": "off",
            "@typescript-eslint/no-unsafe-type-assertion": "off",
            "@typescript-eslint/prefer-readonly-parameter-types": "off",
            "n/global-require": "off",
            "no-unsanitized/method": "off",
        },
    },
    {
        basePath: electronAppBasePath,
        files: ["package.json"],
        plugins: {
            depend: dependPlugin,
        },
        rules: {
            "depend/ban-dependencies": [
                "error",
                {
                    allowed: ["jquery"],
                },
            ],
            "node-dependencies/absolute-version": [
                "error",
                {
                    devDependencies: "never",
                    overridePackages: {
                        electron: {
                            devDependencies: "ignore",
                        },
                    },
                },
            ],
            "package-json/require-peerDependencies": "off",
        },
    },
    {
        basePath: electronAppBasePath,
        files: ["renderer/vendorGlobals.ts"],
        plugins: {
            depend: dependPlugin,
        },
        rules: {
            "depend/ban-dependencies": [
                "error",
                {
                    allowed: ["jquery"],
                },
            ],
        },
    },
    {
        files: ["playwright.config.ts"],
        rules: {
            "module-interop/no-require-esm": "off",
        },
    },
    {
        basePath: electronAppBasePath,
        files: [
            "**/*.spec.js",
            "**/*.spec.ts",
            "**/*.test.js",
            "**/*.test.ts",
            "tests/**",
        ],
        linterOptions: {
            reportUnusedDisableDirectives: "off",
        },
        rules: {
            "@typescript-eslint/no-useless-default-assignment": "off",
            "@typescript-eslint/strict-void-return": "off",
            "case-police/string-check": "off",
            "tsdoc/syntax": "off",
            "typedoc/no-unknown-tags": "off",
            "vitest/consistent-test-filename": "off",
            "vitest/consistent-test-it": "off",
            "vitest/hoisted-apis-on-top": "off",
            "vitest/max-expects": "off",
            "vitest/no-alias-methods": "off",
            "vitest/no-conditional-in-test": "off",
            "vitest/no-duplicate-hooks": "off",
            "vitest/no-hooks": "off",
            "vitest/no-identical-title": "off",
            "vitest/no-standalone-expect": "off",
            "vitest/padding-around-after-each-blocks": "off",
            "vitest/padding-around-all": "off",
            "vitest/padding-around-before-each-blocks": "off",
            "vitest/padding-around-describe-blocks": "off",
            "vitest/padding-around-expect-groups": "off",
            "vitest/padding-around-test-blocks": "off",
            "vitest/prefer-called-exactly-once-with": "off",
            "vitest/prefer-called-once": "off",
            "vitest/prefer-called-with": "off",
            "vitest/prefer-comparison-matcher": "off",
            "vitest/prefer-describe-function-title": "off",
            "vitest/prefer-equality-matcher": "off",
            "vitest/prefer-expect-assertions": "off",
            "vitest/prefer-expect-resolves": "off",
            "vitest/prefer-expect-type-of": "off",
            "vitest/prefer-hooks-in-order": "off",
            "vitest/prefer-import-in-mock": "off",
            "vitest/prefer-importing-vitest-globals": "off",
            "vitest/prefer-lowercase-title": "off",
            "vitest/prefer-mock-promise-shorthand": "off",
            "vitest/prefer-mock-return-shorthand": "off",
            "vitest/prefer-spy-on": "off",
            "vitest/prefer-strict-equal": "off",
            "vitest/prefer-to-be": "off",
            "vitest/prefer-to-be-falsy": "off",
            "vitest/prefer-to-be-truthy": "off",
            "vitest/prefer-to-contain": "off",
            "vitest/prefer-to-have-been-called-times": "off",
            "vitest/prefer-to-have-length": "off",
            "vitest/prefer-vi-mocked": "off",
            "vitest/require-hook": "off",
            "vitest/require-mock-type-parameters": "off",
            "vitest/require-top-level-describe": "off",
            "vitest/unbound-method": "off",
        },
    },
    {
        files: [".github/workflows/Build.yml"],
        rules: {
            "github-actions/max-jobs-per-action": ["error", 4],
        },
    },
    {
        files: [".vscode-test.mjs"],
        rules: {
            "@typescript-eslint/no-unsafe-call": "off",
            "import-x/no-unresolved": "off",
            "ts/no-unsafe-call": "off",
        },
    },
    {
        files: [".github/agents/beastmode.agent.md"],
        rules: {
            "copilot/prefer-qualified-tools": "off",
        },
    },
    {
        files: ["package.json"],
        rules: {
            "depend/ban-dependencies": [
                "error",
                {
                    allowed: ["jquery"],
                },
            ],
            "package-json/require-dependencies": "off",
            "package-json/require-peerDependencies": "off",
        },
    },
    {
        files: ["tests/playwright/**/*.ts"],
        languageOptions: {
            globals: globals.node,
            parserOptions: {
                project: ["./tsconfig.eslint.json"],
            },
        },
        rules: {
            "@typescript-eslint/strict-void-return": "off",
            "testing-library/prefer-screen-queries": "off",
            "vitest/consistent-test-filename": "off",
            "vitest/padding-around-all": "off",
            "vitest/padding-around-expect-groups": "off",
            "vitest/prefer-importing-vitest-globals": "off",
            "vitest/unbound-method": "off",
        },
    },
    {
        files: ["tests/vitest/stubs/**/*.cjs"],
        languageOptions: {
            globals: globals.node,
        },
        rules: {
            "@typescript-eslint/no-require-imports": "off",
            "import-x/no-commonjs": "off",
            "import-x/unambiguous": "off",
            "n/no-missing-require": "off",
            "unicorn/prefer-module": "off",
        },
    },
    {
        files: ["electron-builder.config.cjs"],
        languageOptions: {
            globals: globals.node,
            parserOptions: {
                project: ["./tsconfig.eslint.json"],
            },
        },
        rules: {
            "@typescript-eslint/no-require-imports": "off",
            "import-x/extensions": "off",
            "import-x/no-commonjs": "off",
            "import-x/unambiguous": "off",
            "no-template-curly-in-string": "off",
            "perfectionist/sort-objects": "off",
            "unicorn/prefer-module": "off",
        },
    },
];

export default config;
