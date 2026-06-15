import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
    adHocEslintCachePath,
    appEslintCachePath,
    appSourceDirectoryName,
    docusaurusEslintCachePath,
    docusaurusWorkspaceName,
    repositoryRoot,
    rootEslintCachePath,
    rootEslintConfigPath,
} from "./lib/workspaces.mjs";

const eslintPackagePath = fileURLToPath(
    import.meta.resolve("eslint/package.json")
);
const eslintCliPath = path.join(
    path.dirname(eslintPackagePath),
    "bin/eslint.js"
);

export const eslintTargets = Object.freeze({
    docusaurus: {
        cacheLocation: docusaurusEslintCachePath,
        paths: [`${docusaurusWorkspaceName}/**/*.{js,jsx,ts,tsx}`],
        prefixArgs: ["--config", rootEslintConfigPath],
    },
    app: {
        cacheLocation: appEslintCachePath,
        paths: [appSourceDirectoryName],
        prefixArgs: [
            "--config",
            rootEslintConfigPath,
            "--quiet",
        ],
    },
    root: {
        cacheLocation: rootEslintCachePath,
        paths: [
            ".",
            "--ignore-pattern",
            `${appSourceDirectoryName}/**`,
            "--ignore-pattern",
            `${docusaurusWorkspaceName}/**`,
        ],
        prefixArgs: [],
    },
});

function buildAdHocPathTarget(targetName) {
    if (
        typeof targetName !== "string" ||
        !existsSync(path.resolve(repositoryRoot, targetName))
    ) {
        return;
    }

    return {
        cacheLocation: adHocEslintCachePath,
        paths: [targetName],
        prefixArgs: ["--config", rootEslintConfigPath],
    };
}

export function buildEslintArgs(targetName, userArgs = []) {
    const target =
        eslintTargets[targetName] ?? buildAdHocPathTarget(targetName);
    if (!target) {
        throw new Error(`Unknown ESLint target: ${targetName}`);
    }

    return [
        ...target.prefixArgs,
        "--cache",
        "--cache-strategy",
        "content",
        "--cache-location",
        target.cacheLocation,
        ...userArgs,
        ...target.paths,
    ];
}

export function runEslintTarget(
    targetName,
    userArgs = process.argv.slice(3),
    commandRunner = spawnSync
) {
    const result = commandRunner(
        process.execPath,
        [eslintCliPath, ...buildEslintArgs(targetName, userArgs)],
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

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    process.exitCode = runEslintTarget(process.argv[2]);
}
