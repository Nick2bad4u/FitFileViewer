import fs from "node:fs";
import path from "node:path";

import {
    appWorkspaceAbsolutePath,
    appWorkspacePath,
} from "./lib/workspaces.mjs";

const appDir = appWorkspacePath;
const distDir = appWorkspaceAbsolutePath("dist");

function assertInsideElectronApp(targetPath) {
    const resolvedRoot = path.resolve(appDir);
    const resolvedTarget = path.resolve(targetPath);
    const relativePath = path.relative(resolvedRoot, resolvedTarget);

    if (
        relativePath === "" ||
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error(
            `Refusing to remove outside electron-app: ${targetPath}`
        );
    }
}

assertInsideElectronApp(distDir);
fs.rmSync(distDir, { force: true, recursive: true });
