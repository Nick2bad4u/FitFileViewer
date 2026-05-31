import { spawnSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    buildRendererScriptPath,
    bundlePreloadScriptPath,
    cleanRuntimeDistScriptPath,
    formatRuntimeOutputScriptPath,
    prepareRuntimeDistScriptPath,
    repositoryRoot,
    runTypescriptScriptPath,
    validateRuntimeTsconfigScriptPath,
} from "./lib/workspaces.mjs";

export const buildRuntimeSteps = [
    {
        args: [cleanRuntimeDistScriptPath],
        label: "clean runtime dist",
    },
    {
        args: [validateRuntimeTsconfigScriptPath],
        label: "validate runtime TypeScript file list",
    },
    {
        args: [runTypescriptScriptPath, "runtime"],
        label: "compile runtime TypeScript",
    },
    {
        args: [bundlePreloadScriptPath],
        label: "bundle preload",
    },
    {
        args: [buildRendererScriptPath],
        label: "build renderer bundle",
    },
    {
        args: [formatRuntimeOutputScriptPath],
        label: "format runtime output",
    },
    {
        args: [prepareRuntimeDistScriptPath],
        label: "prepare runtime dist",
    },
];

export function runBuildRuntime(
    commandRunner = spawnSync,
    logger = console.log
) {
    for (const step of buildRuntimeSteps) {
        logger(`[build-runtime] ${step.label}`);

        const result = commandRunner(process.execPath, step.args, {
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
    process.exitCode = runBuildRuntime();
}
