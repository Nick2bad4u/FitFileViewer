import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

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
