import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));

const steps = [
    {
        args: [scriptPath("clean-runtime-dist.mjs")],
        label: "clean runtime dist",
    },
    {
        args: [scriptPath("run-typescript.mjs"), "runtime"],
        label: "compile runtime TypeScript",
    },
    {
        args: [scriptPath("bundle-preload.mjs")],
        label: "bundle preload",
    },
    {
        args: [scriptPath("build-renderer.mjs")],
        label: "build renderer bundle",
    },
    {
        args: [scriptPath("format-runtime-output.mjs")],
        label: "format runtime output",
    },
    {
        args: [scriptPath("prepare-runtime-dist.mjs")],
        label: "prepare runtime dist",
    },
];

function scriptPath(name) {
    return path.join(repositoryRoot, "scripts", name);
}

for (const step of steps) {
    console.log(`[build-runtime] ${step.label}`);

    const result = spawnSync(process.execPath, step.args, {
        cwd: repositoryRoot,
        stdio: "inherit",
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        process.exitCode = result.status ?? 1;
        break;
    }
}
