import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const repositoryRoot = resolveRepositoryRoot();
export const appWorkspaceName = "electron-app";
export const docusaurusWorkspaceName = "docusaurus";
export const rootArtifactsPath = "artifacts";
export const rootDocusaurusTsconfigPath = "tsconfig.docusaurus.json";
export const rootElectronBuilderConfigPath = "electron-builder.config.cjs";
export const rootElectronBuilderFilesPath = "electron-builder.files.json";
export const rootElectronAppTsconfigPath = "tsconfig.electron-app.json";
export const rootEslintConfigPath = "eslint.config.mjs";
export const rootFlatpakBuildPath = "flatpak-build-dir";
export const rootFlatpakBundlePath = "FitFileViewer.flatpak";
export const rootFlatpakManifestPath = "flatpak-build.yml";
export const rootFlatpakRepoPath = "flatpak-repo";
export const rootFlatpakZipPath = `${rootFlatpakBundlePath}.zip`;
export const rootPrettierConfigPath = "prettier.config.mjs";
export const rootReleaseDistPath = "release-dist";
export const rootRuntimeTsconfigPath = "tsconfig.runtime.json";
export const rootStaticAssetsPath = "static";
export const rootStylelintConfigPath = "stylelint.config.mjs";
export const rootTypedocConfigPath = "typedoc.json";
export const rootUnitTestsPath = path.posix.join("tests", "unit");
export const rootViteRendererConfigPath = "vite.renderer.config.mjs";
export const rootVitestConfigPath = "vitest.config.ts";
export const appWorkspacePath = path.join(repositoryRoot, appWorkspaceName);
export const docusaurusWorkspacePath = path.join(
    repositoryRoot,
    docusaurusWorkspaceName
);
export const appAlternativeFitViewPath = "ffv";
export const appDistPath = appWorkspaceRelativePath("dist");
export const appElevProfileCssPath = "elevProfile.css";
export const appIconsPath = "icons";
export const appIndexHtmlPath = "index.html";
export const appIntegrationTestsPath = appWorkspaceRepositoryPath(
    "tests",
    "integration"
);
export const appPackagePath = appWorkspaceAbsolutePath("package.json");
export const appPackageRepositoryPath =
    appWorkspaceRepositoryPath("package.json");
export const appStyleCssPath = "style.css";
export const appTabsTestsPath = appWorkspaceRepositoryPath(
    "tests",
    "unit",
    "tabs"
);
export const appTypesPath = appWorkspaceRelativePath("types");
export const appUnitTestsPath = appWorkspaceRepositoryPath("tests", "unit");
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

export function appWorkspaceRelativePath(...segments) {
    return path.join(appWorkspaceName, ...segments);
}

export function appWorkspaceAbsolutePath(...segments) {
    return path.join(appWorkspacePath, ...segments);
}

export function appWorkspaceRepositoryPath(...segments) {
    return path.posix.join(appWorkspaceName, ...segments);
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

export function appWorkspaceRelativeToRepositoryRootPath(...segments) {
    return path.posix.join("..", ...segments);
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
