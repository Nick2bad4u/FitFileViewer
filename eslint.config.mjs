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
];

export default config;
