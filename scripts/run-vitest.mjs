import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
const vitestPackagePath = require.resolve("vitest/package.json");
const vitestCliPath = path.join(path.dirname(vitestPackagePath), "vitest.mjs");
const vitestArgs = [
    "--config",
    "vitest.config.ts",
    ...process.argv.slice(2),
];

const result = spawnSync(
    process.execPath,
    [
        "--max-old-space-size=8192",
        vitestCliPath,
        ...vitestArgs,
    ],
    {
        cwd: repositoryRoot,
        stdio: "inherit",
    }
);

if (result.error) {
    throw result.error;
}

process.exitCode = result.status ?? 1;
