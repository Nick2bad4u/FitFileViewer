import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { appWorkspaceName } from "./lib/workspaces.mjs";

const repositoryRoot = resolveRepositoryRoot();
const require = createRequire(
    pathToFileURL(path.join(repositoryRoot, "scripts", "run-eslint.mjs")).href
);
const eslintPackagePath = require.resolve("eslint/package.json");
const eslintCliPath = path.join(
    path.dirname(eslintPackagePath),
    "bin/eslint.js"
);

export const eslintTargets = Object.freeze({
    docusaurus: {
        cacheLocation: ".cache/.eslintcache-docusaurus",
        paths: ["docusaurus/**/*.{js,jsx,ts,tsx}"],
        prefixArgs: ["--config", "eslint.config.mjs"],
    },
    electronApp: {
        cacheLocation: ".cache/.eslintcache-electron",
        paths: [appWorkspaceName],
        prefixArgs: [
            "--config",
            "eslint.config.mjs",
            "--quiet",
        ],
    },
    root: {
        cacheLocation: ".cache/.eslintcache-root",
        paths: [
            ".",
            "--ignore-pattern",
            `${appWorkspaceName}/**`,
            "--ignore-pattern",
            "docusaurus/**",
        ],
        prefixArgs: [],
    },
});

export function buildEslintArgs(targetName, userArgs = []) {
    const target = eslintTargets[targetName];
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

function resolveRepositoryRoot() {
    const setupImportMetaUrl = import.meta.url;
    if (setupImportMetaUrl.startsWith("file:")) {
        return fileURLToPath(new URL("..", setupImportMetaUrl));
    }

    return process.cwd();
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    process.exitCode = runEslintTarget(process.argv[2]);
}
