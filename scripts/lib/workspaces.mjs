import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const repositoryRoot = resolveRepositoryRoot();
export const appSourceDirectoryName = "electron-app";
export const docusaurusWorkspaceName = "docusaurus";
export const rootAgentsPath = "AGENTS.md";
export const rootArtifactsPath = "artifacts";
export const rootChangelogPath = "CHANGELOG.md";
export const rootCliffConfigPath = path.posix.join(
    "node_modules",
    "gitcliff-config-nick2bad4u",
    "cliff.toml"
);
export const rootCodecovConfigPath = "codecov.yml";
export const rootCachePath = ".cache";
export const rootCoveragePath = "coverage";
export const rootCoverageAbsolutePath = repositoryPath(rootCoveragePath);
export const rootCspellConfigPath = "cspell.json";
export const rootPackageJsonPath = "package.json";
export const rootPackageLockPath = "package-lock.json";
export const rootPackagePath = repositoryPath(rootPackageJsonPath);
export const rootPackageRepositoryPath = rootPackageJsonPath;
export const rootGlobalTypesPath = "global.d.ts";
export const rootRendererStyleImportsTypesPath = "renderer-style-imports.d.ts";
export const rootReadmePath = "README.md";
export const rootMarkdownLinkCheckConfigPath = ".markdown-link-check.json";
export const rootMarkdownlintConfigPath = ".markdownlint.json";
export const rootMermaidConfigPath = "mermaid.config.json";
export const rootNcuConfigPath = ".ncurc.json";
export const rootPlaywrightConfigPath = "playwright.config.ts";
export const rootPreCommitConfigPath = ".pre-commit-config.yaml";
export const rootPrettierCachePath = path.posix.join(
    rootCachePath,
    ".prettier-cache"
);
export const rootDocusaurusTsconfigPath = "tsconfig.docusaurus.json";
export const rootDocsPath = "docs";
export const rootApplicationArchitectureDocPath = path.posix.join(
    rootDocsPath,
    "APPLICATION_ARCHITECTURE.md"
);
export const rootApplicationLayoutDocPath = path.posix.join(
    rootDocsPath,
    "APPLICATION_LAYOUT.md"
);
export const rootApplicationOverviewDocPath = path.posix.join(
    rootDocsPath,
    "APPLICATION_OVERVIEW.md"
);
export const rootApiDocumentationDocPath = path.posix.join(
    rootDocsPath,
    "API_DOCUMENTATION.md"
);
export const rootDevelopmentGuideDocPath = path.posix.join(
    rootDocsPath,
    "DEVELOPMENT_GUIDE.md"
);
export const rootGyazoSetupDocPath = path.posix.join(
    rootDocsPath,
    "GYAZO_SETUP.md"
);
export const rootLintNotesDocPath = path.posix.join(
    rootDocsPath,
    "lint-notes.md"
);
export const rootFitParserMigrationGuideDocPath = path.posix.join(
    rootDocsPath,
    "FIT_PARSER_MIGRATION_GUIDE.md"
);
export const rootDocsScreenshotsPath = path.posix.join(
    rootDocsPath,
    "screenshots"
);
export const rootDocsScreenshotNames = [
    "MapsV2.png",
    "DataV2.png",
    "ChartsV3.png",
];
export const rootElectronBuilderConfigPath = "electron-builder.config.cjs";
export const rootAppBaseTsconfigPath = "tsconfig.app.base.json";
export const rootAppEslintTsconfigPath = "tsconfig.app.eslint.json";
export const rootAppTsconfigPath = "tsconfig.app.json";
export const rootEslintTsconfigPath = "tsconfig.eslint.json";
export const rootEslintConfigPath = "eslint.config.mjs";
export const rootEslintCachePath = path.posix.join(
    rootCachePath,
    ".eslintcache-root"
);
export const appEslintCachePath = path.posix.join(
    rootCachePath,
    ".eslintcache-app"
);
export const docusaurusEslintCachePath = path.posix.join(
    rootCachePath,
    ".eslintcache-docusaurus"
);
export const adHocEslintCachePath = path.posix.join(
    rootCachePath,
    ".eslintcache-ad-hoc"
);
export const rootFlatpakBuildPath = "flatpak-build-dir";
export const rootFlatpakBundlePath = "FitFileViewer.flatpak";
export const rootFlatpakManifestPath = "flatpak-build.yml";
export const rootFlatpakRepoPath = "flatpak-repo";
export const rootFlatpakZipPath = `${rootFlatpakBundlePath}.zip`;
export const rootGitignorePath = ".gitignore";
export const rootPrettierConfigPath = "prettier.config.mjs";
export const rootPrettierIgnorePath = ".prettierignore";
export const rootRemarkConfigPath = ".remarkrc.mjs";
export const rootReleaseMetadataPath = ".release.yml";
export const rootReleaseDistPath = "release-dist";
export const rootReleaseDistAbsolutePath = repositoryPath(rootReleaseDistPath);
export const rootRuntimeDistPath = "dist";
export const rootRuntimeDistAbsolutePath = repositoryPath(rootRuntimeDistPath);
export const rootRuntimeRendererRepositoryPath = path.posix.join(
    rootRuntimeDistPath,
    "renderer"
);
export const rootTypesPath = "types";
export const rootTypesAbsolutePath = repositoryPath(rootTypesPath);
export const rootRuntimeTsconfigPath = "tsconfig.runtime.json";
export const rootRuntimeTsconfigAbsolutePath = repositoryPath(
    rootRuntimeTsconfigPath
);
export const rootSecretlintConfigPath = ".secretlintrc.cjs";
export const rootStaticAssetsPath = "static";
export const rootStylelintConfigPath = "stylelint.config.mjs";
export const rootIntegrationTestsPath = path.posix.join("tests", "integration");
export const rootPlaywrightTestsPath = path.posix.join("tests", "playwright");
export const rootPlaywrightAppUiSpecPath = path.posix.join(
    rootPlaywrightTestsPath,
    "app-ui.spec.ts"
);
export const rootVitestSupportPath = path.posix.join("tests", "vitest");
export const rootVitestGlobalSetupPath = path.posix.join(
    rootVitestSupportPath,
    "globalSetup.mjs"
);
export const rootVitestSetupFilePath = path.posix.join(
    rootVitestSupportPath,
    "setupVitest.mjs"
);
export const rootVitestPreloadDistHelperPath = path.posix.join(
    rootVitestSupportPath,
    "helpers",
    "preloadDist.ts"
);
export const rootTypedocConfigPath = "typedoc.json";
export const rootUnitTestsPath = path.posix.join("tests", "unit");
export const rootTabsTestsPath = path.posix.join(rootUnitTestsPath, "tabs");
export const rootViteRendererConfigPath = "vite.renderer.config.mjs";
export const rootVitestCachePath = path.posix.join(rootCachePath, "vitest");
export const rootVitestConfigPath = "vitest.config.ts";
export const rootVitestTypecheckTsconfigPath = "tsconfig.vitest-typecheck.json";
export const rootToolingConfigPaths = [
    rootTypedocConfigPath,
    rootMarkdownLinkCheckConfigPath,
    rootMarkdownlintConfigPath,
    rootNcuConfigPath,
    rootPreCommitConfigPath,
    rootSecretlintConfigPath,
    rootCodecovConfigPath,
    rootCspellConfigPath,
    rootElectronBuilderConfigPath,
    rootFlatpakManifestPath,
    rootMermaidConfigPath,
    rootPrettierConfigPath,
    rootStylelintConfigPath,
    rootRemarkConfigPath,
    rootReleaseMetadataPath,
    rootEslintConfigPath,
    rootPlaywrightConfigPath,
    rootViteRendererConfigPath,
    rootVitestConfigPath,
    rootEslintTsconfigPath,
    rootAppBaseTsconfigPath,
    rootAppTsconfigPath,
    rootRuntimeTsconfigPath,
    rootDocusaurusTsconfigPath,
    rootVitestTypecheckTsconfigPath,
    rootAppEslintTsconfigPath,
];
export const appSourcePath = path.join(repositoryRoot, appSourceDirectoryName);
export const docusaurusWorkspacePath = path.join(
    repositoryRoot,
    docusaurusWorkspaceName
);
export const appAlternativeFitViewPath = "ffv";
export const appElevProfileCssPath = "elevProfile.css";
export const appIconsPath = "icons";
export const appIndexHtmlPath = "index.html";
export const appLeafletMeasureLitePath = appSourceRepositoryPath(
    "renderer",
    "leafletMeasureLite.js"
);
export const appMainSourceAbsolutePath = appSourceAbsolutePath("main.ts");
export const appMainBundleAbsolutePath = repositoryPath(
    rootRuntimeDistPath,
    "main.js"
);
export const appPreloadSourceAbsolutePath = appSourceAbsolutePath("preload.ts");
export const appPreloadBundleAbsolutePath = repositoryPath(
    rootRuntimeDistPath,
    "preload.js"
);
export const appRendererVendorCoreEntryPath = appSourceRepositoryPath(
    "renderer",
    "rendererVendorCore.ts"
);
export const appRendererVendorChartDataEntryPath = appSourceRepositoryPath(
    "renderer",
    "rendererVendorChartData.ts"
);
export const appRendererVendorMapEntryPath = appSourceRepositoryPath(
    "renderer",
    "rendererVendorMap.ts"
);
export const rendererVendorBundleName = "renderer-vendor";
export const rendererVendorChartDataBundleName = "renderer-vendor-chart-data";
export const rendererVendorCoreBundleName = "renderer-vendor-core";
export const rendererVendorMapBundleName = "renderer-vendor-map";
export const rendererVendorChartDataScriptFileName = `${rendererVendorChartDataBundleName}.js`;
export const rendererVendorCoreScriptFileName = `${rendererVendorCoreBundleName}.js`;
export const rendererVendorMapScriptFileName = `${rendererVendorMapBundleName}.js`;
export const rendererVendorStyleFileName = `${rendererVendorBundleName}.css`;
export const appStyleCssPath = "style.css";
export const docusaurusPackagePath =
    docusaurusWorkspaceAbsolutePath("package.json");
export const docusaurusPackageRepositoryPath =
    docusaurusWorkspaceRepositoryPath("package.json");
export const docusaurusConfigRepositoryPath = docusaurusWorkspaceRepositoryPath(
    "docusaurus.config.ts"
);
export const docusaurusSidebarsRepositoryPath =
    docusaurusWorkspaceRepositoryPath("sidebars.ts");
export const docusaurusTsconfigRepositoryPath =
    docusaurusWorkspaceRepositoryPath("tsconfig.json");
export const docusaurusReadmeRepositoryPath =
    docusaurusWorkspaceRepositoryPath("README.md");
export const docusaurusArchitectureOverviewDocPath =
    docusaurusWorkspaceRepositoryPath("docs", "architecture", "overview.md");
export const docusaurusArchitectureModuleSystemDocPath =
    docusaurusWorkspaceRepositoryPath(
        "docs",
        "architecture",
        "module-system.md"
    );
export const docusaurusArchitectureProcessModelDocPath =
    docusaurusWorkspaceRepositoryPath(
        "docs",
        "architecture",
        "process-model.md"
    );
export const docusaurusArchitectureSecurityDocPath =
    docusaurusWorkspaceRepositoryPath("docs", "architecture", "security.md");
export const docusaurusAdvancedFitParserMigrationDocPath =
    docusaurusWorkspaceRepositoryPath(
        "docs",
        "advanced",
        "fit-parser-migration.md"
    );
export const docusaurusAdvancedPerformanceDocPath =
    docusaurusWorkspaceRepositoryPath("docs", "advanced", "performance.md");
export const docusaurusApiCoreApisDocPath = docusaurusWorkspaceRepositoryPath(
    "docs",
    "api-reference",
    "core-apis.md"
);
export const docusaurusApiIpcCommunicationDocPath =
    docusaurusWorkspaceRepositoryPath(
        "docs",
        "api-reference",
        "ipc-communication.md"
    );
export const docusaurusApiStateManagementDocPath =
    docusaurusWorkspaceRepositoryPath(
        "docs",
        "api-reference",
        "state-management.md"
    );
export const docusaurusApiUtilityApisDocPath =
    docusaurusWorkspaceRepositoryPath(
        "docs",
        "api-reference",
        "utility-apis.md"
    );
export const docusaurusDevelopmentBuildReleaseDocPath =
    docusaurusWorkspaceRepositoryPath(
        "docs",
        "development",
        "build-release.md"
    );
export const docusaurusDevelopmentSetupDocPath =
    docusaurusWorkspaceRepositoryPath("docs", "development", "setup.md");
export const docusaurusHomePagePath = docusaurusWorkspaceRepositoryPath(
    "src",
    "pages",
    "index.tsx"
);
export const docusaurusCachePath =
    docusaurusWorkspaceRelativePath(".docusaurus");
export const docusaurusBuildPath = docusaurusWorkspaceRelativePath("build");
export const docusaurusApiDocsPath = docusaurusWorkspaceRelativePath(
    "docs",
    "api"
);
export const docusaurusApiDocsAbsolutePath = docusaurusWorkspaceAbsolutePath(
    "docs",
    "api"
);
export const docusaurusStaticPath = docusaurusWorkspaceRelativePath("static");
export const docusaurusStaticFaviconPath = docusaurusWorkspaceRelativePath(
    "static",
    "favicon.ico"
);
export const docusaurusStaticImageFaviconPath = docusaurusWorkspaceRelativePath(
    "static",
    "img",
    "favicon.ico"
);
export const docusaurusStaticImageCoverageJsonPath =
    docusaurusWorkspaceRelativePath("static", "img", "coverage.json");
export const docusaurusStaticImageCoverageSvgPath =
    docusaurusWorkspaceRelativePath("static", "img", "coverage.svg");
export const docusaurusStaticScreenshotsPath = docusaurusWorkspaceRelativePath(
    "static",
    "img",
    "screenshots"
);
export const rootAlternativeFitViewPath = path.posix.join(
    rootStaticAssetsPath,
    appAlternativeFitViewPath
);
export const rootAlternativeFitViewAssetsPath = path.posix.join(
    rootAlternativeFitViewPath,
    "assets"
);
export const rootAlternativeFitViewIndexPath = path.posix.join(
    rootAlternativeFitViewPath,
    appIndexHtmlPath
);
export const rootAlternativeFitViewManifestPath = path.posix.join(
    rootAlternativeFitViewPath,
    "manifest.json"
);
export const rootAppStaticPath = path.posix.join(rootStaticAssetsPath, "app");
export const rootAppElevProfileCssPath = path.posix.join(
    rootAppStaticPath,
    appElevProfileCssPath
);
export const rootAppCssGlobPath = path.posix.join(rootAppStaticPath, "*.css");
export const rootAppIconsPath = path.posix.join(
    rootStaticAssetsPath,
    appIconsPath
);
export const rootAppFaviconPath = path.posix.join(
    rootAppIconsPath,
    "favicon.ico"
);
export const rootAppIconsSiteWebManifestPath = path.posix.join(
    rootAppIconsPath,
    "site.webmanifest"
);
export const rootAppIndexHtmlPath = path.posix.join(
    rootAppStaticPath,
    appIndexHtmlPath
);
export const rootAppStyleCssPath = path.posix.join(
    rootAppStaticPath,
    appStyleCssPath
);
export const repositoryPrettierTargets = [
    rootPackageJsonPath,
    docusaurusPackageRepositoryPath,
    docusaurusConfigRepositoryPath,
    docusaurusSidebarsRepositoryPath,
    docusaurusTsconfigRepositoryPath,
    ...rootToolingConfigPaths,
    "*.yml",
    "*.yaml",
    ".github/*.yml",
    ".github/workflows/*.yml",
    "scripts/*.mjs",
    "tests/fixtures/**/*.{js,ts}",
    "tests/integration/**/*.ts",
    "tests/unit/**/*.ts",
    `${rootPlaywrightTestsPath}/**/*.ts`,
    `${rootVitestSupportPath}/**/*.{cjs,mjs,ts}`,
    appLeafletMeasureLitePath,
];
export const scriptsPath = path.join(repositoryRoot, "scripts");
export const bundleMainScriptPath = repositoryScriptPath("bundle-main.mjs");
export const bundlePreloadScriptPath =
    repositoryScriptPath("bundle-preload.mjs");
export const applyElectronFusesScriptPath = repositoryScriptPath(
    "apply-electron-fuses.mjs"
);
export const buildRuntimeScriptPath = repositoryScriptPath("build-runtime.mjs");
export const cleanRuntimeDistScriptPath = repositoryScriptPath(
    "clean-runtime-dist.mjs"
);
export const formatRuntimeOutputScriptPath = repositoryScriptPath(
    "format-runtime-output.mjs"
);
export const generateApiCategoriesScriptPath = repositoryScriptPath(
    "generate-api-categories.mjs"
);
export const ensureElectronBinaryScriptPath = repositoryScriptPath(
    "ensure-electron-binary.mjs"
);
export const prepareRuntimeDistScriptPath = repositoryScriptPath(
    "prepare-runtime-dist.mjs"
);
export const runDocusaurusScriptPath =
    repositoryScriptPath("run-docusaurus.mjs");
export const runElectronBuilderScriptPath = repositoryScriptPath(
    "run-electron-builder.mjs"
);
export const runElectronScriptPath = repositoryScriptPath("run-electron.mjs");
export const syncDocusaurusStaticAssetsScriptPath = repositoryScriptPath(
    "sync-docusaurus-static-assets.mjs"
);
export const validateRuntimeTsconfigScriptPath = repositoryScriptPath(
    "validate-runtime-tsconfig.mjs"
);

export function appSourceRelativePath(...segments) {
    return path.join(appSourceDirectoryName, ...segments);
}

export function appSourceAbsolutePath(...segments) {
    return path.join(appSourcePath, ...segments);
}

export function appSourceRepositoryPath(...segments) {
    return path.posix.join(appSourceDirectoryName, ...segments);
}

export function docusaurusWorkspaceAbsolutePath(...segments) {
    return path.join(docusaurusWorkspacePath, ...segments);
}

export function docusaurusWorkspaceRelativePath(...segments) {
    return path.join(docusaurusWorkspaceName, ...segments);
}

export function docusaurusWorkspaceRepositoryPath(...segments) {
    return path.posix.join(docusaurusWorkspaceName, ...segments);
}

export function repositoryScriptPath(...segments) {
    return path.join(scriptsPath, ...segments);
}

export function repositoryPath(...segments) {
    return path.join(repositoryRoot, ...segments);
}

export function rootReleaseDistRelativePath(...segments) {
    return path.join(rootReleaseDistPath, ...segments);
}

function resolveRepositoryRoot() {
    const setupImportMetaUrl = import.meta.url;
    if (setupImportMetaUrl.startsWith("file:")) {
        return path.resolve(
            fileURLToPath(new URL("../..", setupImportMetaUrl))
        );
    }

    return path.resolve(process.cwd());
}
