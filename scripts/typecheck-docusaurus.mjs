import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";
import { fileURLToPath } from "node:url";

const docusaurusRoot = fileURLToPath(
    new URL("../docusaurus/", import.meta.url)
);
const requireFromDocusaurus = createRequire(
    new URL("../docusaurus/package.json", import.meta.url)
);
const tscCliPath = requireFromDocusaurus.resolve("typescript/bin/tsc");

const result = spawnSync(
    process.execPath,
    [
        tscCliPath,
        "--project",
        "tsconfig.json",
        ...process.argv.slice(2),
    ],
    {
        cwd: docusaurusRoot,
        stdio: "inherit",
    }
);

if (result.error) {
    throw result.error;
}

process.exitCode = result.status ?? 1;
