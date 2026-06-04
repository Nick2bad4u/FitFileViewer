import nickTwoBadFourU from "eslint-config-nick2bad4u";
import globals from "globals";
import { fileURLToPath } from "node:url";

import {
    rootAlternativeFitViewPath,
    rootAppIconsPath,
    rootAppStaticPath,
} from "./scripts/lib/workspaces.mjs";

const electronAppBasePath = "electron-app";
// eslint-disable-next-line unicorn/prefer-import-meta-properties -- import.meta.dirname is not available across the declared Node >=22.12.0 range.
const rootDirectory = fileURLToPath(new URL(".", import.meta.url));
const sharedConfig = nickTwoBadFourU.createConfig({
    allowDefaultProjectFilePatterns: [],
    rootDirectory,
    tsconfigPaths: ["./tsconfig.eslint.json"],
});
const dependPlugin = sharedConfig.find((entry) => entry.plugins?.depend)
    ?.plugins.depend;
const rootToolingIgnorePatterns = new Set([
    "script/**/*.{js,jsx,mjs,cjs,ts,tsx,cts,mts}",
    "scripts/**/*.{js,jsx,mjs,cjs,ts,tsx,cts,mts}",
]);
const rootSharedConfig = sharedConfig.map((entry) => {
    if (!entry.ignores) {
        return entry;
    }

    return {
        ...entry,
        ignores: entry.ignores.filter(
            (ignorePattern) => !rootToolingIgnorePatterns.has(ignorePattern)
        ),
    };
});
const electronAppSharedConfig = rootSharedConfig.map((entry) => {
    const configEntry = { ...entry };
    delete configEntry.plugins;

    return {
        ...configEntry,
        basePath: electronAppBasePath,
    };
});

if (!dependPlugin) {
    throw new Error(
        "eslint-config-nick2bad4u must provide eslint-plugin-depend"
    );
}

/** @type {import("eslint").Linter.Config[]} */
const config = [
    {
        ignores: [
            "playwright-report/**",
            "docs/ACCENT_COLOR_CODE_EXAMPLES.js",
            `${rootAlternativeFitViewPath}/**`,
            `${rootAppIconsPath}/**`,
            `${rootAppStaticPath}/**`,
            "test-results/**",
        ],
    },
    {
        basePath: electronAppBasePath,
        ignores: [
            ".cache/**",
            "coverage/**",
            "dist/**",
            "**/main.js",
            "**/*.css",
            "fitParser.js",
            "**/*.html",
            "html/**",
            "main-ui.js",
            "main/**/*.js",
            "preload.js",
            "preload/**/*.js",
            "renderer/leafletMeasureLite.js",
            "shared/**/*.js",
            "temp-win7/**",
            "test-results/**",
            "types/**",
            "ui/**/*.js",
            "utils/**/*.js",
            "utils.js",
            "windowStateUtils.js",
        ],
    },
    ...rootSharedConfig,
    ...electronAppSharedConfig,
    {
        basePath: electronAppBasePath,
        files: ["**/*.{cjs,js,mjs,ts,tsx}"],
        rules: {
            "@typescript-eslint/array-type": "off",
            "@typescript-eslint/consistent-type-definitions": "off",
            "@typescript-eslint/dot-notation": "off",
            "@typescript-eslint/no-confusing-void-expression": "off",
            "@typescript-eslint/no-require-imports": "off",
            "@typescript-eslint/no-unnecessary-type-conversion": "off",
            "@typescript-eslint/prefer-nullish-coalescing": "off",
            "@typescript-eslint/prefer-optional-chain": "off",
            "canonical/filename-no-index": "off",
            "capitalized-comments": "off",
            "listeners/matching-remove-event-listener": "off",
            "listeners/no-inline-function-event-listener": "off",
            "listeners/no-missing-remove-event-listener": "off",
            "n/global-require": "off",
            "n/no-missing-require": "off",
            "n/no-process-env": "off",
            "n/no-unsupported-features/node-builtins": "off",
            "no-console": "off",
            "no-underscore-dangle": "off",
            "perfectionist/sort-classes": "off",
            "perfectionist/sort-imports": "off",
            "perfectionist/sort-interfaces": "off",
            "perfectionist/sort-intersection-types": "off",
            "perfectionist/sort-modules": "off",
            "perfectionist/sort-named-imports": "off",
            "perfectionist/sort-object-types": "off",
            "perfectionist/sort-objects": "off",
            "perfectionist/sort-union-types": "off",
            "perfectionist/sort-variable-declarations": "off",
            "prefer-named-capture-group": "off",
            "regexp/prefer-named-capture-group": "off",
            "regexp/require-unicode-regexp": "off",
            "regexp/require-unicode-sets-regexp": "off",
            "regexp/sort-character-class-elements": "off",
            "unicorn/filename-case": "off",
            "unicorn/prefer-module": "off",
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
            "tsdoc/syntax": "off",
            "typedoc/no-duplicate-param-tags": "off",
            "typedoc/no-extra-param-tags": "off",
            "typedoc/no-unknown-tags": "off",
            "typedoc/require-throws-tag": "off",
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
            "@typescript-eslint/await-thenable": "off",
            "@typescript-eslint/no-deprecated": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/no-unnecessary-type-assertion": "off",
            "@typescript-eslint/no-unsafe-argument": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-useless-default-assignment": "off",
            "@typescript-eslint/prefer-promise-reject-errors": "off",
            "@typescript-eslint/strict-void-return": "off",
            "@typescript-eslint/unbound-method": "off",
            "case-police/string-check": "off",
            complexity: "off",
            "logical-assignment-operators": "off",
            "require-atomic-updates": "off",
            "tsdoc/syntax": "off",
            "typedoc/no-unknown-tags": "off",
            "unicorn/better-regex": "off",
            "unicorn/numeric-separators-style": "off",
            "unicorn/prefer-global-this": "off",
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
        files: ["tests/unit/**/*.{spec,test}.{js,ts}"],
        linterOptions: {
            reportUnusedDisableDirectives: "off",
        },
        rules: {
            "vitest/no-hooks": "off",
            "vitest/padding-around-after-each-blocks": "off",
            "vitest/padding-around-all": "off",
            "vitest/padding-around-before-each-blocks": "off",
            "vitest/padding-around-describe-blocks": "off",
            "vitest/padding-around-expect-groups": "off",
            "vitest/padding-around-test-blocks": "off",
            "vitest/prefer-strict-equal": "off",
            "vitest/prefer-to-be": "off",
            "vitest/prefer-to-be-falsy": "off",
            "vitest/prefer-to-be-truthy": "off",
            "vitest/require-top-level-describe": "off",
        },
    },
    {
        files: ["tests/playwright/**/*.ts"],
        languageOptions: {
            globals: globals.node,
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
        files: ["tests/vitest/setupVitest.mjs"],
        languageOptions: {
            globals: globals.node,
        },
        linterOptions: {
            reportUnusedDisableDirectives: "off",
        },
        rules: {
            "@typescript-eslint/strict-void-return": "off",
            "vitest/no-duplicate-hooks": "off",
            "vitest/no-hooks": "off",
            "vitest/prefer-hooks-in-order": "off",
            "vitest/prefer-import-in-mock": "off",
            "vitest/prefer-mock-return-shorthand": "off",
            "vitest/prefer-spy-on": "off",
            "vitest/require-mock-type-parameters": "off",
            "vitest/require-top-level-describe": "off",
            "vitest/unbound-method": "off",
        },
    },
    {
        files: ["electron-builder.config.cjs"],
        languageOptions: {
            globals: globals.node,
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
