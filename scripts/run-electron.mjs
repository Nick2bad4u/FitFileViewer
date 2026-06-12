import { spawnSync } from "node:child_process";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { repositoryRoot } from "./lib/workspaces.mjs";

const electronCliPath = fileURLToPath(import.meta.resolve("electron/cli.js"));
export const defaultAppPath = ".";
export { electronCliPath };

export function parseArgs(argv) {
    const electronArgs = [];
    let electronIsDev;

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === "--electron-is-dev") {
            electronIsDev = argv[index + 1];
            if (!electronIsDev || electronIsDev.startsWith("-")) {
                throw new Error("--electron-is-dev requires a value");
            }

            index += 1;
            continue;
        }

        if (arg.startsWith("--electron-is-dev=")) {
            electronIsDev = arg.slice("--electron-is-dev=".length);
            if (!electronIsDev) {
                throw new Error("--electron-is-dev must not be empty");
            }

            continue;
        }

        electronArgs.push(arg);
    }

    return { electronArgs, electronIsDev };
}

export function withDefaultAppPath(electronArgs, appPath = defaultAppPath) {
    if (
        electronArgs.includes("--help") ||
        electronArgs.includes("-h") ||
        electronArgs.includes("--version") ||
        electronArgs.includes("-v")
    ) {
        return electronArgs;
    }

    return electronArgs.some((arg) => !arg.startsWith("-"))
        ? electronArgs
        : [...electronArgs, appPath];
}

export function runElectron(
    argv = process.argv.slice(2),
    commandRunner = spawnSync,
    environment = process.env
) {
    const { electronArgs, electronIsDev } = parseArgs(argv);
    const result = commandRunner(
        process.execPath,
        [electronCliPath, ...withDefaultAppPath(electronArgs)],
        {
            cwd: repositoryRoot,
            env: electronIsDev
                ? { ...environment, ELECTRON_IS_DEV: electronIsDev }
                : environment,
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
    process.exitCode = runElectron();
}
