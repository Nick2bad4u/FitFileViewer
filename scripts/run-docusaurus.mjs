import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    docusaurusPackagePath,
    docusaurusWorkspacePath,
    repositoryRoot,
    repositoryScriptPath,
} from "./lib/workspaces.mjs";

const requireFromDocusaurus = createRequire(
    pathToFileURL(docusaurusPackagePath)
);
const docusaurusCorePackagePath = requireFromDocusaurus.resolve(
    "@docusaurus/core/package.json"
);
const docusaurusCliPath = path.join(
    path.dirname(docusaurusCorePackagePath),
    "bin",
    "docusaurus.mjs"
);

export const docusaurusCommandsThatSyncAssets = [
    "build",
    "deploy",
    "serve",
    "start",
];
export const syncDocusaurusStaticAssetsScript = repositoryScriptPath(
    "sync-docusaurus-static-assets.mjs"
);

export function buildDocusaurusArgs(argv = process.argv.slice(2)) {
    return [docusaurusCliPath, ...argv];
}

export function findDocusaurusCommand(argv = process.argv.slice(2)) {
    return argv.find((arg) => !arg.startsWith("-"));
}

export function runDocusaurus(
    argv = process.argv.slice(2),
    commandRunner = spawnSync
) {
    if (shouldSyncStaticAssets(argv)) {
        const syncResult = commandRunner(
            process.execPath,
            [syncDocusaurusStaticAssetsScript],
            {
                cwd: repositoryRoot,
                stdio: "inherit",
            }
        );

        if (syncResult.error) {
            throw syncResult.error;
        }

        if (syncResult.status !== 0) {
            return syncResult.status ?? 1;
        }
    }

    const result = commandRunner(process.execPath, buildDocusaurusArgs(argv), {
        cwd: docusaurusWorkspacePath,
        stdio: "inherit",
    });

    if (result.error) {
        throw result.error;
    }

    return result.status ?? 1;
}

export function shouldSyncStaticAssets(argv = process.argv.slice(2)) {
    return docusaurusCommandsThatSyncAssets.includes(
        findDocusaurusCommand(argv) ?? ""
    );
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    process.exitCode = runDocusaurus();
}
