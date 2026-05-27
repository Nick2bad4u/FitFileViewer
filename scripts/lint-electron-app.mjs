import { spawnSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { repositoryRoot, repositoryScriptPath } from "./lib/workspaces.mjs";
import { runEslintTarget } from "./run-eslint.mjs";

export function lintElectronAppSteps(argv = process.argv.slice(2)) {
    return [
        {
            args: argv,
            label: "eslint",
            target: "electronApp",
            type: "eslint",
        },
        {
            args: [repositoryScriptPath("run-typescript.mjs"), "typecheck"],
            label: "typecheck",
            type: "script",
        },
    ];
}

export function runLintElectronApp(
    argv = process.argv.slice(2),
    eslintRunner = runEslintTarget,
    commandRunner = spawnSync,
    logger = console.log
) {
    for (const step of lintElectronAppSteps(argv)) {
        logger(`[lint-electron-app] ${step.label}`);

        const status =
            step.type === "eslint"
                ? eslintRunner(step.target, step.args)
                : runScript(step.args, commandRunner);

        if (status !== 0) {
            return status ?? 1;
        }
    }

    return 0;
}

function runScript(args, commandRunner) {
    const result = commandRunner(process.execPath, args, {
        cwd: repositoryRoot,
        stdio: "inherit",
    });

    if (result.error) {
        throw result.error;
    }

    return result.status ?? 1;
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    process.exitCode = runLintElectronApp();
}
