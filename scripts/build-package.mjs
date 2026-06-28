import { spawnSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    buildRuntimeScriptPath,
    repositoryRoot,
    runElectronBuilderScriptPath,
} from "./lib/workspaces.mjs";

export function buildPackageSteps(argv = process.argv.slice(2)) {
    return [
        {
            args: [buildRuntimeScriptPath],
            label: "build runtime",
        },
        {
            args: [runElectronBuilderScriptPath, ...argv],
            label: "run electron-builder",
        },
    ];
}

export function runBuildPackage(
    argv = process.argv.slice(2),
    commandRunner = spawnSync,
    logger = console.log
) {
    for (const { args, label } of buildPackageSteps(argv)) {
        logger(`[build-package] ${label}`);

        const result = commandRunner(process.execPath, args, {
            cwd: repositoryRoot,
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
    process.exitCode = runBuildPackage();
}
