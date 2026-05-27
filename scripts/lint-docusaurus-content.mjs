import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";
import { fileURLToPath } from "node:url";

const docusaurusRoot = fileURLToPath(new URL("../docusaurus", import.meta.url));
const require = createRequire(import.meta.url);
const markdownlintCliPath = require.resolve("markdownlint-cli2");

const markdownlintArgs = [
    markdownlintCliPath,
    "docs/**/*.{md,mdx}",
    "!docs/api/**/*.md",
    "blog/**/*.{md,mdx}",
    "src/**/*.{md,mdx}",
    "--config",
    "../.markdownlint.json",
];

const result = spawnSync(process.execPath, markdownlintArgs, {
    cwd: docusaurusRoot,
    stdio: "inherit",
});

if (result.error) {
    throw result.error;
}

process.exitCode = result.status ?? 1;
