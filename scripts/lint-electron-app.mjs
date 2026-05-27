import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { runEslintTarget } from "./run-eslint.mjs";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));

function runStep(label, runner) {
    console.log(`[lint-electron-app] ${label}`);

    const status = runner();
    if (status !== 0) {
        process.exit(status ?? 1);
    }
}

runStep("eslint", () => runEslintTarget("electronApp", process.argv.slice(2)));
runStep("typecheck", () => runScript("run-typescript.mjs", ["typecheck"]));

function runScript(name, args) {
    const result = spawnSync(process.execPath, [scriptPath(name), ...args], {
        cwd: repositoryRoot,
        stdio: "inherit",
    });

    if (result.error) {
        throw result.error;
    }

    return result.status ?? 1;
}

function scriptPath(name) {
    return path.join(repositoryRoot, "scripts", name);
}
