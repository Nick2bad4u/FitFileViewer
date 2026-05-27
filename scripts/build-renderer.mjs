import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { repositoryRoot, repositoryScriptPath } from "./lib/workspaces.mjs";

const require = createRequire(
    pathToFileURL(repositoryScriptPath("build-renderer.mjs")).href
);
const vitePackagePath = require.resolve("vite/package.json");
export const viteCliPath = path.join(
    path.dirname(vitePackagePath),
    "bin",
    "vite.js"
);
export const rendererViteConfigPath = "vite.renderer.config.mjs";

export function buildRendererArgs(argv = process.argv.slice(2)) {
    return [
        viteCliPath,
        "build",
        "--config",
        rendererViteConfigPath,
        ...argv,
    ];
}

export function runBuildRenderer(
    argv = process.argv.slice(2),
    commandRunner = spawnSync
) {
    const result = commandRunner(process.execPath, buildRendererArgs(argv), {
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
    process.exitCode = runBuildRenderer();
}
