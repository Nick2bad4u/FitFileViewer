import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    appWorkspaceRepositoryPath,
    repositoryRoot,
} from "./lib/workspaces.mjs";

const require = createRequire(import.meta.url);
const stylelintPackagePath = require.resolve("stylelint/package.json");
const stylelintCliPath = path.join(
    path.dirname(stylelintPackagePath),
    "bin/stylelint.mjs"
);

export const stylelintTargets = [appWorkspaceRepositoryPath("**", "*.css")];
export const stylelintConfigPath = "stylelint.config.mjs";

export function buildStylelintArgs(argv = process.argv.slice(2)) {
    return [
        stylelintCliPath,
        ...stylelintTargets,
        "--config",
        stylelintConfigPath,
        ...argv,
    ];
}

export function runStylelint(
    argv = process.argv.slice(2),
    commandRunner = spawnSync
) {
    const result = commandRunner(process.execPath, buildStylelintArgs(argv), {
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
    process.exitCode = runStylelint();
}
