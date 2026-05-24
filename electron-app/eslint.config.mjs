import nick2bad4u from "eslint-config-nick2bad4u";
import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
const config = [
    {
        ignores: [
            ".cache/**",
            "coverage/**",
            "dist/**",
            "**/*.css",
            "ffv/**",
            "fitParser.js",
            "**/*.html",
            "html/**",
            "main-ui.js",
            "main/**/*.js",
            "preload/**/*.js",
            "shared/**/*.js",
            "temp-win7/**",
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
            "main.js",
            "main.ts",
            "preload.js",
        ],
        languageOptions: {
            globals: globals.node,
        },
        rules: {
            "@typescript-eslint/explicit-member-accessibility": "off",
            "@typescript-eslint/no-require-imports": "off",
            "import-x/no-commonjs": "off",
            "import-x/unambiguous": "off",
            "n/prefer-global/buffer": "off",
            "unicorn/filename-case": "off",
            "unicorn/prefer-module": "off",
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
