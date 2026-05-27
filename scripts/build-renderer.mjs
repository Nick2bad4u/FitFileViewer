import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
const vitePackagePath = require.resolve("vite/package.json");
const viteCliPath = path.join(path.dirname(vitePackagePath), "bin", "vite.js");

const result = spawnSync(
    process.execPath,
    [
        viteCliPath,
        "build",
        "--config",
        "vite.renderer.config.mjs",
        ...process.argv.slice(2),
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
