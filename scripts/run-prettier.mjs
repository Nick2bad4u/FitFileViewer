import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { appWorkspaceRelativePath, repositoryRoot } from "./lib/workspaces.mjs";

const require = createRequire(import.meta.url);
const prettierCliPath = require.resolve("prettier/bin/prettier.cjs");

export const prettierTargets = [
    "package.json",
    appWorkspaceRelativePath("package.json"),
    "docusaurus/package.json",
    "docusaurus/docusaurus.config.ts",
    "docusaurus/sidebars.ts",
    "docusaurus/tsconfig.json",
    "typedoc.json",
    ".markdown-link-check.json",
    ".markdownlint.json",
    ".ncurc.json",
    ".secretlintrc.cjs",
    "cliff.toml",
    "cspell.json",
    "electron-builder.config.cjs",
    "electron-builder.files.json",
    "mermaid.config.json",
    "prettier.config.mjs",
    "stylelint.config.mjs",
    ".remarkrc.mjs",
    "eslint.config.mjs",
    "playwright.config.ts",
    "vite.renderer.config.mjs",
    "vitest.config.ts",
    "tsconfig.eslint.json",
    "tsconfig.electron-app.base.json",
    "tsconfig.electron-app.json",
    "tsconfig.runtime.json",
    "tsconfig.docusaurus.json",
    "tsconfig.vitest-typecheck.json",
    "tsconfig.electron-app.eslint.json",
    "*.yml",
    "*.yaml",
    ".github/*.yml",
    ".github/workflows/*.yml",
    "scripts/*.mjs",
    "tests/unit/**/*.ts",
    "tests/playwright/**/*.ts",
    "tests/vitest/**/*.{cjs,mjs,ts}",
];

export const prettierOptions = [
    "--log-level",
    "warn",
    "--cache",
    "--cache-location=.cache/.prettier-cache",
    "--cache-strategy=content",
];

export function buildPrettierArgs(argv = process.argv.slice(2)) {
    const mode = argv[0] ?? "--check";
    const explicitTargets = argv.slice(1);

    if (!new Set(["--check", "--write"]).has(mode)) {
        throw new Error(
            `Expected --check or --write as the prettier mode, received: ${mode}`
        );
    }

    return [
        prettierCliPath,
        ...(explicitTargets.length > 0 ? explicitTargets : prettierTargets),
        ...prettierOptions,
        mode,
    ];
}

export function runPrettier(
    argv = process.argv.slice(2),
    commandRunner = spawnSync
) {
    const result = commandRunner(process.execPath, buildPrettierArgs(argv), {
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
    process.exitCode = runPrettier();
}
