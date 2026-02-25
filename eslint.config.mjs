import baseConfig from "./electron-app/eslint.config.mjs";

export default [
    {
        ignores: [".github/agents/**/*.agent.md"],
    },
    ...baseConfig,
    {
        files: ["**/*.json", "**/*.jsonc"],
        rules: {
            "json/sort-keys": "off",
        },
    },
    {
        files: ["**/*.{md,mdx}"],
        rules: {
            "markdown/fenced-code-language": "off",
            "markdown/no-missing-label-refs": "off",
            "markdown/no-duplicate-headings": "off",
        },
    },
    {
        files: ["cliff.toml"],
        rules: {
            "toml/array-bracket-newline": "off",
        },
    },
    {
        files: ["docs/ACCENT_COLOR_CODE_EXAMPLES.js"],
        rules: {
            "no-await-in-loop": "off",
            "no-unused-vars": "off",
        },
    },
    {
        files: ["docusaurus/src/pages/index.tsx"],
        rules: {
            "@docusaurus/no-html-links": "off",
        },
    },
    {
        files: ["docusaurus/src/utils/mapDataView.js"],
        rules: {
            "no-await-in-loop": "off",
        },
    },
    {
        files: ["docusaurus/**/*.css"],
        rules: {
            "css/prefer-logical-properties": "off",
        },
    },
];
