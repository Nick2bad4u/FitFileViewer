import nickTwoBadFourU from "eslint-config-nick2bad4u";

/** @type {import("eslint").Linter.Config[]} */
const config = [
    ...nickTwoBadFourU.configs.all,
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
        files: [
            "utils/files/import/handleOpenFile.js",
            "utils/ui/notifications/showNotification.js",
        ],
        rules: {
            "no-barrel-files/no-barrel-files": "off",
        },
    },
    {
        files: ["package.json"],
        rules: {
            "package-json/require-dependencies": "off",
            "package-json/require-peerDependencies": "off",
        },
    },
];

export default config;
