import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
    appWorkspaceAbsolutePath,
    appWorkspacePath,
} from "./lib/workspaces.mjs";

const defaultAppDir = appWorkspacePath;
const defaultDistDir = appWorkspaceAbsolutePath("dist");

export const directoryCopies = ["ffv", "icons"];
export const fileCopies = ["elevProfile.css", "style.css"];

function assertInsideAppDir(appDir, targetPath) {
    const resolvedRoot = path.resolve(appDir);
    const resolvedTarget = path.resolve(targetPath);
    const relativePath = path.relative(resolvedRoot, resolvedTarget);

    if (
        relativePath === "" ||
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error(
            `Refusing to operate outside app directory: ${targetPath}`
        );
    }
}

function copyDirectory(appDir, distDir, name) {
    const source = path.join(appDir, name);
    const destination = path.join(distDir, name);

    if (!fs.existsSync(source)) {
        return;
    }

    assertInsideAppDir(appDir, destination);
    fs.cpSync(source, destination, { force: true, recursive: true });
}

function copyFile(appDir, distDir, name) {
    const source = path.join(appDir, name);
    const destination = path.join(distDir, name);

    if (!fs.existsSync(source)) {
        return;
    }

    assertInsideAppDir(appDir, destination);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
}

function assertNoNodeModulesReference(appDir, filePath, content) {
    if (content.includes("node_modules")) {
        throw new Error(
            `${path.relative(appDir, filePath)} must not reference node_modules directly`
        );
    }
}

function copyIndexHtml(appDir, distDir) {
    const source = path.join(appDir, "index.html");
    const destination = path.join(distDir, "index.html");
    const html = fs.readFileSync(source, "utf8");

    assertNoNodeModulesReference(appDir, source, html);
    assertInsideAppDir(appDir, destination);
    fs.writeFileSync(destination, html);
    assertNoNodeModulesReference(appDir, destination, html);
}

export function prepareRuntimeDist({
    appDir = defaultAppDir,
    distDir = defaultDistDir,
} = {}) {
    fs.mkdirSync(distDir, { recursive: true });
    copyIndexHtml(appDir, distDir);
    for (const name of directoryCopies) {
        copyDirectory(appDir, distDir, name);
    }
    for (const name of fileCopies) {
        copyFile(appDir, distDir, name);
    }
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    prepareRuntimeDist();
}
