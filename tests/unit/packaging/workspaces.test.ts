import path from "node:path";

import { describe, expect, it } from "vitest";

type WorkspacesModule = {
    appAlternativeFitViewPath: string;
    appDistAbsolutePath: string;
    appDistPath: string;
    appDistRendererRepositoryPath: string;
    appElevProfileCssPath: string;
    appIconsPath: string;
    appIndexHtmlPath: string;
    appLeafletMeasureLitePath: string;
    appRendererVendorGlobalsEntryPath: string;
    appStyleCssPath: string;
    appTypesAbsolutePath: string;
    appTypesPath: string;
    appSourceAbsolutePath: (...segments: string[]) => string;
    appSourceDirectoryName: string;
    appSourcePath: string;
    appSourceRepositoryPath: (...segments: string[]) => string;
    appSourceRelativePath: (...segments: string[]) => string;
    buildRendererScriptPath: string;
    buildRuntimeScriptPath: string;
    bundlePreloadScriptPath: string;
    cleanRuntimeDistScriptPath: string;
    docusaurusPackagePath: string;
    docusaurusPackageRepositoryPath: string;
    docusaurusWorkspaceAbsolutePath: (...segments: string[]) => string;
    docusaurusWorkspaceName: string;
    docusaurusWorkspacePath: string;
    docusaurusWorkspaceRepositoryPath: (...segments: string[]) => string;
    docusaurusWorkspaceRelativePath: (...segments: string[]) => string;
    formatRuntimeOutputScriptPath: string;
    generateApiCategoriesScriptPath: string;
    generateChangelogScriptPath: string;
    prepareRuntimeDistScriptPath: string;
    repositoryRoot: string;
    repositoryPath: (...segments: string[]) => string;
    repositoryScriptPath: (...segments: string[]) => string;
    rendererVendorGlobalsBundleName: string;
    rendererVendorGlobalsScriptFileName: string;
    rendererVendorGlobalsStyleFileName: string;
    rootElectronAppBaseTsconfigPath: string;
    rootElectronAppEslintTsconfigPath: string;
    rootAlternativeFitViewPath: string;
    rootAppElevProfileCssPath: string;
    rootAppIconsPath: string;
    rootAppIndexHtmlPath: string;
    rootAppStaticPath: string;
    rootAppStyleCssPath: string;
    rootElectronBuilderConfigPath: string;
    rootArtifactsPath: string;
    rootCoverageAbsolutePath: string;
    rootCoveragePath: string;
    rootDocusaurusTsconfigPath: string;
    rootElectronAppTsconfigPath: string;
    rootEslintTsconfigPath: string;
    rootEslintConfigPath: string;
    rootFlatpakBuildPath: string;
    rootFlatpakBundlePath: string;
    rootFlatpakManifestPath: string;
    rootFlatpakRepoPath: string;
    rootFlatpakZipPath: string;
    rootPackageJsonPath: string;
    rootPackagePath: string;
    rootPackageRepositoryPath: string;
    rootPlaywrightConfigPath: string;
    rootIntegrationTestsPath: string;
    rootPrettierConfigPath: string;
    rootReleaseDistPath: string;
    rootReleaseDistAbsolutePath: string;
    rootReleaseDistRelativePath: (...segments: string[]) => string;
    rootRuntimeTsconfigAbsolutePath: string;
    rootRuntimeTsconfigPath: string;
    rootStaticAssetsPath: string;
    rootStylelintConfigPath: string;
    rootTabsTestsPath: string;
    rootTypedocConfigPath: string;
    rootUnitTestsPath: string;
    rootViteRendererConfigPath: string;
    rootVitestConfigPath: string;
    rootVitestTypecheckTsconfigPath: string;
    rootWin7ReleaseDistPath: string;
    runDocusaurusScriptPath: string;
    runElectronBuilderScriptPath: string;
    runElectronScriptPath: string;
    runTypescriptScriptPath: string;
    scriptsPath: string;
    syncDocusaurusStaticAssetsScriptPath: string;
    validateRuntimeTsconfigScriptPath: string;
};

async function importWorkspaces(): Promise<WorkspacesModule> {
    return (await import("../../../scripts/lib/workspaces.mjs")) as WorkspacesModule;
}

describe("workspace path helpers", () => {
    it("centralizes the app source root paths", async () => {
        expect.assertions(15);

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
        expect(workspaces.appDistPath).toBe(path.join("electron-app", "dist"));
        expect(workspaces.appDistAbsolutePath).toBe(
            path.join(process.cwd(), "electron-app", "dist")
        );
        expect(workspaces.rootPackagePath).toBe(
            path.join(process.cwd(), "package.json")
        );
        expect(workspaces.rootPackageRepositoryPath).toBe("package.json");
        expect(workspaces.appTypesPath).toBe(
            path.join("electron-app", "types")
        );
        expect(workspaces.appTypesAbsolutePath).toBe(
            path.join(process.cwd(), "electron-app", "types")
        );
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
        expect(workspaces.runTypescriptScriptPath).toBe(
            path.join(process.cwd(), "scripts", "run-typescript.mjs")
        );
        expect(workspaces.bundlePreloadScriptPath).toBe(
            path.join(process.cwd(), "scripts", "bundle-preload.mjs")
        );
        expect(workspaces.buildRendererScriptPath).toBe(
            path.join(process.cwd(), "scripts", "build-renderer.mjs")
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
        expect(workspaces.generateChangelogScriptPath).toBe(
            path.join(process.cwd(), "scripts", "generate-changelog.mjs")
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
        expect.assertions(18);

        const workspaces = await importWorkspaces();

        expect(workspaces.appAlternativeFitViewPath).toBe("ffv");
        expect(workspaces.appDistRendererRepositoryPath).toBe(
            "electron-app/dist/renderer"
        );
        expect(workspaces.appElevProfileCssPath).toBe("elevProfile.css");
        expect(workspaces.appIconsPath).toBe("icons");
        expect(workspaces.appIndexHtmlPath).toBe("index.html");
        expect(workspaces.appLeafletMeasureLitePath).toBe(
            "electron-app/renderer/leafletMeasureLite.js"
        );
        expect(workspaces.appRendererVendorGlobalsEntryPath).toBe(
            "electron-app/renderer/vendorGlobals.ts"
        );
        expect(workspaces.rendererVendorGlobalsBundleName).toBe(
            "vendor-globals"
        );
        expect(workspaces.rendererVendorGlobalsScriptFileName).toBe(
            "vendor-globals.js"
        );
        expect(workspaces.rendererVendorGlobalsStyleFileName).toBe(
            "vendor-globals.css"
        );
        expect(workspaces.rootStaticAssetsPath).toBe("static");
        expect(workspaces.rootAlternativeFitViewPath).toBe("static/ffv");
        expect(workspaces.rootAppStaticPath).toBe("static/app");
        expect(workspaces.rootAppElevProfileCssPath).toBe(
            "static/app/elevProfile.css"
        );
        expect(workspaces.rootAppIconsPath).toBe("static/icons");
        expect(workspaces.rootAppIndexHtmlPath).toBe("static/app/index.html");
        expect(workspaces.rootAppStyleCssPath).toBe("static/app/style.css");
        expect(workspaces.appStyleCssPath).toBe("style.css");
    });

    it("centralizes root config paths", async () => {
        expect.assertions(17);

        const workspaces = await importWorkspaces();

        expect(workspaces.rootPackageJsonPath).toBe("package.json");
        expect(workspaces.rootElectronBuilderConfigPath).toBe(
            "electron-builder.config.cjs"
        );
        expect(workspaces.rootElectronAppBaseTsconfigPath).toBe(
            "tsconfig.electron-app.base.json"
        );
        expect(workspaces.rootElectronAppEslintTsconfigPath).toBe(
            "tsconfig.electron-app.eslint.json"
        );
        expect(workspaces.rootElectronAppTsconfigPath).toBe(
            "tsconfig.electron-app.json"
        );
        expect(workspaces.rootEslintTsconfigPath).toBe("tsconfig.eslint.json");
        expect(workspaces.rootEslintConfigPath).toBe("eslint.config.mjs");
        expect(workspaces.rootFlatpakManifestPath).toBe("flatpak-build.yml");
        expect(workspaces.rootPlaywrightConfigPath).toBe(
            "playwright.config.ts"
        );
        expect(workspaces.rootPrettierConfigPath).toBe("prettier.config.mjs");
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

    it("centralizes root generated output and test paths", async () => {
        expect.assertions(14);

        const workspaces = await importWorkspaces();

        expect(workspaces.rootArtifactsPath).toBe("artifacts");
        expect(workspaces.rootCoveragePath).toBe("coverage");
        expect(workspaces.rootCoverageAbsolutePath).toBe(
            path.join(process.cwd(), "coverage")
        );
        expect(workspaces.rootFlatpakBuildPath).toBe("flatpak-build-dir");
        expect(workspaces.rootFlatpakBundlePath).toBe("FitFileViewer.flatpak");
        expect(workspaces.rootFlatpakRepoPath).toBe("flatpak-repo");
        expect(workspaces.rootFlatpakZipPath).toBe("FitFileViewer.flatpak.zip");
        expect(workspaces.rootReleaseDistPath).toBe("release-dist");
        expect(workspaces.rootReleaseDistAbsolutePath).toBe(
            path.join(process.cwd(), "release-dist")
        );
        expect(workspaces.rootWin7ReleaseDistPath).toBe(
            path.join(process.cwd(), "release-dist", "win7")
        );
        expect(workspaces.rootIntegrationTestsPath).toBe("tests/integration");
        expect(workspaces.rootUnitTestsPath).toBe("tests/unit");
        expect(workspaces.rootTabsTestsPath).toBe("tests/unit/tabs");
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
        expect.assertions(9);

        const workspaces = await importWorkspaces();

        expect(workspaces.repositoryRoot).toBe(process.cwd());
        expect(workspaces.docusaurusWorkspaceName).toBe("docusaurus");
        expect(workspaces.docusaurusWorkspacePath).toBe(
            path.join(process.cwd(), "docusaurus")
        );
        expect(workspaces.docusaurusWorkspaceRelativePath("static")).toBe(
            path.join("docusaurus", "static")
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
});
