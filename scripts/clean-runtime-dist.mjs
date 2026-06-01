import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    appSourceAbsolutePath,
    appSourceDirectoryName,
    appSourcePath,
} from "./lib/workspaces.mjs";

export const defaultRuntimeDistPath = appSourceAbsolutePath("dist");

export function assertInsideAppSource(targetPath, appRoot = appSourcePath) {
    const resolvedRoot = path.resolve(appRoot);
    const resolvedTarget = path.resolve(targetPath);
    const relativePath = path.relative(resolvedRoot, resolvedTarget);

    if (
        relativePath === "" ||
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error(
            `Refusing to remove outside ${appSourceDirectoryName}: ${targetPath}`
        );
    }
}

export function cleanRuntimeDist({
    appRoot = appSourcePath,
    distPath = defaultRuntimeDistPath,
    fileSystem = fs,
} = {}) {
    assertInsideAppSource(distPath, appRoot);
    fileSystem.rmSync(distPath, { force: true, recursive: true });

    return distPath;
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    cleanRuntimeDist();
}
