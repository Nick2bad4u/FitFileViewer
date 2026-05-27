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

function runStep(label, args) {
    console.log(`[lint-electron-app] ${label}`);

    const result = spawnSync(process.execPath, args, {
        cwd: repositoryRoot,
        stdio: "inherit",
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

runStep("eslint", [
    eslintCliPath,
    "--config",
    "eslint.config.mjs",
    "--quiet",
    "--cache",
    "--cache-strategy",
    "content",
    "--cache-location",
    ".cache/.eslintcache-electron",
    ...process.argv.slice(2),
    "electron-app",
]);

runStep("typecheck", [scriptPath("run-typescript.mjs"), "typecheck"]);

function scriptPath(name) {
    return path.join(repositoryRoot, "scripts", name);
}
