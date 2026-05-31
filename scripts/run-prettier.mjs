import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    appLeafletMeasureLitePath,
    docusaurusPackageRepositoryPath,
    repositoryRoot,
    rootDocusaurusTsconfigPath,
    rootElectronAppBaseTsconfigPath,
    rootElectronAppEslintTsconfigPath,
    rootElectronBuilderConfigPath,
    rootElectronAppTsconfigPath,
    rootEslintTsconfigPath,
    rootEslintConfigPath,
    rootPackageJsonPath,
    rootPlaywrightConfigPath,
    rootPrettierConfigPath,
    rootRuntimeTsconfigPath,
    rootStylelintConfigPath,
    rootTypedocConfigPath,
    rootViteRendererConfigPath,
    rootVitestConfigPath,
    rootVitestTypecheckTsconfigPath,
} from "./lib/workspaces.mjs";

const require = createRequire(import.meta.url);
const prettierCliPath = require.resolve("prettier/bin/prettier.cjs");

export const prettierTargets = [
    rootPackageJsonPath,
    docusaurusPackageRepositoryPath,
    "docusaurus/docusaurus.config.ts",
    "docusaurus/sidebars.ts",
    "docusaurus/tsconfig.json",
    rootTypedocConfigPath,
    ".markdown-link-check.json",
    ".markdownlint.json",
    ".ncurc.json",
    ".pre-commit-config.yaml",
    ".secretlintrc.cjs",
    "cliff.toml",
    "cspell.json",
    rootElectronBuilderConfigPath,
    "mermaid.config.json",
    rootPrettierConfigPath,
    rootStylelintConfigPath,
    ".remarkrc.mjs",
    rootEslintConfigPath,
    rootPlaywrightConfigPath,
    rootViteRendererConfigPath,
    rootVitestConfigPath,
    rootEslintTsconfigPath,
    rootElectronAppBaseTsconfigPath,
    rootElectronAppTsconfigPath,
    rootRuntimeTsconfigPath,
    rootDocusaurusTsconfigPath,
    rootVitestTypecheckTsconfigPath,
    rootElectronAppEslintTsconfigPath,
    "*.yml",
    "*.yaml",
    ".github/*.yml",
    ".github/workflows/*.yml",
    "scripts/*.mjs",
    "tests/fixtures/**/*.{js,ts}",
    "tests/integration/**/*.ts",
    "tests/unit/**/*.ts",
    "tests/playwright/**/*.ts",
    "tests/vitest/**/*.{cjs,mjs,ts}",
    appLeafletMeasureLitePath,
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
