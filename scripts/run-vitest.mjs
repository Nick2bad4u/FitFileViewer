import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    appIntegrationTestsPath,
    appUnitTestsPath,
    repositoryRoot,
    rootTabsTestsPath,
    rootUnitTestsPath,
    rootVitestConfigPath,
} from "./lib/workspaces.mjs";

export const vitestSuites = Object.freeze({
    integration: [appIntegrationTestsPath],
    tabs: [rootTabsTestsPath],
    unit: [rootUnitTestsPath, appUnitTestsPath],
});

const require = createRequire(import.meta.url);
const vitestPackagePath = require.resolve("vitest/package.json");
const vitestCliPath = path.join(path.dirname(vitestPackagePath), "vitest.mjs");
const suitePathMarker = "\0ffv-suite-paths\0";
const vitestOptionsWithValues = new Set([
    "--config",
    "--environment",
    "--maxWorkers",
    "--name",
    "--pool",
    "--project",
    "--reporter",
    "--sequence",
    "--testNamePattern",
    "--testTimeout",
    "--update",
]);

export function buildVitestArgs(argv) {
    return [
        "--config",
        rootVitestConfigPath,
        ...expandSuiteArgs(argv),
    ];
}

export function expandSuiteArgs(argv) {
    const expandedArgs = [];
    let suitePaths = null;

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === "--suite") {
            const suiteName = argv[index + 1];
            suitePaths = resolveSuitePaths(suiteName);
            expandedArgs.push(suitePathMarker);
            index += 1;
            continue;
        }

        if (arg.startsWith("--suite=")) {
            suitePaths = resolveSuitePaths(arg.slice("--suite=".length));
            expandedArgs.push(suitePathMarker);
            continue;
        }

        expandedArgs.push(arg);
    }

    if (!suitePaths) {
        return expandedArgs;
    }

    const hasExplicitTestPath = expandedArgs.some((arg, index) =>
        isExplicitTestPathArg(arg, index, expandedArgs)
    );

    return expandedArgs.flatMap((arg) => {
        if (arg !== suitePathMarker) {
            return [arg];
        }

        return hasExplicitTestPath ? [] : suitePaths;
    });
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

function isExplicitTestPathArg(arg, index, args) {
    if (arg === suitePathMarker || arg.startsWith("-")) {
        return false;
    }

    const previousArg = args[index - 1];
    if (
        previousArg &&
        vitestOptionsWithValues.has(previousArg) &&
        !previousArg.includes("=")
    ) {
        return false;
    }

    return (
        /[\\/]/u.test(arg) ||
        /[*?[\]{}]/u.test(arg) ||
        /\.[cm]?[jt]sx?$/u.test(arg)
    );
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    process.exitCode = runVitest();
}
