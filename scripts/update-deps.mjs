import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { resolveCommandForPlatform } from "./lib/child-process.mjs";
import { repositoryRoot } from "./lib/workspaces.mjs";

const ncuPackagePath = fileURLToPath(
    import.meta.resolve("npm-check-updates/package.json")
);
export const ncuCliPath = path.join(
    path.dirname(ncuPackagePath),
    "build",
    "cli.js"
);

export function buildNcuArgs(argv = process.argv.slice(2)) {
    return [
        "-i",
        "--workspaces",
        "--root",
        "--install",
        "never",
        ...argv.filter((arg) => arg !== "--no-install"),
    ];
}

export function shouldInstallUpdatedDependencies(argv = process.argv.slice(2)) {
    return (
        !argv.includes("--help") &&
        !argv.includes("-h") &&
        !argv.includes("--no-install")
    );
}

export function runUpdateDeps(
    argv = process.argv.slice(2),
    commandRunner = spawnSync
) {
    const ncuResult = commandRunner(
        process.execPath,
        [ncuCliPath, ...buildNcuArgs(argv)],
        {
            cwd: repositoryRoot,
            stdio: "inherit",
        }
    );

    if (ncuResult.error) {
        throw ncuResult.error;
    }

    if (ncuResult.status !== 0) {
        return ncuResult.status ?? 1;
    }

    if (!shouldInstallUpdatedDependencies(argv)) {
        return 0;
    }

    const installResult = commandRunner(
        resolveCommandForPlatform("npm"),
        ["install"],
        {
            cwd: repositoryRoot,
            stdio: "inherit",
        }
    );

    if (installResult.error) {
        throw installResult.error;
    }

    return installResult.status ?? 1;
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    process.exitCode = runUpdateDeps();
}
