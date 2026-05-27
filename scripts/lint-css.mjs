import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
const stylelintPackagePath = require.resolve("stylelint/package.json");
const stylelintCliPath = path.join(
    path.dirname(stylelintPackagePath),
    "bin/stylelint.mjs"
);

const stylelintArgs = [
    "electron-app/**/*.css",
    "--config",
    "stylelint.config.mjs",
    ...process.argv.slice(2),
];

const result = spawnSync(
    process.execPath,
    [stylelintCliPath, ...stylelintArgs],
    {
        cwd: repositoryRoot,
        stdio: "inherit",
    }
);

if (result.error) {
    throw result.error;
}

process.exitCode = result.status ?? 1;
