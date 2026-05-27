import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
const eslintPackagePath = require.resolve("eslint/package.json");
const eslintCliPath = path.join(
    path.dirname(eslintPackagePath),
    "bin/eslint.js"
);

const eslintArgs = [
    "--cache",
    "--cache-strategy",
    "content",
    "--cache-location",
    ".cache/.eslintcache-root",
    ...process.argv.slice(2),
    ".",
    "--ignore-pattern",
    "electron-app/**",
    "--ignore-pattern",
    "docusaurus/**",
];

const result = spawnSync(process.execPath, [eslintCliPath, ...eslintArgs], {
    cwd: repositoryRoot,
    stdio: "inherit",
});

if (result.error) {
    throw result.error;
}

process.exitCode = result.status ?? 1;
