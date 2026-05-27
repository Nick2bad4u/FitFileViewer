import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const docusaurusRoot = fileURLToPath(
    new URL("../docusaurus/", import.meta.url)
);
const requireFromDocusaurus = createRequire(
    new URL("../docusaurus/package.json", import.meta.url)
);
const docusaurusPackagePath = requireFromDocusaurus.resolve(
    "@docusaurus/core/package.json"
);
const docusaurusCliPath = path.join(
    path.dirname(docusaurusPackagePath),
    "bin",
    "docusaurus.mjs"
);
const docusaurusArgs = process.argv.slice(2);
const docusaurusCommand = docusaurusArgs.find((arg) => !arg.startsWith("-"));

if (
    [
        "build",
        "deploy",
        "serve",
        "start",
    ].includes(docusaurusCommand ?? "")
) {
    const syncResult = spawnSync(
        process.execPath,
        [
            path.join(
                repositoryRoot,
                "scripts",
                "sync-docusaurus-static-assets.mjs"
            ),
        ],
        {
            cwd: repositoryRoot,
            stdio: "inherit",
        }
    );

    if (syncResult.error) {
        throw syncResult.error;
    }

    if (syncResult.status !== 0) {
        process.exit(syncResult.status ?? 1);
    }
}

const result = spawnSync(
    process.execPath,
    [docusaurusCliPath, ...docusaurusArgs],
    {
        cwd: docusaurusRoot,
        stdio: "inherit",
    }
);

if (result.error) {
    throw result.error;
}

process.exitCode = result.status ?? 1;
