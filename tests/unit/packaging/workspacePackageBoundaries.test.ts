import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    docusaurusDevelopmentBuildReleaseDocPath,
    docusaurusDevelopmentSetupDocPath,
    docusaurusHomePagePath,
    appSourceRepositoryPath,
    docusaurusPackageRepositoryPath,
    docusaurusWorkspaceRepositoryPath,
    rootAgentsPath,
    rootAppTsconfigPath,
    rootGitignorePath,
    rootGlobalTypesPath,
    rootDocsPath,
    rootPackageLockPath,
    rootPackageRepositoryPath,
    rootPlaywrightAppUiSpecPath,
    rootPlaywrightConfigPath,
    rootPrettierIgnorePath,
    rootRendererStyleImportsTypesPath,
    rootRuntimeTsconfigPath,
    rootStylelintConfigPath,
    rootToolingConfigPaths,
    rootTypesPath,
    rootLintNotesDocPath,
    rootDevelopmentGuideDocPath,
    docusaurusReadmeRepositoryPath,
} from "../../../scripts/lib/workspaces.mjs";

type PackageJson = {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    engines?: Record<string, string>;
    exports?: Record<string, string>;
    files?: string[];
    icon?: string;
    main?: string;
    private?: boolean;
    publishConfig?: Record<string, unknown>;
    scripts?: Record<string, string>;
    types?: string;
    workspaces?: string[];
};

function readPackageJson(relativePath: string): PackageJson {
    return JSON.parse(
        readFileSync(path.join(process.cwd(), relativePath), "utf8")
    ) as PackageJson;
}

function getRequiredPackageEntries(
    entries: Record<string, string> | undefined,
    label: string
): Record<string, string> {
    if (!entries) {
        throw new Error(`Expected package ${label}`);
    }

    return entries;
}

function getFileExistence(relativePaths: string[]): Record<string, boolean> {
    return Object.fromEntries(
        relativePaths.map((relativePath) => [
            relativePath,
            existsSync(path.join(process.cwd(), relativePath)),
        ])
    );
}

function findMatchingRepositoryFiles(
    rootRelativePath: string,
    predicate: (repositoryPath: string, fileName: string) => boolean
): string[] {
    const rootAbsolutePath = path.join(process.cwd(), rootRelativePath);
    const matches: string[] = [];

    if (!existsSync(rootAbsolutePath)) {
        return matches;
    }

    function visitDirectory(repositoryDirectoryPath: string): void {
        const absoluteDirectoryPath = path.join(
            process.cwd(),
            repositoryDirectoryPath
        );

        for (const entry of readdirSync(absoluteDirectoryPath, {
            withFileTypes: true,
        })) {
            const repositoryEntryPath = path.posix.join(
                repositoryDirectoryPath,
                entry.name
            );

            if (entry.isDirectory()) {
                visitDirectory(repositoryEntryPath);
                continue;
            }

            if (entry.isFile() && predicate(repositoryEntryPath, entry.name)) {
                matches.push(repositoryEntryPath);
            }
        }
    }

    visitDirectory(rootRelativePath);
    return matches.sort();
}

function createEngineDocsPattern(engineRange: string | undefined): RegExp {
    if (!engineRange) {
        throw new Error("Expected package engine range to be defined");
    }

    return new RegExp(
        engineRange
            .replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
            .replace(">=", ">=\\s*"),
        "u"
    );
}

const nestedElectronPackageDelegationPatterns = [
    /(?:^|[&;|]\s*|\s)(?:cd|pushd|Set-Location)\s+["']?electron-app["']?(?:\s|$)/u,
    /(?:^|\s)npm\s+(?:(?:--prefix|-C)\s+["']?electron-app["']?|(?:run\s+)?(?:-w|--workspace)\s+["']?electron-app["']?)/u,
] as const;

const staleNestedGeneratedAppPaths = [
    "electron-app/html",
    "electron-app/logs",
    "electron-app/release",
    "electron-app/temp-win7",
    "electron-app/test-report.junit.xml",
] as const;

const expectedElectronAppRootEntries = [
    "fitParser.ts",
    "fitParserRuntime.ts",
    "main",
    "main-ui.ts",
    "main.ts",
    "preload",
    "preload.ts",
    "renderer",
    "renderer.ts",
    "shared",
    "tsconfig.json",
    "ui",
    "utils",
    "windowStateRuntime.ts",
    "windowStateUtils.ts",
] as const;

const rootManagedReleaseVersioningPaths = [
    ".github/workflows/Build.yml",
    "package.json",
    "scripts/bump-app-version.mjs",
    rootDevelopmentGuideDocPath,
    docusaurusDevelopmentBuildReleaseDocPath,
] as const;

const localPackageManagerManifestNames = [
    "bun.lock",
    "bun.lockb",
    "npm-shrinkwrap.json",
    "package-lock.json",
    "package.json",
    "pnpm-lock.yaml",
    "yarn.lock",
] as const;

const localToolingConfigNames = [
    ".eslintignore",
    ".eslintrc",
    ".eslintrc.cjs",
    ".eslintrc.js",
    ".eslintrc.json",
    ".markdown-link-check.json",
    ".markdownlint.json",
    ".ncurc.json",
    ".prettierignore",
    ".prettierrc",
    ".prettierrc.cjs",
    ".prettierrc.js",
    ".prettierrc.json",
    ".remarkrc.mjs",
    ".secretlintrc.cjs",
    ".stylelintrc",
    ".stylelintrc.cjs",
    ".stylelintrc.js",
    ".stylelintrc.json",
    "eslint.config.cjs",
    "eslint.config.js",
    "eslint.config.mjs",
    "eslint.config.ts",
    "prettier.config.cjs",
    "prettier.config.js",
    "prettier.config.mjs",
    "prettier.config.ts",
    "stylelint.config.cjs",
    "stylelint.config.js",
    "stylelint.config.mjs",
    "stylelint.config.ts",
    "vite.config.cjs",
    "vite.config.js",
    "vite.config.mjs",
    "vite.config.ts",
    "vitest.config.cjs",
    "vitest.config.js",
    "vitest.config.mjs",
    "vitest.config.ts",
] as const;

const requiredRootToolingDevDependencies = [
    "@vitest/ui",
    "eslint-config-nick2bad4u",
    "fast-check",
    "fast-xml-parser",
    "prettier-config-nick2bad4u",
    "stylelint-config-nick2bad4u",
    "vitest",
] as const;

const requiredDocumentedTestDependencies = [
    "@playwright/test",
    "@vitest/coverage-v8",
    "@vitest/ui",
    "fast-check",
    "fast-xml-parser",
    "jsdom",
    "vitest",
] as const;

const rendererDependencyInventoryPath = path.posix.join(
    rootDocsPath,
    "RENDERER_DEPENDENCY_INVENTORY.md"
);

const expectedRootToolingScripts = {
    audit: "node scripts/run-audit.mjs",
    "build:flatpak":
        "npm run prepare:electron && npm run build:runtime-ts && node scripts/build-flatpak.mjs",
    "docs:install": "npm ci --prefix docusaurus --no-audit --no-fund",
    lint: "npm run lint:secretlint && npm run lint:root && npm run lint:app && npm run lint:docusaurus && npm run lint:remark",
    "lint:app": "node scripts/run-eslint.mjs app && npm run typecheck",
    "lint:app:fix":
        "node scripts/run-eslint.mjs app --fix && npm run typecheck",
    "lint:remark": "remark . --frail --ignore-path .remarkignore",
    "lint:secretlint":
        'secretlint "*.md" "docs/**/*.md" "docusaurus/docs/**/*.{md,mdx}" "docusaurus/blog/**/*.{md,mdx}" --secretlintrc .secretlintrc.cjs',
    "perf:baseline":
        "npm run prepare:electron && npm run build:runtime-ts && node scripts/run-performance-baseline.mjs --sample-count 3",
    "perf:compare":
        "npm run prepare:electron && npm run build:runtime-ts && node scripts/run-performance-baseline.mjs --sample-count 3 --compare artifacts/performance-baseline.previous.json --output artifacts/performance-baseline.current.json",
    "perf:trend":
        "npm run prepare:electron && npm run build:runtime-ts && node scripts/run-performance-baseline.mjs --sample-count 3 --compare-if-exists artifacts/performance-baseline.previous.json --output artifacts/performance-baseline-cache/performance-baseline.json",
    "prepare:electron": "node scripts/ensure-electron-binary.mjs",
    package: "npm run package:unsigned",
    "package:signed":
        "npm run release:check-signing:required && cross-env REQUIRE_CODE_SIGNING=true node scripts/build-package.mjs --dir",
    "package:unsigned":
        "cross-env FFV_FORCE_UNSIGNED_PACKAGE=true CSC_IDENTITY_AUTO_DISCOVERY=false REQUIRE_CODE_SIGNING=false node scripts/build-package.mjs --dir",
    "release:check-signing": "node scripts/check-signing-env.mjs",
    "release:check-signing:required":
        "node scripts/check-signing-env.mjs --require-signing",
    pretest: "npm run prepare:electron && npm run build:runtime-ts",
    "release:verify": "npm run verify:release",
    "test:packaged": "node scripts/run-packaged-smoke.mjs",
    "test:ui":
        "npm run build:runtime-ts && node --max-old-space-size=8192 ./node_modules/vitest/vitest.mjs --config vitest.config.ts --ui",
    "test:playwright":
        "npm run build:runtime-ts && playwright test tests/playwright/app-ui.spec.ts --config playwright.config.ts",
    "sync:node-version-files": "node scripts/sync-node-version-files.mjs",
    "sync:node-version-files:check":
        "node scripts/sync-node-version-files.mjs --check",
    "update-deps":
        "ncu --configFileName .ncurc.json --configFilePath node_modules/ncu-config-nick2bad4u && npm update --force && npm install --force && npm run sync:node-version-files",
    "verify:fast":
        "npm run sync:node-version-files:check && npm run prettier && npm run lint && npm run lint:css && npm run docs:typecheck && npm test",
    "verify:full":
        "npm run verify:fast && npm run docs:build && npm run audit && npm run test:playwright && npm run release:check-signing && npm run package:unsigned && npm run test:packaged",
    "verify:release": "npm run verify:full",
    "verify:release:signed":
        "npm run verify:fast && npm run docs:build && npm run audit && npm run test:playwright && npm run package:signed && cross-env REQUIRE_CODE_SIGNING=true npm run release:verify-signing-artifacts && npm run test:packaged",
} as const;

const disallowedRootDevDependencyNamePatterns = [
    /^@actions\//u,
    /^eslint-plugin-/u,
] as const;

function delegatesToNestedElectronPackage(script: string): boolean {
    return nestedElectronPackageDelegationPatterns.some((pattern) =>
        pattern.test(script)
    );
}

function getInventoryCategoryPackages(
    markdown: string,
    category: string
): string[] {
    const escapedCategory = category.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
    const rowPattern = new RegExp(
        String.raw`^\| ${escapedCategory}\s+\|(?<packages>.*?)\|$`,
        "mu"
    );
    const rowPackages = markdown.match(rowPattern)?.groups?.packages ?? "";

    return [...rowPackages.matchAll(/`([^`]+)`/gu)]
        .map((match) => match[1])
        .filter((packageName): packageName is string => Boolean(packageName))
        .sort();
}

function getInventoryPackageNames(markdown: string): Set<string> {
    return new Set(
        [...markdown.matchAll(/`([^`]+)`/gu)]
            .map((match) => match[1])
            .filter((packageName): packageName is string =>
                Boolean(packageName)
            )
    );
}

function expandNpmRunScriptGraph(
    scripts: Record<string, string>,
    entryScriptName: string
): string {
    const visitedScriptNames = new Set<string>();
    const scriptQueue = [entryScriptName];
    const expandedCommands: string[] = [];

    while (scriptQueue.length > 0) {
        const scriptName = scriptQueue.shift();
        if (!scriptName || visitedScriptNames.has(scriptName)) {
            continue;
        }

        visitedScriptNames.add(scriptName);
        const command = scripts[scriptName];
        if (!command) {
            continue;
        }

        expandedCommands.push(`${scriptName}: ${command}`);
        for (const match of command.matchAll(/\bnpm run ([\w:-]+)/gu)) {
            const referencedScriptName = match[1];
            if (
                referencedScriptName &&
                !visitedScriptNames.has(referencedScriptName)
            ) {
                scriptQueue.push(referencedScriptName);
            }
        }
    }

    return expandedCommands.join("\n");
}

describe("workspace package boundaries", () => {
    it("keeps shared tooling and local Vitest UI support in the root package", () => {
        expect.assertions(11);

        const rootPackage = readPackageJson("package.json");
        const docusaurusPackage = readPackageJson("docusaurus/package.json");
        const directDisallowedDevDependencies = Object.keys(
            rootPackage.devDependencies ?? {}
        ).filter((dependencyName) =>
            disallowedRootDevDependencyNamePatterns.some((pattern) =>
                pattern.test(dependencyName)
            )
        );

        expect(rootPackage).not.toHaveProperty("workspaces");
        expect(docusaurusPackage.overrides).toStrictEqual({
            "copy-webpack-plugin": {
                "serialize-javascript": "7.0.5",
            },
            "css-minimizer-webpack-plugin": {
                "serialize-javascript": "7.0.5",
            },
            joi: "18.2.1",
            sockjs: {
                uuid: "11.1.1",
            },
        });
        expect(
            Object.fromEntries(
                Object.keys(expectedRootToolingScripts).map((scriptName) => [
                    scriptName,
                    rootPackage.scripts?.[scriptName],
                ])
            )
        ).toStrictEqual(expectedRootToolingScripts);
        expect(
            Object.fromEntries(
                requiredRootToolingDevDependencies.map((dependencyName) => [
                    dependencyName,
                    Boolean(
                        rootPackage.devDependencies?.[dependencyName]?.trim()
                    ),
                ])
            )
        ).toStrictEqual({
            "@vitest/ui": true,
            "eslint-config-nick2bad4u": true,
            "fast-check": true,
            "fast-xml-parser": true,
            "prettier-config-nick2bad4u": true,
            "stylelint-config-nick2bad4u": true,
            vitest: true,
        });
        expect(
            Object.keys(rootPackage.dependencies ?? {}).sort()
        ).toStrictEqual([
            "@garmin/fitsdk",
            "electron-conf",
            "electron-log",
            "electron-updater",
            "zod",
        ]);
        expect(directDisallowedDevDependencies).toStrictEqual([]);
        expect(rootPackage.devDependencies).not.toHaveProperty("@actions/core");
        expect(rootPackage.devDependencies).not.toHaveProperty(
            "eslint-plugin-unicorn"
        );
        expect(rootPackage.devDependencies).not.toHaveProperty(
            "eslint-plugin-vue"
        );
        expect(rootPackage.devDependencies).not.toHaveProperty(
            "@types/leaflet-draw"
        );
        expect(rootPackage.devDependencies).not.toHaveProperty(
            "@types/leaflet.markercluster"
        );
    });

    it("keeps renderer dependency inventory aligned with root test packages", () => {
        expect.assertions(1);

        const dependencyInventory = readFileSync(
            path.join(process.cwd(), rendererDependencyInventoryPath),
            "utf8"
        );

        expect(
            getInventoryCategoryPackages(dependencyInventory, "Tests")
        ).toStrictEqual([...requiredDocumentedTestDependencies].sort());
    });

    it("keeps renderer dependency inventory classifying every root manifest package", () => {
        expect.assertions(1);

        const rootPackage = readPackageJson(rootPackageRepositoryPath);
        const dependencyInventory = readFileSync(
            path.join(process.cwd(), rendererDependencyInventoryPath),
            "utf8"
        );
        const inventoryPackageNames =
            getInventoryPackageNames(dependencyInventory);
        const rootManifestPackageNames = [
            ...Object.keys(rootPackage.dependencies ?? {}),
            ...Object.keys(rootPackage.devDependencies ?? {}),
        ].sort();

        expect(
            rootManifestPackageNames.filter(
                (packageName) => !inventoryPackageNames.has(packageName)
            )
        ).toStrictEqual([]);
    });

    it("keeps root package scripts from delegating Electron app work to a nested package", () => {
        expect.assertions(2);

        const rootPackage = readPackageJson("package.json");

        expect(
            [
                "cd electron-app && npm run lint",
                "npm --prefix electron-app run test",
                "npm run -w electron-app build",
            ].map((script) => delegatesToNestedElectronPackage(script))
        ).toStrictEqual([
            true,
            true,
            true,
        ]);
        expect(
            Object.entries(rootPackage.scripts ?? {})
                .filter(([, script]) =>
                    delegatesToNestedElectronPackage(script)
                )
                .map(([scriptName, script]) => `${scriptName}: ${script}`)
        ).toStrictEqual([]);
    });

    it("keeps app release versioning rooted at the repository package", () => {
        expect.assertions(26);

        const rootPackage = readPackageJson(rootPackageRepositoryPath);
        const releaseWorkflow = readFileSync(
            path.join(process.cwd(), ".github/workflows/Build.yml"),
            "utf8"
        );
        const releaseVersioningFilesWithWorkspaceFlags =
            rootManagedReleaseVersioningPaths
                .filter((relativePath) =>
                    readFileSync(
                        path.join(process.cwd(), relativePath),
                        "utf8"
                    ).includes("--workspace")
                )
                .sort();

        expect(rootPackage.scripts?.["release:bump-version"]).toBe(
            "node scripts/bump-app-version.mjs"
        );
        expect(rootPackage.scripts?.["release:verify"]).toBe(
            "npm run verify:release"
        );
        expect(rootPackage.scripts?.["release:verify-signing-artifacts"]).toBe(
            "node scripts/verify-signed-artifacts.mjs"
        );
        expect(releaseWorkflow).toContain("xvfb-run -a npm run release:verify");
        expect(releaseWorkflow).toContain("npm install --global npm@11.16.0");
        expect(releaseWorkflow).toContain(
            'echo "Release verification is still running..."'
        );
        expect(releaseWorkflow).toContain("npm run release:check-signing");
        expect(releaseWorkflow).toContain("require-code-signing:");
        expect(releaseWorkflow).toContain("release-type:");
        expect(releaseWorkflow).toContain(
            '--release-type "${{ inputs.release-type }}"'
        );
        expect(releaseWorkflow).toContain("reuse-current-version:");
        expect(releaseWorkflow).toContain("default: false");
        expect(releaseWorkflow).toContain(
            "REQUIRE_CODE_SIGNING: ${{ inputs.require-code-signing }}"
        );
        expect(releaseWorkflow).toContain(
            "runner.os == 'macOS' && inputs.require-code-signing"
        );
        expect(releaseWorkflow).toContain(
            "steps.bump.outputs.new_version || steps.reuse_version.outputs.new_version"
        );
        expect(releaseWorkflow).toContain(
            "steps.commit_version.outputs.bump_sha || steps.reuse_version.outputs.bump_sha"
        );
        expect(releaseWorkflow).toContain(
            'tag_sha=$(git rev-list -n 1 "v${version}")'
        );
        expect(releaseWorkflow).toContain(
            'if [ "$tag_sha" != "$head_sha" ]; then'
        );
        expect(releaseWorkflow).toContain(
            "npm run release:verify-signing-artifacts"
        );
        expect(releaseWorkflow).toContain(
            "npm ci --ignore-scripts --no-audit --no-fund"
        );
        expect(releaseWorkflow).toContain("node-version-file: .node-version");
        expect(releaseWorkflow).toContain("SIGNING_VERIFICATION_OUTCOME:");
        expect(releaseWorkflow).toContain(
            "release-dist/signing-verification-report.json"
        );
        expect(releaseWorkflow).toContain("npm run test:packaged");
        expect(releaseWorkflow).toContain(
            "Release artifacts are intentionally unsigned"
        );
        expect(releaseVersioningFilesWithWorkspaceFlags).toStrictEqual([]);
    });

    it("keeps release rehearsal manual and unsigned", () => {
        expect.assertions(32);

        const rootPackage = readPackageJson(rootPackageRepositoryPath);
        const releaseRehearsalWorkflow = readFileSync(
            path.join(process.cwd(), ".github/workflows/release-rehearsal.yml"),
            "utf8"
        );
        const developmentGuide = readFileSync(
            path.join(process.cwd(), "docs/DEVELOPMENT_GUIDE.md"),
            "utf8"
        );

        expect(releaseRehearsalWorkflow).toContain("workflow_dispatch:");
        expect(releaseRehearsalWorkflow).toContain("require-code-signing:");
        expect(releaseRehearsalWorkflow).toContain(
            "npm run release:check-signing"
        );
        expect(releaseRehearsalWorkflow).toContain(
            "APPLE_API_ISSUER: ${{ matrix.runner-os == 'macOS' && secrets.APPLE_API_ISSUER || '' }}"
        );
        expect(releaseRehearsalWorkflow).toContain(
            "APPLE_API_KEY_BASE64: ${{ secrets.APPLE_API_KEY_BASE64 }}"
        );
        expect(releaseRehearsalWorkflow).toContain(
            'echo "APPLE_API_KEY=$APPLE_API_KEY_PATH" >> "$GITHUB_ENV"'
        );
        expect(releaseRehearsalWorkflow).toContain(
            "APPLE_API_KEY_ID: ${{ matrix.runner-os == 'macOS' && secrets.APPLE_API_KEY_ID || '' }}"
        );
        expect(releaseRehearsalWorkflow).toContain(
            "APPLE_APP_SPECIFIC_PASSWORD: ${{ matrix.runner-os == 'macOS' && secrets.APPLE_APP_SPECIFIC_PASSWORD || '' }}"
        );
        expect(releaseRehearsalWorkflow).toContain(
            "APPLE_ID: ${{ matrix.runner-os == 'macOS' && secrets.APPLE_ID || '' }}"
        );
        expect(releaseRehearsalWorkflow).toContain(
            "APPLE_KEYCHAIN_PROFILE: ${{ matrix.runner-os == 'macOS' && secrets.APPLE_KEYCHAIN_PROFILE || '' }}"
        );
        expect(releaseRehearsalWorkflow).toContain(
            "APPLE_TEAM_ID: ${{ matrix.runner-os == 'macOS' && secrets.APPLE_TEAM_ID || '' }}"
        );
        expect(releaseRehearsalWorkflow).toContain(
            "CSC_INSTALLER_KEY_PASSWORD: ${{ matrix.runner-os == 'macOS' && secrets.MACOS_CSC_INSTALLER_KEY_PASSWORD || '' }}"
        );
        expect(releaseRehearsalWorkflow).toContain(
            "CSC_INSTALLER_LINK: ${{ matrix.runner-os == 'macOS' && secrets.MACOS_CSC_INSTALLER_LINK || '' }}"
        );
        expect(releaseRehearsalWorkflow).toContain(
            "CSC_KEY_PASSWORD: ${{ matrix.runner-os == 'macOS' && secrets.MACOS_CSC_KEY_PASSWORD || matrix.runner-os == 'Windows' && secrets.WINDOWS_CSC_KEY_PASSWORD || '' }}"
        );
        expect(releaseRehearsalWorkflow).toContain(
            "CSC_LINK: ${{ matrix.runner-os == 'macOS' && secrets.MACOS_CSC_LINK || '' }}"
        );
        expect(releaseRehearsalWorkflow).toContain(
            "WIN_CSC_LINK: ${{ matrix.runner-os == 'Windows' && secrets.WINDOWS_CSC_LINK || '' }}"
        );
        expect(releaseRehearsalWorkflow).toContain("npm run release:verify");
        expect(releaseRehearsalWorkflow).toContain(
            'CSC_IDENTITY_AUTO_DISCOVERY: "false"'
        );
        expect(releaseRehearsalWorkflow).toContain(
            'FFV_FORCE_UNSIGNED_PACKAGE: "true"'
        );
        expect(releaseRehearsalWorkflow).toContain(
            "npm run release:list-release-dist-files"
        );
        expect(releaseRehearsalWorkflow).toContain("actions/upload-artifact@");
        expect(rootPackage.scripts?.["verify:full"]).toContain(
            "npm run test:packaged"
        );
        expect(developmentGuide).toContain("### Release Rehearsal");
        expect(developmentGuide).toContain("`npm run package:signed`");
        expect(developmentGuide).toContain("`npm run package:unsigned`");
        expect(developmentGuide).toContain("`npm run verify:release:signed`");
        expect(developmentGuide).toContain(
            "`npm run release:verify-signing-artifacts`"
        );

        const buildReleaseGuide = readFileSync(
            path.join(process.cwd(), docusaurusDevelopmentBuildReleaseDocPath),
            "utf8"
        );

        expect(buildReleaseGuide).toContain("npm run package:unsigned");
        expect(buildReleaseGuide).toContain("npm run package:signed");
        expect(buildReleaseGuide).toContain("npm run verify:release:signed");
        expect(buildReleaseGuide).toContain(
            "npm run release:verify-signing-artifacts"
        );
        expect(buildReleaseGuide).toContain(
            "release-dist/signing-verification-report.json"
        );
    });

    it("keeps verify release as the full pre-release readiness gate", () => {
        expect.assertions(28);

        const rootPackage = readPackageJson(rootPackageRepositoryPath);
        const scripts = rootPackage.scripts ?? {};
        const expandedReleaseGate = expandNpmRunScriptGraph(
            scripts,
            "verify:release"
        );
        const expandedSignedReleaseGate = expandNpmRunScriptGraph(
            scripts,
            "verify:release:signed"
        );

        expect(scripts["release:verify"]).toBe("npm run verify:release");
        expect(scripts["verify:release"]).toBe("npm run verify:full");
        expect(scripts["sync:node-version-files:check"]).toBe(
            "node scripts/sync-node-version-files.mjs --check"
        );
        expect(scripts["verify:release:signed"]).toBe(
            "npm run verify:fast && npm run docs:build && npm run audit && npm run test:playwright && npm run package:signed && cross-env REQUIRE_CODE_SIGNING=true npm run release:verify-signing-artifacts && npm run test:packaged"
        );
        expect(expandedReleaseGate).toContain("verify:release:");
        expect(expandedReleaseGate).toContain("verify:full:");
        expect(expandedReleaseGate).toContain("verify:fast:");
        expect(expandedReleaseGate).toContain(
            "npm run sync:node-version-files:check"
        );
        expect(expandedReleaseGate).toContain("npm run prettier");
        expect(expandedReleaseGate).toContain("npm run lint");
        expect(expandedReleaseGate).toContain("npm run lint:css");
        expect(expandedReleaseGate).toContain("npm run docs:typecheck");
        expect(expandedReleaseGate).toContain("npm test");
        expect(expandedReleaseGate).toContain("npm run docs:build");
        expect(expandedReleaseGate).toContain("npm run audit");
        expect(expandedReleaseGate).toContain("npm run test:playwright");
        expect(expandedReleaseGate).toContain("npm run release:check-signing");
        expect(expandedReleaseGate).toContain("npm run package:unsigned");
        expect(expandedReleaseGate).toContain("npm run test:packaged");
        expect(scripts["package:unsigned"]).toContain(
            "REQUIRE_CODE_SIGNING=false"
        );
        expect(scripts["package:signed"]).toContain(
            "REQUIRE_CODE_SIGNING=true"
        );
        expect(expandedSignedReleaseGate).toContain("verify:release:signed:");
        expect(expandedSignedReleaseGate).toContain("verify:fast:");
        expect(expandedSignedReleaseGate).toContain("npm run docs:build");
        expect(expandedSignedReleaseGate).toContain("npm run package:signed");
        expect(expandedSignedReleaseGate).toContain(
            "npm run release:verify-signing-artifacts"
        );
        expect(expandedSignedReleaseGate).toContain("npm run test:packaged");
        expect(expandedSignedReleaseGate).not.toContain(
            "npm run package:unsigned"
        );
    });

    it("keeps release readiness backed by app-level regression smoke coverage", () => {
        expect.assertions(11);

        const rootPackage = readPackageJson(rootPackageRepositoryPath);
        const playwrightSmoke = readFileSync(
            path.join(process.cwd(), rootPlaywrightAppUiSpecPath),
            "utf8"
        );

        expect(rootPackage.scripts?.["verify:full"]).toContain(
            "npm run test:playwright"
        );
        expect(rootPackage.scripts?.["test:playwright"]).toContain(
            rootPlaywrightAppUiSpecPath
        );
        expect(playwrightSmoke).toContain(
            'test("auto-renders the selected FIT file in the Raw Data tab"'
        );
        expect(playwrightSmoke).toContain(
            'test("opens a real FIT file through the Open File button"'
        );
        expect(playwrightSmoke).toContain("expectAltFitIframeLoadedActivity");
        expect(playwrightSmoke).toContain(
            'test("loads the Zwift map iframe when the Zwift tab is selected"'
        );
        expect(playwrightSmoke).toContain(
            'expectLoadedActivityStatePreserved("switching to Zwift")'
        );
        expect(playwrightSmoke).toContain(
            'test("shows loading and loaded states for an empty Browser folder"'
        );
        expect(playwrightSmoke).toContain(
            'test("clears distance and area map measurements through the registered measure control"'
        );
        expect(playwrightSmoke).toContain(
            'test("renders a real FIT file across map, charts, data, and summary tabs"'
        );
        expect(playwrightSmoke).toContain("expectTabReady");
    });

    it("keeps agent guidance aligned with the root-managed workspace", () => {
        expect.assertions(4);

        const agentInstructions = readFileSync(
            path.join(process.cwd(), rootAgentsPath),
            "utf8"
        );

        expect(agentInstructions).toContain(
            "FitFileViewer is a root-managed Electron workspace"
        );
        expect(agentInstructions).toContain(
            "Tooling, npm scripts, package metadata, and shared config live at the repository root"
        );
        expect(agentInstructions).toContain(
            "Electron source lives under `electron-app/`"
        );
        expect(agentInstructions).not.toContain(
            "FitFileViewer is centered on `electron-app/`"
        );
    });

    it("keeps agent commit guidance on signed, verified local commits", () => {
        expect.assertions(4);

        const commitInstructions = readFileSync(
            path.join(
                process.cwd(),
                ".github/agent-commit-message-instructions.md"
            ),
            "utf8"
        );

        expect(commitInstructions).toContain(
            "Create signed commits when local commit signing is configured"
        );
        expect(commitInstructions).toContain("git verify-commit HEAD");
        expect(commitInstructions).toContain("## Format Requirements");
        expect(commitInstructions).toContain(
            "## Commitlint-enforced hybrid header format"
        );
    });

    it("keeps the root app package as the runtime app manifest", () => {
        expect.assertions(1);

        const appPackage = readPackageJson(rootPackageRepositoryPath);
        const nestedAppPackageManifestPaths =
            localPackageManagerManifestNames.map((manifestName) =>
                appSourceRepositoryPath(manifestName)
            );

        expect({
            dependencies: Object.keys(appPackage.dependencies ?? {}).sort(),
            files: appPackage.files,
            forbiddenPackageFileEntries: (appPackage.files ?? []).filter(
                (fileEntry) => ["node_modules/", "vendor/"].includes(fileEntry)
            ),
            hasPublishConfig: Object.hasOwn(appPackage, "publishConfig"),
            icon: appPackage.icon,
            indexHtmlExport: getRequiredPackageEntries(
                appPackage.exports,
                "exports"
            )["./index.html"],
            main: appPackage.main,
            nestedAppPackageManifestFiles: getFileExistence(
                nestedAppPackageManifestPaths
            ),
            private: appPackage.private,
            runtimeBuildScript: appPackage.scripts?.["build:runtime-ts"],
            types: appPackage.types,
            vitestDevDependency:
                typeof appPackage.devDependencies?.vitest === "string" &&
                appPackage.devDependencies.vitest.length > 0,
        }).toStrictEqual({
            dependencies: [
                "@garmin/fitsdk",
                "electron-conf",
                "electron-log",
                "electron-updater",
                "zod",
            ],
            files: [
                "dist/",
                rootGlobalTypesPath,
                "package.json",
            ],
            forbiddenPackageFileEntries: [],
            hasPublishConfig: false,
            icon: "dist/icons/favicon.ico",
            indexHtmlExport: "./dist/index.html",
            main: "dist/main.js",
            nestedAppPackageManifestFiles: Object.fromEntries(
                nestedAppPackageManifestPaths.map((manifestPath) => [
                    manifestPath,
                    false,
                ])
            ),
            private: true,
            runtimeBuildScript: "node scripts/build-runtime.mjs",
            types: rootGlobalTypesPath,
            vitestDevDependency: true,
        });
    });

    it("keeps the Electron app root limited to runtime source entries", () => {
        expect.assertions(2);

        const electronAppRootEntries = readdirSync(
            path.join(process.cwd(), "electron-app")
        ).sort();

        expect(electronAppRootEntries).toStrictEqual(
            [...expectedElectronAppRootEntries].sort()
        );
        expect(electronAppRootEntries).not.toContain("package.json");
    });

    it("keeps renderer declaration shims rooted with app type support", () => {
        expect.assertions(1);

        expect(
            getFileExistence([
                rootRendererStyleImportsTypesPath,
                appSourceRepositoryPath("renderer", "styleImports.d.ts"),
            ])
        ).toStrictEqual({
            [appSourceRepositoryPath("renderer", "styleImports.d.ts")]: false,
            [rootRendererStyleImportsTypesPath]: true,
        });
    });

    it("keeps private workspace runtime policy centralized at the root", () => {
        expect.assertions(3);

        const rootPackage = readPackageJson("package.json");
        const docusaurusPackage = readPackageJson(
            docusaurusPackageRepositoryPath
        );

        expect(rootPackage.engines).toStrictEqual({
            node: ">=22.12.0",
            npm: ">=11.15.0",
        });
        expect(docusaurusPackage).not.toHaveProperty("engines");
        expect(docusaurusPackage).toHaveProperty("private", true);
    });

    it("keeps setup docs aligned with root runtime engines", () => {
        expect.assertions(4);

        const rootPackage = readPackageJson("package.json");
        const setupDocs = [
            rootDevelopmentGuideDocPath,
            docusaurusDevelopmentSetupDocPath,
        ].map((relativePath) =>
            readFileSync(path.join(process.cwd(), relativePath), "utf8")
        );
        const nodeEnginePattern = createEngineDocsPattern(
            rootPackage.engines?.node
        );
        const npmEnginePattern = createEngineDocsPattern(
            rootPackage.engines?.npm
        );

        for (const doc of setupDocs) {
            expect(doc).toMatch(nodeEnginePattern);
            expect(doc).toMatch(npmEnginePattern);
        }
    });

    it("keeps public package snippets aligned with the root app manifest", () => {
        expect.assertions(7);

        const rootPackage = readPackageJson("package.json");
        const buildReleaseGuide = readFileSync(
            path.join(process.cwd(), docusaurusDevelopmentBuildReleaseDocPath),
            "utf8"
        );
        const homepageSource = readFileSync(
            path.join(process.cwd(), docusaurusHomePagePath),
            "utf8"
        );

        expect(homepageSource).toContain(`"name": "${rootPackage.name}"`);
        expect(homepageSource).toContain(`"main": "${rootPackage.main}"`);
        expect(homepageSource).toContain('"docusaurus"');
        expect(homepageSource).not.toContain("fitfileviewer-root");
        expect(homepageSource).not.toContain('"electron-app",');
        expect(buildReleaseGuide).toContain("files: rootPackageFiles");
        expect(buildReleaseGuide).not.toContain("appPackageFiles");
    });

    it("keeps dependency update configuration rooted at the app package", () => {
        expect.assertions(26);

        const rootPackage = readPackageJson(rootPackageRepositoryPath);
        const updateDepsScript = rootPackage.scripts?.["update-deps"] ?? "";
        const dependencyValidationWorkflow = readFileSync(
            path.join(
                process.cwd(),
                ".github/workflows/dependency-validation.yml"
            ),
            "utf8"
        );

        expect(updateDepsScript).toContain("ncu --configFileName .ncurc.json");
        expect(updateDepsScript).toContain(
            "--configFilePath node_modules/ncu-config-nick2bad4u"
        );
        expect(updateDepsScript).not.toContain("electron-app/");
        expect(dependencyValidationWorkflow).toContain("schedule:");
        expect(dependencyValidationWorkflow).toContain('".node-version"');
        expect(dependencyValidationWorkflow).toContain('".nvmrc"');
        expect(dependencyValidationWorkflow).not.toContain('".ncurc.json"');
        expect(dependencyValidationWorkflow).toContain(
            "node-version-file: .node-version"
        );
        expect(dependencyValidationWorkflow).toContain(
            "npm run sync:node-version-files:check"
        );
        expect(dependencyValidationWorkflow).toContain(
            "node-version-files-check.log"
        );
        expect(dependencyValidationWorkflow).toContain(
            "xvfb-run -a npm run release:verify"
        );
        expect(dependencyValidationWorkflow).toContain(
            "Verify unsigned package artifacts"
        );
        expect(dependencyValidationWorkflow).toContain("test -d release-dist");
        expect(dependencyValidationWorkflow).toContain(
            'test -n "$(find release-dist -type f -print -quit)"'
        );
        expect(dependencyValidationWorkflow).toContain(
            "tee artifacts/dependency-validation/npm-ci-app.log"
        );
        expect(dependencyValidationWorkflow).toContain(
            "tee artifacts/dependency-validation/npm-ci-docusaurus.log"
        );
        expect(dependencyValidationWorkflow).toContain(
            "Collect dependency validation diagnostics"
        );
        expect(dependencyValidationWorkflow).toContain(
            "repository-node-version.txt"
        );
        expect(dependencyValidationWorkflow).toContain("repository-nvmrc.txt");
        expect(dependencyValidationWorkflow).toContain(
            "cp -R release-dist artifacts/dependency-validation/release-dist"
        );
        expect(dependencyValidationWorkflow).toContain(
            "root-artifacts-files.txt"
        );
        expect(dependencyValidationWorkflow).toContain(
            "artifacts/dependency-validation/root-artifacts/"
        );
        expect(dependencyValidationWorkflow).toContain(
            "Summarize dependency validation diagnostics"
        );
        expect(dependencyValidationWorkflow).toContain("GITHUB_STEP_SUMMARY");
        expect(dependencyValidationWorkflow).toContain(
            "dependency-validation-diagnostics"
        );
        expect(dependencyValidationWorkflow).toContain(
            "actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a"
        );
    });

    it("keeps Docusaurus setup guidance in maintained docs pages", () => {
        expect.assertions(7);

        const docusaurusReadme = readFileSync(
            path.join(process.cwd(), docusaurusReadmeRepositoryPath),
            "utf8"
        );
        const docusaurusSetupGuide = readFileSync(
            path.join(process.cwd(), docusaurusDevelopmentSetupDocPath),
            "utf8"
        );

        expect(
            getFileExistence(["docusaurus/CHECKLIST.md", "docusaurus/SETUP.md"])
        ).toStrictEqual({
            "docusaurus/CHECKLIST.md": false,
            "docusaurus/SETUP.md": false,
        });
        expect(docusaurusReadme).toContain("docs/development/setup.md");
        expect(docusaurusReadme).toContain("docs/development/build-release.md");
        expect(docusaurusReadme).toContain("root `typedoc.json`");
        expect(docusaurusReadme).toContain(
            "`electron-app/**/*.{ts,mts,cts,tsx,js,jsx}`"
        );
        expect(docusaurusReadme).not.toContain(
            "All `.js` files in `electron-app/`"
        );
        expect(docusaurusSetupGuide).not.toContain("├── vendor/");
    });

    it("keeps Electron app tooling configuration centralized at the repository root", () => {
        expect.assertions(2);

        const rootToolingConfigs = [
            rootPackageLockPath,
            ...rootToolingConfigPaths,
        ];
        const appLocalToolingConfigs = [
            ...localPackageManagerManifestNames,
            ...localToolingConfigNames,
            ".pre-commit-config.yaml",
            "codecov.yml",
            "cspell.json",
            "electron-builder.config.cjs",
            "flatpak-build.yml",
            "mermaid.config.json",
            "playwright.config.ts",
            "tsconfig.app.base.json",
            "tsconfig.app.eslint.json",
            "tsconfig.app.json",
            "tsconfig.docusaurus.json",
            "tsconfig.eslint.json",
            "tsconfig.runtime.json",
            "tsconfig.vitest-typecheck.json",
            "typedoc.json",
            "vite.renderer.config.mjs",
        ].map((configPath) => appSourceRepositoryPath(configPath));

        expect(getFileExistence(rootToolingConfigs)).toStrictEqual(
            Object.fromEntries(
                rootToolingConfigs.map((configPath) => [configPath, true])
            )
        );
        expect(getFileExistence(appLocalToolingConfigs)).toStrictEqual(
            Object.fromEntries(
                appLocalToolingConfigs.map((configPath) => [configPath, false])
            )
        );
    });

    it("keeps local package config and declaration shims out of Electron runtime source", () => {
        expect.assertions(1);

        const sourceLocalWorkspaceFileNames = new Set([
            ...localPackageManagerManifestNames,
            ...localToolingConfigNames,
        ]);

        expect(
            findMatchingRepositoryFiles(
                "electron-app",
                (_repositoryPath, fileName) =>
                    fileName.endsWith(".d.ts") ||
                    sourceLocalWorkspaceFileNames.has(fileName)
            )
        ).toStrictEqual([]);
    });

    it("keeps Docusaurus lint and format tooling delegated to root scripts", () => {
        expect.assertions(5);

        const docusaurusPackage = readPackageJson(
            docusaurusPackageRepositoryPath
        );
        const lintNotes = readFileSync(
            path.join(process.cwd(), rootLintNotesDocPath),
            "utf8"
        );
        const docusaurusLocalToolingConfigs = localToolingConfigNames.map(
            (configPath) => docusaurusWorkspaceRepositoryPath(configPath)
        );

        expect(getFileExistence(docusaurusLocalToolingConfigs)).toStrictEqual(
            Object.fromEntries(
                docusaurusLocalToolingConfigs.map((configPath) => [
                    configPath,
                    false,
                ])
            )
        );
        expect(docusaurusPackage.scripts ?? {}).toStrictEqual({});
        expect(lintNotes).toContain(
            "Docusaurus remains an npm workspace for its dependency graph only"
        );
        expect(lintNotes).toMatch(
            /Do not add\s+Docusaurus-local ESLint, Prettier, Stylelint, Remark, Secretlint,\s+Markdownlint, or dependency-update config files/u
        );
        expect(lintNotes).toMatch(
            /`npm run docs:\*`\s+and `npm run lint:docusaurus\*`/u
        );
    });

    it("keeps root tooling ignores free of stale nested generated app paths", () => {
        expect.assertions(2);

        const rootToolingIgnoreFiles = [
            rootGitignorePath,
            rootPrettierIgnorePath,
            rootAppTsconfigPath,
            rootStylelintConfigPath,
        ];

        expect(getFileExistence(rootToolingIgnoreFiles)).toStrictEqual(
            Object.fromEntries(
                rootToolingIgnoreFiles.map((filePath) => [filePath, true])
            )
        );

        const staleReferences = rootToolingIgnoreFiles.flatMap((filePath) => {
            const content = readFileSync(
                path.join(process.cwd(), filePath),
                "utf8"
            );

            return staleNestedGeneratedAppPaths
                .filter((stalePath) => content.includes(stalePath))
                .map((stalePath) => `${filePath}: ${stalePath}`);
        });

        expect(staleReferences).toStrictEqual([]);
    });

    it("keeps generated declaration ignores pointed at the root output path", () => {
        expect.assertions(4);

        const prettierIgnore = readFileSync(
            path.join(process.cwd(), rootPrettierIgnorePath),
            "utf8"
        );
        const gitignore = readFileSync(
            path.join(process.cwd(), rootGitignorePath),
            "utf8"
        );
        const rootTypesIgnorePath = `${rootTypesPath.replaceAll(path.sep, "/")}/`;

        expect(prettierIgnore).toContain(rootTypesIgnorePath);
        expect(gitignore).toContain(rootTypesIgnorePath);
        expect(prettierIgnore).not.toContain("electron-app/types/");
        expect(gitignore).not.toContain("electron-app/types/");
    });

    it("keeps the root Playwright smoke config strict", () => {
        expect.assertions(3);

        const playwrightConfig = readFileSync(
            path.join(process.cwd(), rootPlaywrightConfigPath),
            "utf8"
        );

        expect(playwrightConfig).toContain("forbidOnly: true");
        expect(playwrightConfig).toContain('testDir: "./tests/playwright"');
        expect(playwrightConfig).toContain("workers: 1");
    });

    it("keeps the Electron Playwright smoke launch rooted at the app manifest", () => {
        expect.assertions(7);

        const appUiSpec = readFileSync(
            path.join(process.cwd(), rootPlaywrightAppUiSpecPath),
            "utf8"
        );

        expect(appUiSpec).toContain("function createElectronLaunchProfile()");
        expect(appUiSpec).toContain("args: noNodeEnvProfile.args");
        expect(appUiSpec).toContain("args: electronProfile.args");
        expect(appUiSpec).toContain(
            'repositoryRoot,\n            "--disable-http-cache",\n            `--user-data-dir=${userDataDir}`,'
        );
        expect(appUiSpec).toContain("cwd: repositoryRoot");
        expect(appUiSpec).not.toContain(
            'path.join(repositoryRoot, "electron-app")'
        );
        expect(appUiSpec).not.toContain("args: [appRoot");
    });
});
