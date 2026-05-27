import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { appWorkspaceName, repositoryRoot } from "./lib/workspaces.mjs";

const require = createRequire(
    pathToFileURL(path.join(repositoryRoot, "scripts", "run-electron.mjs")).href
);
const electronCliPath = require.resolve("electron/cli.js");
export const defaultAppPath = appWorkspaceName;

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

export function runElectron(argv = process.argv.slice(2)) {
    const { electronArgs, electronIsDev } = parseArgs(argv);
    const result = spawnSync(
        process.execPath,
        [electronCliPath, ...withDefaultAppPath(electronArgs)],
        {
            cwd: repositoryRoot,
            env: electronIsDev
                ? { ...process.env, ELECTRON_IS_DEV: electronIsDev }
                : process.env,
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
