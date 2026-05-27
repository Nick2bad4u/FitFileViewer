import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));

function runStep(label, args) {
    console.log(`[build-package] ${label}`);

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
runStep("run electron-builder", [
    scriptPath("run-electron-builder.mjs"),
    ...process.argv.slice(2),
]);

function scriptPath(name) {
    return path.join(repositoryRoot, "scripts", name);
}
