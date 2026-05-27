import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    appTypesPath,
    repositoryRoot,
    rootElectronAppTsconfigPath,
    rootRuntimeTsconfigPath,
} from "./lib/workspaces.mjs";

const require = createRequire(import.meta.url);
const tscCliPath = require.resolve("typescript/bin/tsc");

export const typescriptTasks = new Map([
    [
        "declarations",
        [
            "--project",
            rootElectronAppTsconfigPath,
            "--declaration",
            "--emitDeclarationOnly",
            "--declarationMap",
            "false",
            "--outDir",
            `./${appTypesPath}`,
        ],
    ],
    ["runtime", ["--project", rootRuntimeTsconfigPath]],
    [
        "typecheck",
        [
            "--project",
            rootElectronAppTsconfigPath,
            "--noEmit",
        ],
    ],
]);

export function buildTypescriptArgs(taskName, extraArgs = []) {
    const taskArgs = typescriptTasks.get(taskName);

    if (!taskArgs) {
        throw new Error(
            `[run-typescript] Expected one of: ${[
                ...typescriptTasks.keys(),
            ].join(", ")}`
        );
    }

    return [
        tscCliPath,
        ...taskArgs,
        ...extraArgs,
    ];
}

export function runTypescriptTask(
    argv = process.argv.slice(2),
    commandRunner = spawnSync
) {
    const [taskName, ...extraArgs] = argv;

    try {
        const result = commandRunner(
            process.execPath,
            buildTypescriptArgs(taskName, extraArgs),
            {
                cwd: repositoryRoot,
                stdio: "inherit",
            }
        );

        if (result.error) {
            throw result.error;
        }

        return result.status ?? 1;
    } catch (error) {
        if (
            error instanceof Error &&
            error.message.startsWith("[run-typescript]")
        ) {
            console.error(error.message);
            return 1;
        }

        throw error;
    }
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    process.exitCode = runTypescriptTask();
}
