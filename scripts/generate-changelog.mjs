import { spawnSync } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
    repositoryRoot,
    rootChangelogPath,
    rootCliffConfigPath,
} from "./lib/workspaces.mjs";

const gitCliffCliPath = fileURLToPath(
    await import.meta.resolve("git-cliff/cli")
);
const userArgs = process.argv.slice(2);
const gitCliffArgs = [
    "--config",
    rootCliffConfigPath,
    "--output",
    rootChangelogPath,
    ...userArgs,
];

const result = spawnSync(process.execPath, [gitCliffCliPath, ...gitCliffArgs], {
    cwd: repositoryRoot,
    stdio: "inherit",
});

if (result.error) {
    throw result.error;
}

process.exitCode = result.status ?? 1;
