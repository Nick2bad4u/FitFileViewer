import nick2bad4u from "eslint-config-nick2bad4u";
import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
const config = [
    {
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
    ...nick2bad4u.configs.all,
    {
        files: [
            "fitParser.ts",
            "jest.config.cjs",
            "main.ts",
            "preload.ts",
        ],
        languageOptions: {
            globals: globals.node,
        },
        rules: {
            "@typescript-eslint/consistent-type-imports": "off",
            "@typescript-eslint/explicit-member-accessibility": "off",
            "@typescript-eslint/no-unsafe-type-assertion": "off",
            "@typescript-eslint/prefer-readonly-parameter-types": "off",
            "@typescript-eslint/no-require-imports": "off",
            "@typescript-eslint/no-unnecessary-type-parameters": "off",
            "import-x/no-commonjs": "off",
            "import-x/unambiguous": "off",
            "n/no-missing-require": [
                "error",
                {
                    tryExtensions: [".js", ".json", ".node", ".ts"],
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
            "n/no-unpublished-import": "off",
        },
    },
    {
        files: ["main-ui.ts", "main.ts"],
        rules: {
            "@typescript-eslint/no-unsafe-type-assertion": "off",
            "@typescript-eslint/prefer-readonly-parameter-types": "off",
        },
    },
    {
        files: ["renderer.ts"],
        rules: {
            "@typescript-eslint/ban-ts-comment": "off",
            "runtime-cleanup/no-floating-timers": "off",
            "runtime-cleanup/no-unmanaged-event-listeners": "off",
            "typedoc/no-duplicate-param-tags": "off",
            "typedoc/no-extra-param-tags": "off",
        },
    },
    {
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
        files: ["package.json"],
        rules: {
            "package-json/require-peerDependencies": "off",
        },
    },
];

export default config;
