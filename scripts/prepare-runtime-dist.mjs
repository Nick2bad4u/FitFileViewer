import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
    appAlternativeFitViewPath,
    appElevProfileCssPath,
    appIconsPath,
    appIndexHtmlPath,
    appStyleCssPath,
    appDistAbsolutePath,
    repositoryRoot,
    rootAlternativeFitViewPath,
    rootAppElevProfileCssPath,
    rootAppIconsPath,
    rootAppIndexHtmlPath,
    rootAppStyleCssPath,
} from "./lib/workspaces.mjs";

const defaultRepositoryDir = repositoryRoot;
const defaultDistDir = appDistAbsolutePath;
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

function assertInsideDirectory(rootDir, targetPath) {
    const resolvedRoot = path.resolve(rootDir);
    const resolvedTarget = path.resolve(targetPath);
    const relativePath = path.relative(resolvedRoot, resolvedTarget);

    if (
        relativePath === "" ||
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error(
            `Refusing to operate outside ${resolvedRoot}: ${targetPath}`
        );
    }
}

function copyDirectory(distDir, staticRootDir, copy) {
    const source = path.join(staticRootDir, copy.source);
    const destination = path.join(distDir, copy.destination);

    if (!fs.existsSync(source)) {
        return;
    }

    assertInsideDirectory(distDir, destination);
    fs.cpSync(source, destination, { force: true, recursive: true });
}

function copyFile(distDir, staticRootDir, copy) {
    const source = path.join(staticRootDir, copy.source);
    const destination = path.join(distDir, copy.destination);

    if (!fs.existsSync(source)) {
        return;
    }

    assertInsideDirectory(distDir, destination);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
}

function assertNoNodeModulesReference(repositoryDir, filePath, content) {
    if (content.includes("node_modules")) {
        throw new Error(
            `${path.relative(repositoryDir, filePath)} must not reference node_modules directly`
        );
    }
}

function copyIndexHtml(repositoryDir, distDir, staticDir) {
    const source = path.join(staticDir, rootAppIndexHtmlPath);
    const destination = path.join(distDir, appIndexHtmlPath);
    const html = fs.readFileSync(source, "utf8");

    assertNoNodeModulesReference(repositoryDir, source, html);
    assertInsideDirectory(distDir, destination);
    fs.writeFileSync(destination, html);
    assertNoNodeModulesReference(repositoryDir, destination, html);
}

export function prepareRuntimeDist({
    distDir = defaultDistDir,
    repositoryDir = defaultRepositoryDir,
    staticDir = defaultStaticDir,
} = {}) {
    assertInsideDirectory(repositoryDir, distDir);
    fs.mkdirSync(distDir, { recursive: true });
    copyIndexHtml(repositoryDir, distDir, staticDir);
    for (const copy of directoryCopies) {
        copyDirectory(distDir, staticDir, copy);
    }
    for (const copy of fileCopies) {
        copyFile(distDir, staticDir, copy);
    }
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    prepareRuntimeDist();
}
