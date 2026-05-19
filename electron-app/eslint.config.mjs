import nick2bad4u from "eslint-config-nick2bad4u";

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
];

export default config;
