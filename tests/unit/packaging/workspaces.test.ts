import path from "node:path";

import { describe, expect, it } from "vitest";

type WorkspacesModule = {
    appDistPath: string;
    appPackagePath: string;
    appPackageRepositoryPath: string;
    appReleasePath: string;
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
    rootArtifactsPath: string;
    rootReleaseDistPath: string;
    rootReleaseDistRelativePath: (...segments: string[]) => string;
    scriptsPath: string;
};

async function importWorkspaces(): Promise<WorkspacesModule> {
    return (await import("../../../scripts/lib/workspaces.mjs")) as WorkspacesModule;
}

describe("workspace path helpers", () => {
    it("centralizes the app workspace root and generated output paths", async () => {
        expect.assertions(20);

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
        expect(workspaces.appReleasePath).toBe(
            path.join("electron-app", "release")
        );
        expect(workspaces.appTypesPath).toBe(
            path.join("electron-app", "types")
        );
        expect(workspaces.appWorkspaceRelativePath("release", "win7")).toBe(
            path.join("electron-app", "release", "win7")
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
        expect(workspaces.repositoryPath("flatpak-build.yml")).toBe(
            path.join(process.cwd(), "flatpak-build.yml")
        );
        expect(workspaces.rootArtifactsPath).toBe("artifacts");
        expect(workspaces.rootReleaseDistPath).toBe("release-dist");
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
        expect.assertions(8);

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
    });
});
