import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
const prettierCliPath = require.resolve("prettier/bin/prettier.cjs");

const prettierTargets = [
    "package.json",
    "electron-app/package.json",
    "docusaurus/package.json",
    "docusaurus/docusaurus.config.ts",
    "docusaurus/sidebars.ts",
    "docusaurus/tsconfig.json",
    "docusaurus/typedoc.json",
    ".devskim.json",
    ".jscpd.json",
    ".markdown-link-check.json",
    ".markdownlint.json",
    ".ncurc.json",
    ".secretlintrc.cjs",
    ".vscode-test.mjs",
    "cliff.toml",
    "cspell.json",
    "electron-builder.config.cjs",
    "electron-builder.files.json",
    "lychee.toml",
    "mermaid.config.json",
    "prettier.config.mjs",
    "stylelint.config.mjs",
    ".remarkrc.mjs",
    "eslint.config.mjs",
    "playwright.config.ts",
    "vite.renderer.config.mjs",
    "vitest.config.ts",
    "tsconfig.eslint.json",
    "tsconfig.electron-app.json",
    "tsconfig.runtime.json",
    "tsconfig.vitest-typecheck.json",
    "tsconfig.electron-app.eslint.json",
    "*.yml",
    "*.yaml",
    ".github/*.yml",
    ".github/workflows/*.yml",
    "scripts/*.mjs",
    "tests/vitest/**/*.{cjs,mjs,ts}",
];

const prettierOptions = [
    "--log-level",
    "warn",
    "--cache",
    "--cache-location=.cache/.prettier-cache",
    "--cache-strategy=content",
];

const mode = process.argv[2] ?? "--check";

if (!new Set(["--check", "--write"]).has(mode)) {
    throw new Error(
        `Expected --check or --write as the prettier mode, received: ${mode}`
    );
}

const result = spawnSync(
    process.execPath,
    [
        prettierCliPath,
        ...prettierTargets,
        ...prettierOptions,
        mode,
    ],
    {
        cwd: repositoryRoot,
        stdio: "inherit",
    }
);

if (result.error) {
    throw result.error;
}

process.exitCode = result.status ?? 1;
