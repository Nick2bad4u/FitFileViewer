import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const repositoryRoot = resolveRepositoryRoot();
export const appSourceDirectoryName = "electron-app";
export const docusaurusWorkspaceName = "docusaurus";
export const rootArtifactsPath = "artifacts";
export const rootCoveragePath = "coverage";
export const rootCoverageAbsolutePath = repositoryPath(rootCoveragePath);
export const rootPackageJsonPath = "package.json";
export const rootPackagePath = repositoryPath(rootPackageJsonPath);
export const rootPackageRepositoryPath = rootPackageJsonPath;
export const rootPlaywrightConfigPath = "playwright.config.ts";
export const rootDocusaurusTsconfigPath = "tsconfig.docusaurus.json";
export const rootElectronBuilderConfigPath = "electron-builder.config.cjs";
export const rootElectronAppBaseTsconfigPath =
    "tsconfig.electron-app.base.json";
export const rootElectronAppEslintTsconfigPath =
    "tsconfig.electron-app.eslint.json";
export const rootElectronAppTsconfigPath = "tsconfig.electron-app.json";
export const rootEslintTsconfigPath = "tsconfig.eslint.json";
export const rootEslintConfigPath = "eslint.config.mjs";
export const rootFlatpakBuildPath = "flatpak-build-dir";
export const rootFlatpakBundlePath = "FitFileViewer.flatpak";
export const rootFlatpakManifestPath = "flatpak-build.yml";
export const rootFlatpakRepoPath = "flatpak-repo";
export const rootFlatpakZipPath = `${rootFlatpakBundlePath}.zip`;
export const rootPrettierConfigPath = "prettier.config.mjs";
export const rootReleaseDistPath = "release-dist";
export const rootReleaseDistAbsolutePath = repositoryPath(rootReleaseDistPath);
export const rootWin7ReleaseDistPath = repositoryPath(
    rootReleaseDistPath,
    "win7"
);
export const rootRuntimeTsconfigPath = "tsconfig.runtime.json";
export const rootRuntimeTsconfigAbsolutePath = repositoryPath(
    rootRuntimeTsconfigPath
);
export const rootStaticAssetsPath = "static";
export const rootStylelintConfigPath = "stylelint.config.mjs";
export const rootIntegrationTestsPath = path.posix.join("tests", "integration");
export const rootTypedocConfigPath = "typedoc.json";
export const rootUnitTestsPath = path.posix.join("tests", "unit");
export const rootTabsTestsPath = path.posix.join(rootUnitTestsPath, "tabs");
export const rootViteRendererConfigPath = "vite.renderer.config.mjs";
export const rootVitestConfigPath = "vitest.config.ts";
export const rootVitestTypecheckTsconfigPath = "tsconfig.vitest-typecheck.json";
export const appSourcePath = path.join(repositoryRoot, appSourceDirectoryName);
export const docusaurusWorkspacePath = path.join(
    repositoryRoot,
    docusaurusWorkspaceName
);
export const appAlternativeFitViewPath = "ffv";
export const appCoveragePath = appSourceRelativePath(rootCoveragePath);
export const appCoverageAbsolutePath = appSourceAbsolutePath(rootCoveragePath);
export const appDistPath = appSourceRelativePath("dist");
export const appDistRendererRepositoryPath = appSourceRepositoryPath(
    "dist",
    "renderer"
);
export const appElevProfileCssPath = "elevProfile.css";
export const appIconsPath = "icons";
export const appIndexHtmlPath = "index.html";
export const appLeafletMeasureLitePath = appSourceRepositoryPath(
    "renderer",
    "leafletMeasureLite.js"
);
export const appRendererVendorGlobalsEntryPath = appSourceRepositoryPath(
    "renderer",
    "vendorGlobals.ts"
);
export const rendererVendorGlobalsBundleName = "vendor-globals";
export const rendererVendorGlobalsScriptFileName = `${rendererVendorGlobalsBundleName}.js`;
export const rendererVendorGlobalsStyleFileName = `${rendererVendorGlobalsBundleName}.css`;
export const appStyleCssPath = "style.css";
export const appTypesPath = appSourceRelativePath("types");
export const docusaurusPackagePath =
    docusaurusWorkspaceAbsolutePath("package.json");
export const docusaurusPackageRepositoryPath =
    docusaurusWorkspaceRepositoryPath("package.json");
export const rootAlternativeFitViewPath = path.posix.join(
    rootStaticAssetsPath,
    appAlternativeFitViewPath
);
export const rootAppStaticPath = path.posix.join(rootStaticAssetsPath, "app");
export const rootAppElevProfileCssPath = path.posix.join(
    rootAppStaticPath,
    appElevProfileCssPath
);
export const rootAppIconsPath = path.posix.join(
    rootStaticAssetsPath,
    appIconsPath
);
export const rootAppIndexHtmlPath = path.posix.join(
    rootAppStaticPath,
    appIndexHtmlPath
);
export const rootAppStyleCssPath = path.posix.join(
    rootAppStaticPath,
    appStyleCssPath
);
export const scriptsPath = path.join(repositoryRoot, "scripts");
export const buildRuntimeScriptPath = repositoryScriptPath("build-runtime.mjs");
export const generateApiCategoriesScriptPath = repositoryScriptPath(
    "generate-api-categories.mjs"
);
export const runDocusaurusScriptPath =
    repositoryScriptPath("run-docusaurus.mjs");
export const runElectronBuilderScriptPath = repositoryScriptPath(
    "run-electron-builder.mjs"
);
export const runElectronScriptPath = repositoryScriptPath("run-electron.mjs");

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
