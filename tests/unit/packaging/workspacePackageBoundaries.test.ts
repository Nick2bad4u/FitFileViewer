import { existsSync, readFileSync } from "node:fs";
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
    rootDocsPath,
    rootNcuConfigPath,
    rootPackageLockPath,
    rootPackageRepositoryPath,
    rootPlaywrightAppUiSpecPath,
    rootPlaywrightConfigPath,
    rootPrettierIgnorePath,
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

const rootManagedReleaseVersioningPaths = [
    ".github/workflows/Build.yml",
    "package.json",
    "scripts/bump-app-version.mjs",
    rootDevelopmentGuideDocPath,
    docusaurusDevelopmentBuildReleaseDocPath,
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
    "eslint.config.mjs",
    "prettier.config.mjs",
    "stylelint.config.mjs",
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
    lint: "npm run lint:secretlint && npm run lint:root && npm run lint:app && npm run lint:docusaurus && npm run lint:remark",
    "lint:app":
        "node scripts/run-eslint.mjs app && node scripts/run-typescript.mjs typecheck",
    "lint:app:fix":
        "node scripts/run-eslint.mjs app --fix && node scripts/run-typescript.mjs typecheck",
    "lint:remark": "node scripts/lint-remark.mjs",
    "lint:secretlint": "node scripts/lint-secretlint.mjs",
    "test:ui": "node scripts/run-vitest.mjs --ui",
    "update-deps": "node scripts/update-deps.mjs",
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

describe("workspace package boundaries", () => {
    it("keeps shared tooling and local Vitest UI support in the root workspace", () => {
        expect.assertions(10);

        const rootPackage = readPackageJson("package.json");
        const directDisallowedDevDependencies = Object.keys(
            rootPackage.devDependencies ?? {}
        ).filter((dependencyName) =>
            disallowedRootDevDependencyNamePatterns.some((pattern) =>
                pattern.test(dependencyName)
            )
        );

        expect(rootPackage.workspaces).toStrictEqual(["docusaurus"]);
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
        expect.assertions(2);

        const rootPackage = readPackageJson(rootPackageRepositoryPath);
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
        expect(releaseVersioningFilesWithWorkspaceFlags).toStrictEqual([]);
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

    it("keeps the root app package as the runtime app manifest", () => {
        expect.assertions(13);

        const appPackage = readPackageJson(rootPackageRepositoryPath);

        expect({ private: appPackage.private }).toStrictEqual({
            private: true,
        });
        expect(appPackage).not.toHaveProperty("publishConfig");
        expect(appPackage.scripts).toHaveProperty("build:runtime-ts");
        expect(appPackage.devDependencies).toHaveProperty("vitest");
        expect(Object.keys(appPackage.dependencies ?? {}).sort()).toStrictEqual(
            [
                "@garmin/fitsdk",
                "electron-conf",
                "electron-log",
                "electron-updater",
                "zod",
            ]
        );
        expect(appPackage.files).toStrictEqual([
            "dist/",
            "electron-app/global.d.ts",
            "package.json",
        ]);
        expect(
            getRequiredPackageEntries(appPackage.exports, "exports")[
                "./index.html"
            ]
        ).toBe("./dist/index.html");
        expect(appPackage.main).toBe("dist/main.js");
        expect(appPackage.types).toBe("electron-app/global.d.ts");
        expect(appPackage.icon).toBe("dist/icons/favicon.ico");
        expect(appPackage.files).not.toContain("vendor/");
        expect(appPackage.files).not.toContain("node_modules/");
        expect(
            getFileExistence([
                "electron-app/bun.lock",
                "electron-app/bun.lockb",
                "electron-app/npm-shrinkwrap.json",
                "electron-app/package-lock.json",
                "electron-app/package.json",
                "electron-app/pnpm-lock.yaml",
                "electron-app/yarn.lock",
            ])
        ).toStrictEqual({
            "electron-app/bun.lock": false,
            "electron-app/bun.lockb": false,
            "electron-app/npm-shrinkwrap.json": false,
            "electron-app/package-lock.json": false,
            "electron-app/package.json": false,
            "electron-app/pnpm-lock.yaml": false,
            "electron-app/yarn.lock": false,
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
        expect.assertions(3);

        const ncuConfig = JSON.parse(
            readFileSync(path.join(process.cwd(), rootNcuConfigPath), "utf8")
        ) as Record<string, unknown>;

        expect(ncuConfig).toStrictEqual({
            $schema:
                "https://raw.githubusercontent.com/raineorshine/npm-check-updates/main/src/types/RunOptions.json",
            cache: true,
            cacheFile: ".cache/.ncu-cache.json",
            concurrency: 8,
            dep: [
                "prod",
                "dev",
                "optional",
                "peer",
                "packageManager",
            ],
            deprecated: true,
            format: [
                "dep",
                "time",
                "homepage",
                "ownerChanged",
            ],
            install: "never",
            interactive: true,
            packageFile: "./package.json",
            packageManager: "npm",
            root: true,
            target: "latest",
            workspaces: true,
        });
        expect(path.posix.normalize(String(ncuConfig["packageFile"]))).toBe(
            "package.json"
        );
        expect(
            [ncuConfig["cacheFile"], ncuConfig["packageFile"]].filter(
                (configPath) => String(configPath).startsWith("electron-app/")
            )
        ).toStrictEqual([]);
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
            ...localToolingConfigNames,
            ".pre-commit-config.yaml",
            "cliff.toml",
            "cspell.json",
            "electron-builder.config.cjs",
            "mermaid.config.json",
            rootPackageLockPath,
            "package.json",
            "playwright.config.ts",
            "tsconfig.json",
            "tsconfig.app.base.json",
            "tsconfig.app.eslint.json",
            "tsconfig.app.json",
            "tsconfig.docusaurus.json",
            "tsconfig.eslint.json",
            "tsconfig.runtime.json",
            "tsconfig.vitest-typecheck.json",
            "typedoc.json",
            "vite.renderer.config.mjs",
            "vitest.config.js",
            "vitest.config.ts",
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

    it("keeps Docusaurus lint and format tooling delegated to root wrappers", () => {
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
            /`npm run docs:\*` and\s+`npm run lint:docusaurus\*`/u
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
        expect.assertions(4);

        const appUiSpec = readFileSync(
            path.join(process.cwd(), rootPlaywrightAppUiSpecPath),
            "utf8"
        );

        expect(appUiSpec).toContain(
            'args: [repositoryRoot, "--disable-http-cache"]'
        );
        expect(appUiSpec).toContain("cwd: repositoryRoot");
        expect(appUiSpec).not.toContain(
            'path.join(repositoryRoot, "electron-app")'
        );
        expect(appUiSpec).not.toContain("args: [appRoot");
    });
});
