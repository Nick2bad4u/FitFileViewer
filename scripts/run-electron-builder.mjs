import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
const electronBuilderCliPath = require.resolve("electron-builder/cli.js");
const electronBuilderBaseArgs = [
    "--projectDir",
    "electron-app",
    "--config",
    "../electron-builder.config.cjs",
];

function parseArgs(argv) {
    const builderArgs = [];
    let nodeEnv;

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === "--node-env") {
            nodeEnv = argv[index + 1];
            if (!nodeEnv || nodeEnv.startsWith("-")) {
                throw new Error("--node-env requires a value");
            }

            index += 1;
            continue;
        }

        if (arg.startsWith("--node-env=")) {
            nodeEnv = arg.slice("--node-env=".length);
            continue;
        }

        builderArgs.push(arg);
    }

    return { builderArgs, nodeEnv };
}

const { builderArgs, nodeEnv } = parseArgs(process.argv.slice(2));
const result = spawnSync(
    process.execPath,
    [
        electronBuilderCliPath,
        ...electronBuilderBaseArgs,
        ...builderArgs,
    ],
    {
        cwd: repositoryRoot,
        env: nodeEnv ? { ...process.env, NODE_ENV: nodeEnv } : process.env,
        stdio: "inherit",
    }
);

if (result.error) {
    throw result.error;
}

process.exitCode = result.status ?? 1;
