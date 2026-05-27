import path from "node:path";

import { describe, expect, it } from "vitest";

type WorkspacesModule = {
    appDistPath: string;
    appReleasePath: string;
    appTypesPath: string;
    appWorkspaceAbsolutePath: (...segments: string[]) => string;
    appWorkspaceName: string;
    appWorkspacePath: string;
    appWorkspaceRelativePath: (...segments: string[]) => string;
    repositoryRoot: string;
};

async function importWorkspaces(): Promise<WorkspacesModule> {
    return (await import("../../../scripts/lib/workspaces.mjs")) as WorkspacesModule;
}

describe("workspace path helpers", () => {
    it("centralizes the app workspace root and generated output paths", async () => {
        expect.assertions(9);

        const workspaces = await importWorkspaces();

        expect(workspaces.repositoryRoot).toBe(process.cwd());
        expect(workspaces.repositoryRoot).not.toBe(
            path.join(process.cwd(), "electron-app")
        );
        expect(workspaces.appWorkspaceName).toBe("electron-app");
        expect(workspaces.appWorkspacePath).toBe(
            path.join(process.cwd(), "electron-app")
        );
        expect(workspaces.appDistPath).toBe(path.join("electron-app", "dist"));
        expect(workspaces.appReleasePath).toBe(
            path.join("electron-app", "release")
        );
        expect(workspaces.appTypesPath).toBe(
            path.join("electron-app", "types")
        );
        expect(workspaces.appWorkspaceRelativePath("release", "win7")).toBe(
            path.join("electron-app", "release", "win7")
        );
        expect(workspaces.appWorkspaceAbsolutePath("dist")).toBe(
            path.join(process.cwd(), "electron-app", "dist")
        );
    });
});
