import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
const tscCliPath = require.resolve("typescript/bin/tsc");

const tasks = new Map([
    [
        "declarations",
        [
            "--project",
            "tsconfig.electron-app.json",
            "--declaration",
            "--emitDeclarationOnly",
            "--declarationMap",
            "false",
            "--outDir",
            "./electron-app/types",
        ],
    ],
    ["runtime", ["--project", "tsconfig.runtime.json"]],
    [
        "typecheck",
        [
            "--project",
            "tsconfig.electron-app.json",
            "--noEmit",
        ],
    ],
]);

const [taskName, ...extraArgs] = process.argv.slice(2);
const taskArgs = tasks.get(taskName);

if (!taskArgs) {
    console.error(
        `[run-typescript] Expected one of: ${[...tasks.keys()].join(", ")}`
    );
    process.exitCode = 1;
} else {
    const result = spawnSync(
        process.execPath,
        [
            tscCliPath,
            ...taskArgs,
            ...extraArgs,
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
}
