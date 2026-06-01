import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    docusaurusWorkspaceRepositoryPath,
    repositoryRoot,
    rootMarkdownlintConfigPath,
} from "./lib/workspaces.mjs";

const require = createRequire(import.meta.url);
const markdownlintCliPath = require.resolve("markdownlint-cli2");

export const markdownlintTargets = [
    docusaurusWorkspaceRepositoryPath("docs/**/*.{md,mdx}"),
    `!${docusaurusWorkspaceRepositoryPath("docs/api/**/*.md")}`,
    docusaurusWorkspaceRepositoryPath("blog/**/*.{md,mdx}"),
    docusaurusWorkspaceRepositoryPath("src/**/*.{md,mdx}"),
];

export function buildMarkdownlintArgs(argv = process.argv.slice(2)) {
    return [
        markdownlintCliPath,
        ...markdownlintTargets,
        "--config",
        rootMarkdownlintConfigPath,
        ...argv,
    ];
}

export function runLintDocusaurusContent(
    argv = process.argv.slice(2),
    commandRunner = spawnSync
) {
    const result = commandRunner(
        process.execPath,
        buildMarkdownlintArgs(argv),
        {
            cwd: repositoryRoot,
            stdio: "inherit",
        }
    );

    if (result.error) {
        throw result.error;
    }

    return result.status ?? 1;
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    process.exitCode = runLintDocusaurusContent();
}
