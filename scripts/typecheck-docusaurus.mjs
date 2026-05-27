import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    docusaurusPackagePath,
    repositoryRoot,
    rootDocusaurusTsconfigPath,
} from "./lib/workspaces.mjs";

const requireFromDocusaurus = createRequire(
    pathToFileURL(docusaurusPackagePath).href
);
export const docusaurusTypeScriptCliPath =
    requireFromDocusaurus.resolve("typescript/bin/tsc");
export const docusaurusTypecheckProject = rootDocusaurusTsconfigPath;

export function buildDocusaurusTypecheckArgs(argv = process.argv.slice(2)) {
    return [
        docusaurusTypeScriptCliPath,
        "--project",
        docusaurusTypecheckProject,
        ...argv,
    ];
}

export function runDocusaurusTypecheck(
    argv = process.argv.slice(2),
    commandRunner = spawnSync
) {
    const result = commandRunner(
        process.execPath,
        buildDocusaurusTypecheckArgs(argv),
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
    process.exitCode = runDocusaurusTypecheck();
}
