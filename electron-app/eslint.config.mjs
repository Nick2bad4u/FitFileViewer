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
            "temp-win7/**",
            "types/**",
            "vendor/**",
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
];

export default config;
