import path from "node:path";

import { describe, expect, it } from "vitest";

type WorkspacesModule = {
    adHocEslintCachePath: string;
    appAlternativeFitViewPath: string;
    appElevProfileCssPath: string;
    appEslintCachePath: string;
    appIconsPath: string;
    appIndexHtmlPath: string;
    appLeafletMeasureLitePath: string;
    appMainBundleAbsolutePath: string;
    appMainSourceAbsolutePath: string;
    appPreloadBundleAbsolutePath: string;
    appPreloadSourceAbsolutePath: string;
    appRendererVendorChartDataEntryPath: string;
    appRendererVendorCoreEntryPath: string;
    appRendererVendorMapEntryPath: string;
    appStyleCssPath: string;
    appSourceAbsolutePath: (...segments: string[]) => string;
    appSourceDirectoryName: string;
    appSourcePath: string;
    appSourceRepositoryPath: (...segments: string[]) => string;
    appSourceRelativePath: (...segments: string[]) => string;
    applyElectronFusesScriptPath: string;
    buildRuntimeScriptPath: string;
    bundleMainScriptPath: string;
    bundlePreloadScriptPath: string;
    cleanRuntimeDistScriptPath: string;
    docusaurusAdvancedFitParserMigrationDocPath: string;
    docusaurusAdvancedPerformanceDocPath: string;
    docusaurusArchitectureModuleSystemDocPath: string;
    docusaurusApiCoreApisDocPath: string;
    docusaurusApiDocsPath: string;
    docusaurusApiDocsAbsolutePath: string;
    docusaurusApiIpcCommunicationDocPath: string;
    docusaurusApiStateManagementDocPath: string;
    docusaurusApiUtilityApisDocPath: string;
    docusaurusArchitectureProcessModelDocPath: string;
    docusaurusArchitectureSecurityDocPath: string;
    docusaurusBuildPath: string;
    docusaurusCachePath: string;
    docusaurusArchitectureOverviewDocPath: string;
    docusaurusConfigRepositoryPath: string;
    docusaurusDevelopmentBuildReleaseDocPath: string;
    docusaurusDevelopmentSetupDocPath: string;
    docusaurusEslintCachePath: string;
    docusaurusHomePagePath: string;
    docusaurusPackagePath: string;
    docusaurusPackageRepositoryPath: string;
    docusaurusReadmeRepositoryPath: string;
    docusaurusSidebarsRepositoryPath: string;
    docusaurusStaticFaviconPath: string;
    docusaurusStaticImageCoverageJsonPath: string;
    docusaurusStaticImageCoverageSvgPath: string;
    docusaurusStaticImageFaviconPath: string;
    docusaurusStaticPath: string;
    docusaurusStaticScreenshotsPath: string;
    docusaurusTsconfigRepositoryPath: string;
    docusaurusWorkspaceAbsolutePath: (...segments: string[]) => string;
    docusaurusWorkspaceName: string;
    docusaurusWorkspacePath: string;
    docusaurusWorkspaceRepositoryPath: (...segments: string[]) => string;
    docusaurusWorkspaceRelativePath: (...segments: string[]) => string;
    formatRuntimeOutputScriptPath: string;
    generateApiCategoriesScriptPath: string;
    prepareRuntimeDistScriptPath: string;
    repositoryPrettierTargets: string[];
    repositoryRoot: string;
    repositoryPath: (...segments: string[]) => string;
    repositoryScriptPath: (...segments: string[]) => string;
    rendererVendorChartDataBundleName: string;
    rendererVendorChartDataScriptFileName: string;
    rendererVendorBundleName: string;
    rendererVendorCoreBundleName: string;
    rendererVendorCoreScriptFileName: string;
    rendererVendorMapBundleName: string;
    rendererVendorMapScriptFileName: string;
    rendererVendorStyleFileName: string;
    rootAgentsPath: string;
    rootChangelogPath: string;
    rootCliffConfigPath: string;
    rootCodecovConfigPath: string;
    rootCspellConfigPath: string;
    rootAppBaseTsconfigPath: string;
    rootAppEslintTsconfigPath: string;
    rootAlternativeFitViewPath: string;
    rootAlternativeFitViewAssetsPath: string;
    rootAlternativeFitViewIndexPath: string;
    rootAlternativeFitViewManifestPath: string;
    rootAppCssGlobPath: string;
    rootApiDocumentationDocPath: string;
    rootAppElevProfileCssPath: string;
    rootAppFaviconPath: string;
    rootAppIconsPath: string;
    rootAppIconsSiteWebManifestPath: string;
    rootAppIndexHtmlPath: string;
    rootAppStaticPath: string;
    rootAppStyleCssPath: string;
    rootElectronBuilderConfigPath: string;
    rootArtifactsPath: string;
    rootCoverageAbsolutePath: string;
    rootCoveragePath: string;
    rootDocusaurusTsconfigPath: string;
    rootApplicationArchitectureDocPath: string;
    rootApplicationLayoutDocPath: string;
    rootApplicationOverviewDocPath: string;
    rootCachePath: string;
    rootDevelopmentGuideDocPath: string;
    rootDocsPath: string;
    rootDocsScreenshotNames: string[];
    rootDocsScreenshotsPath: string;
    rootFitParserMigrationGuideDocPath: string;
    rootGyazoSetupDocPath: string;
    rootLintNotesDocPath: string;
    rootAppTsconfigPath: string;
    rootEslintTsconfigPath: string;
    rootEslintConfigPath: string;
    rootEslintCachePath: string;
    rootFlatpakBuildPath: string;
    rootFlatpakBundlePath: string;
    rootFlatpakManifestPath: string;
    rootFlatpakRepoPath: string;
    rootFlatpakZipPath: string;
    rootGitignorePath: string;
    rootGlobalTypesPath: string;
    rootPackageJsonPath: string;
    rootPackageLockPath: string;
    rootPackagePath: string;
    rootPackageRepositoryPath: string;
    rootReadmePath: string;
    rootPlaywrightConfigPath: string;
    rootPlaywrightAppUiSpecPath: string;
    rootPlaywrightTestsPath: string;
    rootIntegrationTestsPath: string;
    rootMarkdownLinkCheckConfigPath: string;
    rootMarkdownlintConfigPath: string;
    rootMermaidConfigPath: string;
    rootNcuConfigPath: string;
    rootPrettierConfigPath: string;
    rootPrettierCachePath: string;
    rootPrettierIgnorePath: string;
    rootPreCommitConfigPath: string;
    rootRemarkConfigPath: string;
    rootReleaseDistPath: string;
    rootReleaseDistAbsolutePath: string;
    rootReleaseDistRelativePath: (...segments: string[]) => string;
    rootRendererStyleImportsTypesPath: string;
    rootRuntimeDistAbsolutePath: string;
    rootRuntimeDistPath: string;
    rootRuntimeRendererRepositoryPath: string;
    rootRuntimeTsconfigAbsolutePath: string;
    rootRuntimeTsconfigPath: string;
    rootSecretlintConfigPath: string;
    rootStaticAssetsPath: string;
    rootStylelintConfigPath: string;
    rootTypesAbsolutePath: string;
    rootTypesPath: string;
    rootTabsTestsPath: string;
    rootTypedocConfigPath: string;
    rootToolingConfigPaths: string[];
    rootUnitTestsPath: string;
    rootViteRendererConfigPath: string;
    rootVitestCachePath: string;
    rootVitestConfigPath: string;
    rootVitestGlobalSetupPath: string;
    rootVitestPreloadDistHelperPath: string;
    rootVitestSetupFilePath: string;
    rootVitestSupportPath: string;
    rootVitestTypecheckTsconfigPath: string;
    ensureElectronBinaryScriptPath: string;
    runDocusaurusScriptPath: string;
    runElectronBuilderScriptPath: string;
    runElectronScriptPath: string;
    scriptsPath: string;
    syncDocusaurusStaticAssetsScriptPath: string;
    validateRuntimeTsconfigScriptPath: string;
};

async function importWorkspaces(): Promise<WorkspacesModule> {
    return (await import("../../../scripts/lib/workspaces.mjs")) as WorkspacesModule;
}

describe("workspace path helpers", () => {
    it("centralizes the app source root paths", async () => {
        expect.assertions(11);

        const workspaces = await importWorkspaces();

        expect(workspaces.repositoryRoot).toBe(process.cwd());
        expect(workspaces.repositoryRoot).not.toBe(
            path.join(process.cwd(), "electron-app")
        );
        expect(workspaces.appSourceDirectoryName).toBe("electron-app");
        expect(workspaces.appSourcePath).toBe(
            path.join(process.cwd(), "electron-app")
        );
        expect(workspaces.docusaurusWorkspaceName).toBe("docusaurus");
        expect(workspaces.docusaurusWorkspacePath).toBe(
            path.join(process.cwd(), "docusaurus")
        );
        expect(workspaces.rootPackagePath).toBe(
            path.join(process.cwd(), "package.json")
        );
        expect(workspaces.rootPackageRepositoryPath).toBe("package.json");
        expect(workspaces.appSourceRepositoryPath("main.ts")).toBe(
            "electron-app/main.ts"
        );
        expect(workspaces.appSourceAbsolutePath("dist")).toBe(
            path.join(process.cwd(), "electron-app", "dist")
        );
        expect(
            workspaces.repositoryPath(workspaces.rootFlatpakManifestPath)
        ).toBe(path.join(process.cwd(), workspaces.rootFlatpakManifestPath));
    });

    it("centralizes root script paths", async () => {
        expect.assertions(16);

        const workspaces = await importWorkspaces();

        expect(workspaces.scriptsPath).toBe(
            path.join(process.cwd(), "scripts")
        );
        expect(workspaces.repositoryScriptPath("build-runtime.mjs")).toBe(
            path.join(process.cwd(), "scripts", "build-runtime.mjs")
        );
        expect(workspaces.buildRuntimeScriptPath).toBe(
            path.join(process.cwd(), "scripts", "build-runtime.mjs")
        );
        expect(workspaces.cleanRuntimeDistScriptPath).toBe(
            path.join(process.cwd(), "scripts", "clean-runtime-dist.mjs")
        );
        expect(workspaces.validateRuntimeTsconfigScriptPath).toBe(
            path.join(process.cwd(), "scripts", "validate-runtime-tsconfig.mjs")
        );
        expect(workspaces.bundleMainScriptPath).toBe(
            path.join(process.cwd(), "scripts", "bundle-main.mjs")
        );
        expect(workspaces.bundlePreloadScriptPath).toBe(
            path.join(process.cwd(), "scripts", "bundle-preload.mjs")
        );
        expect(workspaces.applyElectronFusesScriptPath).toBe(
            path.join(process.cwd(), "scripts", "apply-electron-fuses.mjs")
        );
        expect(workspaces.formatRuntimeOutputScriptPath).toBe(
            path.join(process.cwd(), "scripts", "format-runtime-output.mjs")
        );
        expect(workspaces.prepareRuntimeDistScriptPath).toBe(
            path.join(process.cwd(), "scripts", "prepare-runtime-dist.mjs")
        );
        expect(workspaces.generateApiCategoriesScriptPath).toBe(
            path.join(process.cwd(), "scripts", "generate-api-categories.mjs")
        );
        expect(workspaces.ensureElectronBinaryScriptPath).toBe(
            path.join(process.cwd(), "scripts", "ensure-electron-binary.mjs")
        );
        expect(workspaces.runDocusaurusScriptPath).toBe(
            path.join(process.cwd(), "scripts", "run-docusaurus.mjs")
        );
        expect(workspaces.runElectronBuilderScriptPath).toBe(
            path.join(process.cwd(), "scripts", "run-electron-builder.mjs")
        );
        expect(workspaces.runElectronScriptPath).toBe(
            path.join(process.cwd(), "scripts", "run-electron.mjs")
        );
        expect(workspaces.syncDocusaurusStaticAssetsScriptPath).toBe(
            path.join(
                process.cwd(),
                "scripts",
                "sync-docusaurus-static-assets.mjs"
            )
        );
    });

    it("centralizes app runtime asset paths", async () => {
        expect.assertions(20);

        const workspaces = await importWorkspaces();

        expect(workspaces.appAlternativeFitViewPath).toBe("ffv");
        expect(workspaces.appElevProfileCssPath).toBe("elevProfile.css");
        expect(workspaces.appIconsPath).toBe("icons");
        expect(workspaces.appIndexHtmlPath).toBe("index.html");
        expect(workspaces.appLeafletMeasureLitePath).toBe(
            "electron-app/renderer/leafletMeasureLite.js"
        );
        expect({
            bundle: workspaces.appMainBundleAbsolutePath,
            source: workspaces.appMainSourceAbsolutePath,
        }).toStrictEqual({
            bundle: path.join(process.cwd(), "dist", "main.js"),
            source: path.join(process.cwd(), "electron-app", "main.ts"),
        });
        expect({
            bundle: workspaces.appPreloadBundleAbsolutePath,
            source: workspaces.appPreloadSourceAbsolutePath,
        }).toStrictEqual({
            bundle: path.join(process.cwd(), "dist", "preload.js"),
            source: path.join(process.cwd(), "electron-app", "preload.ts"),
        });
        expect(workspaces.appRendererVendorChartDataEntryPath).toBe(
            "electron-app/renderer/rendererVendorChartData.ts"
        );
        expect(workspaces.appRendererVendorCoreEntryPath).toBe(
            "electron-app/renderer/rendererVendorCore.ts"
        );
        expect(workspaces.appRendererVendorMapEntryPath).toBe(
            "electron-app/renderer/rendererVendorMap.ts"
        );
        expect(workspaces.rendererVendorBundleName).toBe(
            "renderer-vendor"
        );
        expect(workspaces.rendererVendorChartDataBundleName).toBe(
            "renderer-vendor-chart-data"
        );
        expect(workspaces.rendererVendorChartDataScriptFileName).toBe(
            "renderer-vendor-chart-data.js"
        );
        expect(workspaces.rendererVendorCoreBundleName).toBe(
            "renderer-vendor-core"
        );
        expect(workspaces.rendererVendorCoreScriptFileName).toBe(
            "renderer-vendor-core.js"
        );
        expect(workspaces.rendererVendorMapBundleName).toBe(
            "renderer-vendor-map"
        );
        expect(workspaces.rendererVendorMapScriptFileName).toBe(
            "renderer-vendor-map.js"
        );
        expect(workspaces.rendererVendorStyleFileName).toBe(
            "renderer-vendor.css"
        );
        expect({
            alternativeViewerAssets:
                workspaces.rootAlternativeFitViewAssetsPath,
            alternativeViewerIndex: workspaces.rootAlternativeFitViewIndexPath,
            alternativeViewerManifest:
                workspaces.rootAlternativeFitViewManifestPath,
            alternativeViewer: workspaces.rootAlternativeFitViewPath,
            appCssGlob: workspaces.rootAppCssGlobPath,
            appElevProfileCss: workspaces.rootAppElevProfileCssPath,
            appFavicon: workspaces.rootAppFaviconPath,
            appIcons: workspaces.rootAppIconsPath,
            appIconsSiteWebManifest: workspaces.rootAppIconsSiteWebManifestPath,
            appIndexHtml: workspaces.rootAppIndexHtmlPath,
            appStatic: workspaces.rootAppStaticPath,
            appStyleCss: workspaces.rootAppStyleCssPath,
            staticAssets: workspaces.rootStaticAssetsPath,
        }).toStrictEqual({
            alternativeViewerAssets: "static/ffv/assets",
            alternativeViewerIndex: "static/ffv/index.html",
            alternativeViewerManifest: "static/ffv/manifest.json",
            alternativeViewer: "static/ffv",
            appCssGlob: "static/app/*.css",
            appElevProfileCss: "static/app/elevProfile.css",
            appFavicon: "static/icons/favicon.ico",
            appIcons: "static/icons",
            appIconsSiteWebManifest: "static/icons/site.webmanifest",
            appIndexHtml: "static/app/index.html",
            appStatic: "static/app",
            appStyleCss: "static/app/style.css",
            staticAssets: "static",
        });
        expect(workspaces.appStyleCssPath).toBe("style.css");
    });

    it("centralizes root config paths", async () => {
        expect.assertions(16);

        const workspaces = await importWorkspaces();

        expect({
            gitignore: workspaces.rootGitignorePath,
            packageJson: workspaces.rootPackageJsonPath,
            packageLock: workspaces.rootPackageLockPath,
            prettier: workspaces.rootPrettierConfigPath,
            prettierIgnore: workspaces.rootPrettierIgnorePath,
        }).toStrictEqual({
            gitignore: ".gitignore",
            packageJson: "package.json",
            packageLock: "package-lock.json",
            prettier: "prettier.config.mjs",
            prettierIgnore: ".prettierignore",
        });
        expect(workspaces.rootElectronBuilderConfigPath).toBe(
            "electron-builder.config.cjs"
        );
        expect(workspaces.rootAppBaseTsconfigPath).toBe(
            "tsconfig.app.base.json"
        );
        expect(workspaces.rootAppEslintTsconfigPath).toBe(
            "tsconfig.app.eslint.json"
        );
        expect(workspaces.rootAppTsconfigPath).toBe("tsconfig.app.json");
        expect(workspaces.rootEslintTsconfigPath).toBe("tsconfig.eslint.json");
        expect(workspaces.rootEslintConfigPath).toBe("eslint.config.mjs");
        expect(workspaces.rootFlatpakManifestPath).toBe("flatpak-build.yml");
        expect(workspaces.rootPlaywrightConfigPath).toBe(
            "playwright.config.ts"
        );
        expect(workspaces.rootRuntimeTsconfigPath).toBe(
            "tsconfig.runtime.json"
        );
        expect(workspaces.rootRuntimeTsconfigAbsolutePath).toBe(
            path.join(process.cwd(), "tsconfig.runtime.json")
        );
        expect(workspaces.rootStylelintConfigPath).toBe("stylelint.config.mjs");
        expect(workspaces.rootTypedocConfigPath).toBe("typedoc.json");
        expect(workspaces.rootViteRendererConfigPath).toBe(
            "vite.renderer.config.mjs"
        );
        expect(workspaces.rootVitestConfigPath).toBe("vitest.config.ts");
        expect(workspaces.rootVitestTypecheckTsconfigPath).toBe(
            "tsconfig.vitest-typecheck.json"
        );
    });

    it("centralizes root cache paths", async () => {
        expect.assertions(4);

        const workspaces = await importWorkspaces();

        expect(workspaces.rootCachePath).toBe(".cache");
        expect(workspaces.rootPrettierCachePath).toBe(".cache/.prettier-cache");
        expect(workspaces.rootVitestCachePath).toBe(".cache/vitest");
        expect({
            adHoc: workspaces.adHocEslintCachePath,
            app: workspaces.appEslintCachePath,
            docusaurus: workspaces.docusaurusEslintCachePath,
            root: workspaces.rootEslintCachePath,
        }).toStrictEqual({
            adHoc: ".cache/.eslintcache-ad-hoc",
            app: ".cache/.eslintcache-app",
            docusaurus: ".cache/.eslintcache-docusaurus",
            root: ".cache/.eslintcache-root",
        });
    });

    it("centralizes root tooling metadata paths", async () => {
        expect.assertions(12);

        const workspaces = await importWorkspaces();

        expect(workspaces.rootChangelogPath).toBe("CHANGELOG.md");
        expect(workspaces.rootCliffConfigPath).toBe("cliff.toml");
        expect(workspaces.rootCodecovConfigPath).toBe("codecov.yml");
        expect(workspaces.rootCspellConfigPath).toBe("cspell.json");
        expect(workspaces.rootMarkdownLinkCheckConfigPath).toBe(
            ".markdown-link-check.json"
        );
        expect(workspaces.rootMarkdownlintConfigPath).toBe(
            ".markdownlint.json"
        );
        expect(workspaces.rootMermaidConfigPath).toBe("mermaid.config.json");
        expect(workspaces.rootNcuConfigPath).toBe(".ncurc.json");
        expect(workspaces.rootPreCommitConfigPath).toBe(
            ".pre-commit-config.yaml"
        );
        expect(workspaces.rootRemarkConfigPath).toBe(".remarkrc.mjs");
        expect(workspaces.rootSecretlintConfigPath).toBe(".secretlintrc.cjs");
        expect(workspaces.rootToolingConfigPaths).toStrictEqual([
            "typedoc.json",
            ".markdown-link-check.json",
            ".markdownlint.json",
            ".ncurc.json",
            ".pre-commit-config.yaml",
            ".secretlintrc.cjs",
            "cliff.toml",
            "codecov.yml",
            "cspell.json",
            "electron-builder.config.cjs",
            "flatpak-build.yml",
            "mermaid.config.json",
            "prettier.config.mjs",
            "stylelint.config.mjs",
            ".remarkrc.mjs",
            "eslint.config.mjs",
            "playwright.config.ts",
            "vite.renderer.config.mjs",
            "vitest.config.ts",
            "tsconfig.eslint.json",
            "tsconfig.app.base.json",
            "tsconfig.app.json",
            "tsconfig.runtime.json",
            "tsconfig.docusaurus.json",
            "tsconfig.vitest-typecheck.json",
            "tsconfig.app.eslint.json",
        ]);
    });

    it("centralizes repository prettier targets", async () => {
        expect.assertions(2);

        const workspaces = await importWorkspaces();
        const appLocalPackageOrConfigTargets = [
            workspaces.rootPackageJsonPath,
            workspaces.rootPackageLockPath,
            ...workspaces.rootToolingConfigPaths,
        ].map((configPath) => workspaces.appSourceRepositoryPath(configPath));

        expect(workspaces.repositoryPrettierTargets).toStrictEqual([
            "package.json",
            "docusaurus/package.json",
            "docusaurus/docusaurus.config.ts",
            "docusaurus/sidebars.ts",
            "docusaurus/tsconfig.json",
            ...workspaces.rootToolingConfigPaths,
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
            "electron-app/renderer/leafletMeasureLite.js",
        ]);
        expect(
            appLocalPackageOrConfigTargets.filter((target) =>
                workspaces.repositoryPrettierTargets.includes(target)
            )
        ).toStrictEqual([]);
    });

    it("centralizes root and Docusaurus docs paths", async () => {
        expect.assertions(1);

        const workspaces = await importWorkspaces();

        expect({
            docusaurusAdvancedFitParserMigration:
                workspaces.docusaurusAdvancedFitParserMigrationDocPath,
            docusaurusAdvancedPerformance:
                workspaces.docusaurusAdvancedPerformanceDocPath,
            docusaurusApiCoreApis: workspaces.docusaurusApiCoreApisDocPath,
            docusaurusApiIpcCommunication:
                workspaces.docusaurusApiIpcCommunicationDocPath,
            docusaurusApiStateManagement:
                workspaces.docusaurusApiStateManagementDocPath,
            docusaurusApiUtilityApis:
                workspaces.docusaurusApiUtilityApisDocPath,
            docusaurusArchitectureOverview:
                workspaces.docusaurusArchitectureOverviewDocPath,
            docusaurusArchitectureModuleSystem:
                workspaces.docusaurusArchitectureModuleSystemDocPath,
            docusaurusArchitectureProcessModel:
                workspaces.docusaurusArchitectureProcessModelDocPath,
            docusaurusArchitectureSecurity:
                workspaces.docusaurusArchitectureSecurityDocPath,
            docusaurusBuildRelease:
                workspaces.docusaurusDevelopmentBuildReleaseDocPath,
            docusaurusDevelopmentSetup:
                workspaces.docusaurusDevelopmentSetupDocPath,
            docusaurusHomePage: workspaces.docusaurusHomePagePath,
            docusaurusReadme: workspaces.docusaurusReadmeRepositoryPath,
            rootApplicationArchitecture:
                workspaces.rootApplicationArchitectureDocPath,
            rootApiDocumentation: workspaces.rootApiDocumentationDocPath,
            rootApplicationLayout: workspaces.rootApplicationLayoutDocPath,
            rootApplicationOverview: workspaces.rootApplicationOverviewDocPath,
            rootAgents: workspaces.rootAgentsPath,
            rootDevelopmentGuide: workspaces.rootDevelopmentGuideDocPath,
            rootDocs: workspaces.rootDocsPath,
            rootDocsScreenshotNames: workspaces.rootDocsScreenshotNames,
            rootDocsScreenshots: workspaces.rootDocsScreenshotsPath,
            rootFitParserMigrationGuide:
                workspaces.rootFitParserMigrationGuideDocPath,
            rootGyazoSetup: workspaces.rootGyazoSetupDocPath,
            rootLintNotes: workspaces.rootLintNotesDocPath,
            rootReadme: workspaces.rootReadmePath,
        }).toStrictEqual({
            docusaurusAdvancedFitParserMigration:
                "docusaurus/docs/advanced/fit-parser-migration.md",
            docusaurusAdvancedPerformance:
                "docusaurus/docs/advanced/performance.md",
            docusaurusApiCoreApis: "docusaurus/docs/api-reference/core-apis.md",
            docusaurusApiIpcCommunication:
                "docusaurus/docs/api-reference/ipc-communication.md",
            docusaurusApiStateManagement:
                "docusaurus/docs/api-reference/state-management.md",
            docusaurusApiUtilityApis:
                "docusaurus/docs/api-reference/utility-apis.md",
            docusaurusArchitectureOverview:
                "docusaurus/docs/architecture/overview.md",
            docusaurusArchitectureModuleSystem:
                "docusaurus/docs/architecture/module-system.md",
            docusaurusArchitectureProcessModel:
                "docusaurus/docs/architecture/process-model.md",
            docusaurusArchitectureSecurity:
                "docusaurus/docs/architecture/security.md",
            docusaurusBuildRelease:
                "docusaurus/docs/development/build-release.md",
            docusaurusDevelopmentSetup: "docusaurus/docs/development/setup.md",
            docusaurusHomePage: "docusaurus/src/pages/index.tsx",
            docusaurusReadme: "docusaurus/README.md",
            rootApplicationArchitecture: "docs/APPLICATION_ARCHITECTURE.md",
            rootApiDocumentation: "docs/API_DOCUMENTATION.md",
            rootApplicationLayout: "docs/APPLICATION_LAYOUT.md",
            rootApplicationOverview: "docs/APPLICATION_OVERVIEW.md",
            rootAgents: "AGENTS.md",
            rootDevelopmentGuide: "docs/DEVELOPMENT_GUIDE.md",
            rootDocs: "docs",
            rootDocsScreenshotNames: [
                "MapsV2.png",
                "DataV2.png",
                "ChartsV3.png",
            ],
            rootDocsScreenshots: "docs/screenshots",
            rootFitParserMigrationGuide: "docs/FIT_PARSER_MIGRATION_GUIDE.md",
            rootGyazoSetup: "docs/GYAZO_SETUP.md",
            rootLintNotes: "docs/lint-notes.md",
            rootReadme: "README.md",
        });
    });

    it("centralizes root generated output and test paths", async () => {
        expect.assertions(2);

        const workspaces = await importWorkspaces();

        expect({
            artifacts: workspaces.rootArtifactsPath,
            coverage: workspaces.rootCoveragePath,
            coverageAbsolute: workspaces.rootCoverageAbsolutePath,
            flatpakBuild: workspaces.rootFlatpakBuildPath,
            flatpakBundle: workspaces.rootFlatpakBundlePath,
            flatpakRepo: workspaces.rootFlatpakRepoPath,
            flatpakZip: workspaces.rootFlatpakZipPath,
            globalTypes: workspaces.rootGlobalTypesPath,
            integrationTests: workspaces.rootIntegrationTestsPath,
            playwrightAppUiSpec: workspaces.rootPlaywrightAppUiSpecPath,
            playwrightTests: workspaces.rootPlaywrightTestsPath,
            releaseDist: workspaces.rootReleaseDistPath,
            releaseDistAbsolute: workspaces.rootReleaseDistAbsolutePath,
            rendererStyleImportsTypes:
                workspaces.rootRendererStyleImportsTypesPath,
            rootRuntimeDist: workspaces.rootRuntimeDistPath,
            rootRuntimeDistAbsolute: workspaces.rootRuntimeDistAbsolutePath,
            rootRuntimeRenderer: workspaces.rootRuntimeRendererRepositoryPath,
            rootTypes: workspaces.rootTypesPath,
            rootTypesAbsolute: workspaces.rootTypesAbsolutePath,
            tabsTests: workspaces.rootTabsTestsPath,
            unitTests: workspaces.rootUnitTestsPath,
            vitestGlobalSetup: workspaces.rootVitestGlobalSetupPath,
            vitestPreloadDistHelper: workspaces.rootVitestPreloadDistHelperPath,
            vitestSetupFile: workspaces.rootVitestSetupFilePath,
            vitestSupport: workspaces.rootVitestSupportPath,
        }).toStrictEqual({
            artifacts: "artifacts",
            coverage: "coverage",
            coverageAbsolute: path.join(process.cwd(), "coverage"),
            flatpakBuild: "flatpak-build-dir",
            flatpakBundle: "FitFileViewer.flatpak",
            flatpakRepo: "flatpak-repo",
            flatpakZip: "FitFileViewer.flatpak.zip",
            globalTypes: "global.d.ts",
            integrationTests: "tests/integration",
            playwrightAppUiSpec: "tests/playwright/app-ui.spec.ts",
            playwrightTests: "tests/playwright",
            releaseDist: "release-dist",
            releaseDistAbsolute: path.join(process.cwd(), "release-dist"),
            rendererStyleImportsTypes: "renderer-style-imports.d.ts",
            rootRuntimeDist: "dist",
            rootRuntimeDistAbsolute: path.join(process.cwd(), "dist"),
            rootRuntimeRenderer: "dist/renderer",
            rootTypes: "types",
            rootTypesAbsolute: path.join(process.cwd(), "types"),
            tabsTests: "tests/unit/tabs",
            unitTests: "tests/unit",
            vitestGlobalSetup: "tests/vitest/globalSetup.mjs",
            vitestPreloadDistHelper: "tests/vitest/helpers/preloadDist.ts",
            vitestSetupFile: "tests/vitest/setupVitest.mjs",
            vitestSupport: "tests/vitest",
        });
        expect(
            workspaces.rootReleaseDistRelativePath(
                "windows-latest-ia32",
                "squirrel-windows-ia32"
            )
        ).toBe(
            path.join(
                "release-dist",
                "windows-latest-ia32",
                "squirrel-windows-ia32"
            )
        );
    });

    it("centralizes the Docusaurus workspace root and package paths", async () => {
        expect.assertions(20);

        const workspaces = await importWorkspaces();

        expect(workspaces.repositoryRoot).toBe(process.cwd());
        expect(workspaces.docusaurusWorkspaceName).toBe("docusaurus");
        expect(workspaces.docusaurusWorkspacePath).toBe(
            path.join(process.cwd(), "docusaurus")
        );
        expect(workspaces.docusaurusWorkspaceRelativePath("static")).toBe(
            path.join("docusaurus", "static")
        );
        expect(workspaces.docusaurusCachePath).toBe(
            path.join("docusaurus", ".docusaurus")
        );
        expect(workspaces.docusaurusBuildPath).toBe(
            path.join("docusaurus", "build")
        );
        expect(workspaces.docusaurusApiDocsPath).toBe(
            path.join("docusaurus", "docs", "api")
        );
        expect(workspaces.docusaurusApiDocsAbsolutePath).toBe(
            path.join(process.cwd(), "docusaurus", "docs", "api")
        );
        expect(workspaces.docusaurusStaticPath).toBe(
            path.join("docusaurus", "static")
        );
        expect(workspaces.docusaurusStaticFaviconPath).toBe(
            path.join("docusaurus", "static", "favicon.ico")
        );
        expect(workspaces.docusaurusStaticImageFaviconPath).toBe(
            path.join("docusaurus", "static", "img", "favicon.ico")
        );
        expect(workspaces.docusaurusStaticScreenshotsPath).toBe(
            path.join("docusaurus", "static", "img", "screenshots")
        );
        expect(workspaces.docusaurusConfigRepositoryPath).toBe(
            "docusaurus/docusaurus.config.ts"
        );
        expect(workspaces.docusaurusSidebarsRepositoryPath).toBe(
            "docusaurus/sidebars.ts"
        );
        expect(workspaces.docusaurusTsconfigRepositoryPath).toBe(
            "docusaurus/tsconfig.json"
        );
        expect(
            workspaces.docusaurusWorkspaceRepositoryPath("package.json")
        ).toBe("docusaurus/package.json");
        expect(workspaces.docusaurusWorkspaceAbsolutePath("static")).toBe(
            path.join(process.cwd(), "docusaurus", "static")
        );
        expect(workspaces.docusaurusPackagePath).toBe(
            path.join(process.cwd(), "docusaurus", "package.json")
        );
        expect(workspaces.docusaurusPackageRepositoryPath).toBe(
            "docusaurus/package.json"
        );
        expect(workspaces.rootDocusaurusTsconfigPath).toBe(
            "tsconfig.docusaurus.json"
        );
    });

    it("centralizes generated Docusaurus static coverage badge paths", async () => {
        expect.assertions(1);

        const workspaces = await importWorkspaces();

        expect({
            coverageJson: workspaces.docusaurusStaticImageCoverageJsonPath,
            coverageSvg: workspaces.docusaurusStaticImageCoverageSvgPath,
        }).toStrictEqual({
            coverageJson: path.join(
                "docusaurus",
                "static",
                "img",
                "coverage.json"
            ),
            coverageSvg: path.join(
                "docusaurus",
                "static",
                "img",
                "coverage.svg"
            ),
        });
    });
});
