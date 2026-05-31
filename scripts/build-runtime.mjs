import { spawnSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { repositoryRoot, repositoryScriptPath } from "./lib/workspaces.mjs";

export const buildRuntimeSteps = [
    {
        args: [repositoryScriptPath("clean-runtime-dist.mjs")],
        label: "clean runtime dist",
    },
    {
        args: [repositoryScriptPath("validate-runtime-tsconfig.mjs")],
        label: "validate runtime TypeScript file list",
    },
    {
        args: [repositoryScriptPath("run-typescript.mjs"), "runtime"],
        label: "compile runtime TypeScript",
    },
    {
        args: [repositoryScriptPath("bundle-preload.mjs")],
        label: "bundle preload",
    },
    {
        args: [repositoryScriptPath("build-renderer.mjs")],
        label: "build renderer bundle",
    },
    {
        args: [repositoryScriptPath("format-runtime-output.mjs")],
        label: "format runtime output",
    },
    {
        args: [repositoryScriptPath("prepare-runtime-dist.mjs")],
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
