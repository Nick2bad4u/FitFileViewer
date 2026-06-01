import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
    appAlternativeFitViewPath,
    appElevProfileCssPath,
    appIconsPath,
    appIndexHtmlPath,
    appStyleCssPath,
    appSourceAbsolutePath,
    appSourcePath,
    repositoryRoot,
    rootAlternativeFitViewPath,
    rootAppElevProfileCssPath,
    rootAppIconsPath,
    rootAppIndexHtmlPath,
    rootAppStyleCssPath,
} from "./lib/workspaces.mjs";

const defaultAppDir = appSourcePath;
const defaultDistDir = appSourceAbsolutePath("dist");
const defaultStaticDir = repositoryRoot;

export const directoryCopies = [
    {
        destination: appAlternativeFitViewPath,
        source: rootAlternativeFitViewPath,
    },
    {
        destination: appIconsPath,
        source: rootAppIconsPath,
    },
];
export const fileCopies = [
    {
        destination: appElevProfileCssPath,
        source: rootAppElevProfileCssPath,
    },
    {
        destination: appStyleCssPath,
        source: rootAppStyleCssPath,
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

function copyDirectory(appDir, distDir, staticRootDir, copy) {
    const source = path.join(staticRootDir, copy.source);
    const destination = path.join(distDir, copy.destination);

    if (!fs.existsSync(source)) {
        return;
    }

    assertInsideAppDir(appDir, destination);
    fs.cpSync(source, destination, { force: true, recursive: true });
}

function copyFile(appDir, distDir, staticRootDir, copy) {
    const source = path.join(staticRootDir, copy.source);
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
    const source = path.join(staticDir, rootAppIndexHtmlPath);
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
    assertInsideAppDir(appDir, distDir);
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
