import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
    docusaurusWorkspacePath,
    generateApiCategoriesScriptPath,
    repositoryRoot,
    runDocusaurusScriptPath,
    rootTypedocConfigPath,
} from "./lib/workspaces.mjs";

const typedocPackagePath = fileURLToPath(
    import.meta.resolve("typedoc/package.json")
);
const typedocCliPath = path.join(
    path.dirname(typedocPackagePath),
    "bin",
    "typedoc"
);

export const typedocConfigPath = rootTypedocConfigPath;

export function buildDocsSteps(argv = process.argv.slice(2)) {
    const typedocOnly = argv.includes("--typedoc-only");

    return [
        {
            args: [
                typedocCliPath,
                "--options",
                typedocConfigPath,
            ],
            cwd: repositoryRoot,
            label: "generate API docs",
        },
        {
            args: [generateApiCategoriesScriptPath],
            cwd: docusaurusWorkspacePath,
            label: "generate API categories",
        },
        ...(typedocOnly
            ? []
            : [
                  {
                      args: [runDocusaurusScriptPath, "build"],
                      cwd: repositoryRoot,
                      label: "build Docusaurus site",
                  },
              ]),
    ];
}

export function runBuildDocs(
    argv = process.argv.slice(2),
    commandRunner = spawnSync,
    logger = console.log
) {
    for (const step of buildDocsSteps(argv)) {
        logger(`[build-docs] ${step.label}`);

        const result = commandRunner(process.execPath, step.args, {
            cwd: step.cwd,
            stdio: "inherit",
        });

        if (result.error) {
            throw result.error;
        }

        if (result.status !== 0) {
            return result.status ?? 1;
        }
    }

    return 0;
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    process.exitCode = runBuildDocs();
}
