import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    buildRuntimeScriptPath,
    repositoryRoot,
    rootPlaywrightConfigPath,
} from "./lib/workspaces.mjs";

const require = createRequire(import.meta.url);
const playwrightPackagePath = require.resolve("@playwright/test/package.json");
export const playwrightCliPath = path.join(
    path.dirname(playwrightPackagePath),
    "cli.js"
);
export const playwrightNodeWarningOptions = ["--disable-warning=DEP0205"];

export function runPlaywrightSteps(argv = process.argv.slice(2)) {
    return [
        {
            args: [buildRuntimeScriptPath],
            label: "build runtime",
        },
        {
            args: [
                playwrightCliPath,
                "test",
                "--config",
                rootPlaywrightConfigPath,
                ...argv,
            ],
            label: "run playwright",
        },
    ];
}

export function buildPlaywrightNodeOptions(
    nodeOptions = process.env.NODE_OPTIONS
) {
    const trimmed = typeof nodeOptions === "string" ? nodeOptions.trim() : "";
    const playwrightOptions = playwrightNodeWarningOptions.join(" ");

    return trimmed ? `${trimmed} ${playwrightOptions}` : playwrightOptions;
}

export function buildPlaywrightEnvironment(env = process.env) {
    return {
        ...env,
        NODE_OPTIONS: buildPlaywrightNodeOptions(env.NODE_OPTIONS),
    };
}

export function runPlaywright(
    argv = process.argv.slice(2),
    commandRunner = spawnSync,
    logger = console.log
) {
    for (const { args, label } of runPlaywrightSteps(argv)) {
        logger(`[run-playwright] ${label}`);

        const result = commandRunner(
            process.execPath,
            args,
            label === "run playwright"
                ? {
                      cwd: repositoryRoot,
                      env: buildPlaywrightEnvironment(),
                      stdio: "inherit",
                  }
                : {
                      cwd: repositoryRoot,
                      stdio: "inherit",
                  }
        );

        if (result.error) {
            throw result.error;
        }

        if (result.status !== 0) {
            return result.status ?? 1;
        }
    }

    return 0;
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    process.exitCode = runPlaywright();
}
