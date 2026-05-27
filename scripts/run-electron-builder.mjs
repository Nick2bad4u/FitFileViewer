import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    appWorkspaceName,
    appWorkspaceRelativeToRepositoryRootPath,
    repositoryRoot,
    rootElectronBuilderConfigPath,
} from "./lib/workspaces.mjs";

const require = createRequire(
    pathToFileURL(
        path.join(repositoryRoot, "scripts", "run-electron-builder.mjs")
    ).href
);
const electronBuilderCliPath = require.resolve("electron-builder/cli.js");
export const electronBuilderBaseArgs = [
    "--projectDir",
    appWorkspaceName,
    "--config",
    appWorkspaceRelativeToRepositoryRootPath(rootElectronBuilderConfigPath),
];

export function parseArgs(argv) {
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

export function runElectronBuilder(argv = process.argv.slice(2)) {
    const { builderArgs, nodeEnv } = parseArgs(argv);
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

    return result.status ?? 1;
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    process.exitCode = runElectronBuilder();
}
