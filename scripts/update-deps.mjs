import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

import { resolveCommandForPlatform } from "./lib/child-process.mjs";
import { repositoryRoot } from "./lib/workspaces.mjs";

const require = createRequire(import.meta.url);
const ncuPackagePath = require.resolve("npm-check-updates/package.json");
const ncuCliPath = path.join(path.dirname(ncuPackagePath), "build", "cli.js");
const userArgs = process.argv.slice(2);
const shouldShowHelp = userArgs.includes("--help") || userArgs.includes("-h");
const shouldInstall = !shouldShowHelp && !userArgs.includes("--no-install");
const ncuArgs = [
    "-i",
    "--workspaces",
    "--root",
    "--install",
    "never",
    ...userArgs.filter((arg) => arg !== "--no-install"),
];

const ncuResult = spawnSync(process.execPath, [ncuCliPath, ...ncuArgs], {
    cwd: repositoryRoot,
    stdio: "inherit",
});

if (ncuResult.error) {
    throw ncuResult.error;
}

if (ncuResult.status !== 0) {
    process.exitCode = ncuResult.status ?? 1;
} else if (shouldInstall) {
    const installResult = spawnSync(
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

    process.exitCode = installResult.status ?? 1;
}
