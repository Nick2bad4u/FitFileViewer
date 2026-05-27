import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const repositoryRoot = resolveRepositoryRoot();
export const appWorkspaceName = "electron-app";
export const appWorkspacePath = path.join(repositoryRoot, appWorkspaceName);
export const appDistPath = appWorkspaceRelativePath("dist");
export const appReleasePath = appWorkspaceRelativePath("release");
export const appTypesPath = appWorkspaceRelativePath("types");

export function appWorkspaceRelativePath(...segments) {
    return path.join(appWorkspaceName, ...segments);
}

export function appWorkspaceAbsolutePath(...segments) {
    return path.join(appWorkspacePath, ...segments);
}

function resolveRepositoryRoot() {
    const setupImportMetaUrl = import.meta.url;
    if (setupImportMetaUrl.startsWith("file:")) {
        return path.resolve(fileURLToPath(new URL("../..", setupImportMetaUrl)));
    }

    return path.resolve(process.cwd());
}
