import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
const playwrightPackagePath = require.resolve("@playwright/test/package.json");
const playwrightCliPath = path.join(
    path.dirname(playwrightPackagePath),
    "cli.js"
);

function runStep(label, args) {
    console.log(`[run-playwright] ${label}`);

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

runStep("build runtime", [scriptPath("build-runtime.mjs")]);
runStep("run playwright", [
    playwrightCliPath,
    "test",
    "--config",
    "playwright.config.ts",
    ...process.argv.slice(2),
]);

function scriptPath(name) {
    return path.join(repositoryRoot, "scripts", name);
}
