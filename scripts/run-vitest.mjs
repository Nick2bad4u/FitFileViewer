import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { repositoryRoot } from "./lib/workspaces.mjs";

export const vitestSuites = Object.freeze({
    integration: ["electron-app/tests/integration"],
    tabs: ["electron-app/tests/unit/tabs"],
    unit: ["tests/unit", "electron-app/tests/unit"],
});

const require = createRequire(import.meta.url);
const vitestPackagePath = require.resolve("vitest/package.json");
const vitestCliPath = path.join(path.dirname(vitestPackagePath), "vitest.mjs");

export function buildVitestArgs(argv) {
    return [
        "--config",
        "vitest.config.ts",
        ...expandSuiteArgs(argv),
    ];
}

export function expandSuiteArgs(argv) {
    const expandedArgs = [];

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === "--suite") {
            const suiteName = argv[index + 1];
            expandedArgs.push(...resolveSuitePaths(suiteName));
            index += 1;
            continue;
        }

        if (arg.startsWith("--suite=")) {
            expandedArgs.push(
                ...resolveSuitePaths(arg.slice("--suite=".length))
            );
            continue;
        }

        expandedArgs.push(arg);
    }

    return expandedArgs;
}

export function runVitest(
    argv = process.argv.slice(2),
    commandRunner = spawnSync
) {
    const result = commandRunner(
        process.execPath,
        [
            "--max-old-space-size=8192",
            vitestCliPath,
            ...buildVitestArgs(argv),
        ],
        {
            cwd: repositoryRoot,
            stdio: "inherit",
        }
    );

    if (result.error) {
        throw result.error;
    }

    return result.status ?? 1;
}

function resolveSuitePaths(suiteName) {
    if (!suiteName) {
        throw new Error("Missing Vitest suite name after --suite.");
    }

    const suitePaths = vitestSuites[suiteName];

    if (!suitePaths) {
        throw new Error(
            `Unknown Vitest suite "${suiteName}". Expected one of: ${Object.keys(
                vitestSuites
            ).join(", ")}.`
        );
    }

    return suitePaths;
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    process.exitCode = runVitest();
}
