import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
    bundlePreloadScriptPath,
    bundleMainScriptPath,
    cleanRuntimeDistScriptPath,
    formatRuntimeOutputScriptPath,
    prepareRuntimeDistScriptPath,
    repositoryRoot,
    rootRuntimeTsconfigPath,
    rootViteRendererConfigPath,
    validateRuntimeTsconfigScriptPath,
} from "./lib/workspaces.mjs";

const typescriptCliPath = fileURLToPath(
    import.meta.resolve("typescript/bin/tsc")
);
const vitePackagePath = fileURLToPath(import.meta.resolve("vite/package.json"));
const viteCliPath = path.join(path.dirname(vitePackagePath), "bin", "vite.js");

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
        args: [
            typescriptCliPath,
            "--project",
            rootRuntimeTsconfigPath,
        ],
        label: "compile runtime TypeScript",
    },
    {
        args: [bundleMainScriptPath],
        label: "bundle main",
    },
    {
        args: [bundlePreloadScriptPath],
        label: "bundle preload",
    },
    {
        args: [
            viteCliPath,
            "build",
            "--config",
            rootViteRendererConfigPath,
        ],
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
