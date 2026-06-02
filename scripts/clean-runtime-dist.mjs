import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { appDistAbsolutePath, repositoryRoot } from "./lib/workspaces.mjs";

export const defaultRuntimeDistPath = appDistAbsolutePath;

export function assertInsideRepository(targetPath, root = repositoryRoot) {
    const resolvedRoot = path.resolve(root);
    const resolvedTarget = path.resolve(targetPath);
    const relativePath = path.relative(resolvedRoot, resolvedTarget);

    if (
        relativePath === "" ||
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error(`Refusing to remove outside repository: ${targetPath}`);
    }
}

export function cleanRuntimeDist({
    distPath = defaultRuntimeDistPath,
    fileSystem = fs,
    root = repositoryRoot,
} = {}) {
    assertInsideRepository(distPath, root);
    fileSystem.rmSync(distPath, { force: true, recursive: true });

    return distPath;
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    cleanRuntimeDist();
}
