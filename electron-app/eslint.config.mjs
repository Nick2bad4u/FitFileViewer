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
            "**/*.html",
            "html/**",
            "main/**/*.js",
            "preload/**/*.js",
            "shared/**/*.js",
            "temp-win7/**",
            "types/**",
            "utils/**/*.js",
            "utils.js",
            "vendor/**",
            "windowStateUtils.js",
        ],
    },
    ...nick2bad4u.configs.all,
    {
        files: [
            "fitParser.js",
            "jest.config.cjs",
            "main.js",
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
        files: ["package.json"],
        rules: {
            "package-json/require-peerDependencies": "off",
        },
    },
];

export default config;
