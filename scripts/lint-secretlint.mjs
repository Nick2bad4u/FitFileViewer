import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    docusaurusWorkspaceRepositoryPath,
    repositoryRoot,
    rootDocsPath,
    rootSecretlintConfigPath,
} from "./lib/workspaces.mjs";

const require = createRequire(import.meta.url);
const secretlintPackagePath = require.resolve("secretlint/package.json");
const secretlintCliPath = path.join(
    path.dirname(secretlintPackagePath),
    "bin",
    "secretlint.js"
);

export const secretlintTargets = [
    "*.md",
    `${rootDocsPath}/**/*.md`,
    docusaurusWorkspaceRepositoryPath("docs/**/*.{md,mdx}"),
    docusaurusWorkspaceRepositoryPath("blog/**/*.{md,mdx}"),
];

export function buildSecretlintArgs(argv = process.argv.slice(2)) {
    return [
        secretlintCliPath,
        ...secretlintTargets,
        "--secretlintrc",
        rootSecretlintConfigPath,
        ...argv,
    ];
}

export function runSecretlint(
    argv = process.argv.slice(2),
    commandRunner = spawnSync
) {
    const result = commandRunner(process.execPath, buildSecretlintArgs(argv), {
        cwd: repositoryRoot,
        stdio: "inherit",
    });

    if (result.error) {
        throw result.error;
    }

    return result.status ?? 1;
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    process.exitCode = runSecretlint();
}
