import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { repositoryRoot, repositoryScriptPath } from "./lib/workspaces.mjs";

const require = createRequire(import.meta.url);
const playwrightPackagePath = require.resolve("@playwright/test/package.json");
export const playwrightCliPath = path.join(
    path.dirname(playwrightPackagePath),
    "cli.js"
);

export function runPlaywrightSteps(argv = process.argv.slice(2)) {
    return [
        {
            args: [repositoryScriptPath("build-runtime.mjs")],
            label: "build runtime",
        },
        {
            args: [
                playwrightCliPath,
                "test",
                "--config",
                "playwright.config.ts",
                ...argv,
            ],
            label: "run playwright",
        },
    ];
}

export function runPlaywright(
    argv = process.argv.slice(2),
    commandRunner = spawnSync,
    logger = console.log
) {
    for (const { args, label } of runPlaywrightSteps(argv)) {
        logger(`[run-playwright] ${label}`);

        const result = commandRunner(process.execPath, args, {
            cwd: repositoryRoot,
            stdio: "inherit",
        });

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
