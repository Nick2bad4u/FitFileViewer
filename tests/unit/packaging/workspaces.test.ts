import path from "node:path";

import { describe, expect, it } from "vitest";

type WorkspacesModule = {
    appAlternativeFitViewPath: string;
    appDistPath: string;
    appElevProfileCssPath: string;
    appIconsPath: string;
    appIndexHtmlPath: string;
    appPackagePath: string;
    appPackageRepositoryPath: string;
    appStyleCssPath: string;
    appTypesPath: string;
    appWorkspaceAbsolutePath: (...segments: string[]) => string;
    appWorkspaceName: string;
    appWorkspacePath: string;
    appWorkspaceRepositoryPath: (...segments: string[]) => string;
    appWorkspaceRelativePath: (...segments: string[]) => string;
    docusaurusPackagePath: string;
    docusaurusPackageRepositoryPath: string;
    docusaurusWorkspaceAbsolutePath: (...segments: string[]) => string;
    docusaurusWorkspaceName: string;
    docusaurusWorkspacePath: string;
    docusaurusWorkspaceRepositoryPath: (...segments: string[]) => string;
    docusaurusWorkspaceRelativePath: (...segments: string[]) => string;
    repositoryRoot: string;
    repositoryPath: (...segments: string[]) => string;
    repositoryScriptPath: (...segments: string[]) => string;
    rootAlternativeFitViewPath: string;
    rootAppElevProfileCssPath: string;
    rootAppIconsPath: string;
    rootAppIndexHtmlPath: string;
    rootAppStaticPath: string;
    rootAppStyleCssPath: string;
    rootElectronBuilderConfigPath: string;
    rootArtifactsPath: string;
    rootDocusaurusTsconfigPath: string;
    rootElectronAppTsconfigPath: string;
    rootEslintConfigPath: string;
    rootFlatpakBuildPath: string;
    rootFlatpakBundlePath: string;
    rootFlatpakManifestPath: string;
    rootFlatpakRepoPath: string;
    rootFlatpakZipPath: string;
    rootIntegrationTestsPath: string;
    rootPrettierConfigPath: string;
    rootReleaseDistPath: string;
    rootReleaseDistRelativePath: (...segments: string[]) => string;
    rootRuntimeTsconfigPath: string;
    rootStaticAssetsPath: string;
    rootStylelintConfigPath: string;
    rootTabsTestsPath: string;
    rootTypedocConfigPath: string;
    rootUnitTestsPath: string;
    rootViteRendererConfigPath: string;
    rootVitestConfigPath: string;
    scriptsPath: string;
    appWorkspaceRelativeToRepositoryRootPath: (...segments: string[]) => string;
};

async function importWorkspaces(): Promise<WorkspacesModule> {
    return (await import("../../../scripts/lib/workspaces.mjs")) as WorkspacesModule;
}

describe("workspace path helpers", () => {
    it("centralizes the app workspace root paths", async () => {
        expect.assertions(15);

        const workspaces = await importWorkspaces();

        expect(workspaces.repositoryRoot).toBe(process.cwd());
        expect(workspaces.repositoryRoot).not.toBe(
            path.join(process.cwd(), "electron-app")
        );
        expect(workspaces.appWorkspaceName).toBe("electron-app");
        expect(workspaces.appWorkspacePath).toBe(
            path.join(process.cwd(), "electron-app")
        );
        expect(workspaces.docusaurusWorkspaceName).toBe("docusaurus");
        expect(workspaces.docusaurusWorkspacePath).toBe(
            path.join(process.cwd(), "docusaurus")
        );
        expect(workspaces.appDistPath).toBe(path.join("electron-app", "dist"));
        expect(workspaces.appPackagePath).toBe(
            path.join(process.cwd(), "electron-app", "package.json")
        );
        expect(workspaces.appPackageRepositoryPath).toBe(
            "electron-app/package.json"
        );
        expect(workspaces.appTypesPath).toBe(
            path.join("electron-app", "types")
        );
        expect(workspaces.appWorkspaceRepositoryPath("package.json")).toBe(
            "electron-app/package.json"
        );
        expect(workspaces.appWorkspaceAbsolutePath("dist")).toBe(
            path.join(process.cwd(), "electron-app", "dist")
        );
        expect(workspaces.scriptsPath).toBe(
            path.join(process.cwd(), "scripts")
        );
        expect(workspaces.repositoryScriptPath("build-runtime.mjs")).toBe(
            path.join(process.cwd(), "scripts", "build-runtime.mjs")
        );
        expect(
            workspaces.repositoryPath(workspaces.rootFlatpakManifestPath)
        ).toBe(path.join(process.cwd(), workspaces.rootFlatpakManifestPath));
    });

    it("centralizes app runtime asset paths", async () => {
        expect.assertions(12);

        const workspaces = await importWorkspaces();

        expect(workspaces.appAlternativeFitViewPath).toBe("ffv");
        expect(workspaces.appElevProfileCssPath).toBe("elevProfile.css");
        expect(workspaces.appIconsPath).toBe("icons");
        expect(workspaces.appIndexHtmlPath).toBe("index.html");
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
        expect.assertions(10);

        const workspaces = await importWorkspaces();

        expect(workspaces.rootElectronBuilderConfigPath).toBe(
            "electron-builder.config.cjs"
        );
        expect(workspaces.rootElectronAppTsconfigPath).toBe(
            "tsconfig.electron-app.json"
        );
        expect(workspaces.rootEslintConfigPath).toBe("eslint.config.mjs");
        expect(workspaces.rootFlatpakManifestPath).toBe("flatpak-build.yml");
        expect(workspaces.rootPrettierConfigPath).toBe("prettier.config.mjs");
        expect(workspaces.rootRuntimeTsconfigPath).toBe(
            "tsconfig.runtime.json"
        );
        expect(workspaces.rootStylelintConfigPath).toBe("stylelint.config.mjs");
        expect(workspaces.rootTypedocConfigPath).toBe("typedoc.json");
        expect(workspaces.rootViteRendererConfigPath).toBe(
            "vite.renderer.config.mjs"
        );
        expect(workspaces.rootVitestConfigPath).toBe("vitest.config.ts");
    });

    it("centralizes root generated output and test paths", async () => {
        expect.assertions(11);

        const workspaces = await importWorkspaces();

        expect(workspaces.rootArtifactsPath).toBe("artifacts");
        expect(workspaces.rootFlatpakBuildPath).toBe("flatpak-build-dir");
        expect(workspaces.rootFlatpakBundlePath).toBe("FitFileViewer.flatpak");
        expect(workspaces.rootFlatpakRepoPath).toBe("flatpak-repo");
        expect(workspaces.rootFlatpakZipPath).toBe("FitFileViewer.flatpak.zip");
        expect(workspaces.rootReleaseDistPath).toBe("release-dist");
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
        expect(
            workspaces.appWorkspaceRelativeToRepositoryRootPath(
                workspaces.rootElectronBuilderConfigPath
            )
        ).toBe("../electron-builder.config.cjs");
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
