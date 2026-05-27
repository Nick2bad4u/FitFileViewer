import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
    appAlternativeFitViewPath,
    appElevProfileCssPath,
    appIconsPath,
    appIndexHtmlPath,
    appStyleCssPath,
    appWorkspaceAbsolutePath,
    appWorkspacePath,
    repositoryPath,
    rootStaticAssetsPath,
} from "./lib/workspaces.mjs";

const defaultAppDir = appWorkspacePath;
const defaultDistDir = appWorkspaceAbsolutePath("dist");
const defaultStaticDir = repositoryPath(rootStaticAssetsPath);

export const directoryCopies = [
    {
        destination: appAlternativeFitViewPath,
        source: appAlternativeFitViewPath,
        sourceRoot: "static",
    },
    {
        destination: appIconsPath,
        source: appIconsPath,
        sourceRoot: "static",
    },
];
export const fileCopies = [
    {
        destination: appElevProfileCssPath,
        source: path.posix.join("app", appElevProfileCssPath),
        sourceRoot: "static",
    },
    {
        destination: appStyleCssPath,
        source: path.posix.join("app", appStyleCssPath),
        sourceRoot: "static",
    },
];

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

function resolveCopySource({ appDir, copy, staticDir }) {
    if (copy.sourceRoot === "app") {
        return path.join(appDir, copy.source);
    }

    if (copy.sourceRoot === "static") {
        return path.join(staticDir, copy.source);
    }

    throw new Error(`Unknown runtime asset source root: ${copy.sourceRoot}`);
}

function copyDirectory(appDir, distDir, staticDir, copy) {
    const source = resolveCopySource({ appDir, copy, staticDir });
    const destination = path.join(distDir, copy.destination);

    if (!fs.existsSync(source)) {
        return;
    }

    assertInsideAppDir(appDir, destination);
    fs.cpSync(source, destination, { force: true, recursive: true });
}

function copyFile(appDir, distDir, staticDir, copy) {
    const source = resolveCopySource({ appDir, copy, staticDir });
    const destination = path.join(distDir, copy.destination);

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

function copyIndexHtml(appDir, distDir, staticDir) {
    const source = path.join(staticDir, "app", appIndexHtmlPath);
    const destination = path.join(distDir, appIndexHtmlPath);
    const html = fs.readFileSync(source, "utf8");

    assertNoNodeModulesReference(appDir, source, html);
    assertInsideAppDir(appDir, destination);
    fs.writeFileSync(destination, html);
    assertNoNodeModulesReference(appDir, destination, html);
}

export function prepareRuntimeDist({
    appDir = defaultAppDir,
    distDir = defaultDistDir,
    staticDir = defaultStaticDir,
} = {}) {
    fs.mkdirSync(distDir, { recursive: true });
    copyIndexHtml(appDir, distDir, staticDir);
    for (const copy of directoryCopies) {
        copyDirectory(appDir, distDir, staticDir, copy);
    }
    for (const copy of fileCopies) {
        copyFile(appDir, distDir, staticDir, copy);
    }
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    prepareRuntimeDist();
}
