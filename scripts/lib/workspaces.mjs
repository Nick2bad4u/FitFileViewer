import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const repositoryRoot = resolveRepositoryRoot();
export const appWorkspaceName = "electron-app";
export const docusaurusWorkspaceName = "docusaurus";
export const appWorkspacePath = path.join(repositoryRoot, appWorkspaceName);
export const docusaurusWorkspacePath = path.join(
    repositoryRoot,
    docusaurusWorkspaceName
);
export const appDistPath = appWorkspaceRelativePath("dist");
export const appReleasePath = appWorkspaceRelativePath("release");
export const appTypesPath = appWorkspaceRelativePath("types");
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

export function repositoryScriptPath(...segments) {
    return path.join(scriptsPath, ...segments);
}

function resolveRepositoryRoot() {
    const setupImportMetaUrl = import.meta.url;
    if (setupImportMetaUrl.startsWith("file:")) {
        return path.resolve(fileURLToPath(new URL("../..", setupImportMetaUrl)));
    }

    return path.resolve(process.cwd());
}
