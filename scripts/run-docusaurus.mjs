import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    docusaurusPackagePath,
    docusaurusWorkspacePath,
    repositoryRoot,
    rootCachePath,
    syncDocusaurusStaticAssetsScriptPath,
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
export const syncDocusaurusStaticAssetsScript =
    syncDocusaurusStaticAssetsScriptPath;
export const docusaurusLocalStorageFilePath = path.join(
    repositoryRoot,
    rootCachePath,
    "docusaurus-localstorage.json"
);

export function buildDocusaurusArgs(argv = process.argv.slice(2)) {
    return [docusaurusCliPath, ...argv];
}

export function buildDocusaurusNodeOptions(
    nodeOptions,
    allowedNodeEnvironmentFlags = process.allowedNodeEnvironmentFlags
) {
    const trimmed = typeof nodeOptions === "string" ? nodeOptions.trim() : "";
    if (!allowedNodeEnvironmentFlags.has("--localstorage-file")) {
        return trimmed || undefined;
    }

    const localStorageOption = `--localstorage-file=${docusaurusLocalStorageFilePath}`;
    return trimmed ? `${trimmed} ${localStorageOption}` : localStorageOption;
}

export function buildDocusaurusEnvironment(env = process.env) {
    return {
        ...env,
        NODE_OPTIONS: buildDocusaurusNodeOptions(env.NODE_OPTIONS),
    };
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

    fs.mkdirSync(path.dirname(docusaurusLocalStorageFilePath), {
        recursive: true,
    });

    const result = commandRunner(process.execPath, buildDocusaurusArgs(argv), {
        cwd: docusaurusWorkspacePath,
        env: buildDocusaurusEnvironment(),
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
