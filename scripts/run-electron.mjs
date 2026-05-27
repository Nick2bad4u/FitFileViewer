import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
const electronCliPath = require.resolve("electron/cli.js");

function parseArgs(argv) {
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

const { electronArgs, electronIsDev } = parseArgs(process.argv.slice(2));
const result = spawnSync(process.execPath, [electronCliPath, ...electronArgs], {
    cwd: repositoryRoot,
    env: electronIsDev
        ? { ...process.env, ELECTRON_IS_DEV: electronIsDev }
        : process.env,
    stdio: "inherit",
});

if (result.error) {
    throw result.error;
}

process.exitCode = result.status ?? 1;
