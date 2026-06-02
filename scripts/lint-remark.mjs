import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    docusaurusWorkspaceRepositoryPath,
    repositoryRoot,
    rootDocsPath,
    rootRemarkConfigPath,
} from "./lib/workspaces.mjs";

const remarkCliPath = path.join(
    repositoryRoot,
    "node_modules",
    "remark-cli",
    "cli.js"
);

export const remarkTargets = [
    rootDocsPath,
    docusaurusWorkspaceRepositoryPath("docs"),
    docusaurusWorkspaceRepositoryPath("blog"),
    docusaurusWorkspaceRepositoryPath("src"),
];

export const remarkOptions = [
    "--quiet",
    "--frail",
    "--rc-path",
    rootRemarkConfigPath,
    "--ignore-pattern",
    docusaurusWorkspaceRepositoryPath("docs/api/**"),
];

export function buildRemarkArgs(argv = process.argv.slice(2)) {
    return [
        remarkCliPath,
        ...remarkTargets,
        ...remarkOptions,
        ...argv,
    ];
}

export function runRemarkLint(
    argv = process.argv.slice(2),
    commandRunner = spawnSync
) {
    const result = commandRunner(process.execPath, buildRemarkArgs(argv), {
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
    process.exitCode = runRemarkLint();
}
