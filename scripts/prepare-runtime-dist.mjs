import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
    appAlternativeFitViewPath,
    appElevProfileCssPath,
    appIconsPath,
    appIndexHtmlPath,
    appStyleCssPath,
    repositoryRoot,
    rootAlternativeFitViewPath,
    rootAppElevProfileCssPath,
    rootAppIconsPath,
    rootAppIndexHtmlPath,
    rootAppStyleCssPath,
    rootRuntimeDistAbsolutePath,
} from "./lib/workspaces.mjs";

const defaultRepositoryDir = repositoryRoot;
const defaultDistDir = rootRuntimeDistAbsolutePath;
const defaultStaticDir = repositoryRoot;
const runtimeTextAssetExtensions = new Set([
    ".css",
    ".html",
    ".js",
    ".json",
    ".mjs",
    ".svg",
]);
const repositoryVendorReferencePattern = /(?:^|[\\/("'`=\s])vendor[\\/]/u;

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

    assertNoForbiddenRuntimeReferencesInDirectory(staticRootDir, source);
    assertInsideDirectory(distDir, destination);
    fs.cpSync(source, destination, { force: true, recursive: true });
}

function copyFile(distDir, staticRootDir, copy) {
    const source = path.join(staticRootDir, copy.source);
    const destination = path.join(distDir, copy.destination);

    if (!fs.existsSync(source)) {
        return;
    }

    assertNoForbiddenRuntimeReferences(staticRootDir, source);
    assertInsideDirectory(distDir, destination);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
}

function assertNoForbiddenRuntimeReferences(repositoryDir, filePath) {
    if (!runtimeTextAssetExtensions.has(path.extname(filePath))) {
        return;
    }

    const content = fs.readFileSync(filePath, "utf8");
    const repositoryRelativePath = path
        .relative(repositoryDir, filePath)
        .replaceAll(path.sep, path.posix.sep);

    if (content.includes("node_modules")) {
        throw new Error(
            `${repositoryRelativePath} must not reference node_modules directly`
        );
    }
    if (repositoryVendorReferencePattern.test(content)) {
        throw new Error(
            `${repositoryRelativePath} must not reference repository vendor assets directly`
        );
    }
}

function assertNoForbiddenRuntimeReferencesInDirectory(repositoryDir, dirPath) {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
        const entryPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            assertNoForbiddenRuntimeReferencesInDirectory(
                repositoryDir,
                entryPath
            );
            continue;
        }
        if (entry.isFile()) {
            assertNoForbiddenRuntimeReferences(repositoryDir, entryPath);
        }
    }
}

function copyIndexHtml(repositoryDir, distDir, staticDir) {
    const source = path.join(staticDir, rootAppIndexHtmlPath);
    const destination = path.join(distDir, appIndexHtmlPath);

    assertNoForbiddenRuntimeReferences(repositoryDir, source);
    assertInsideDirectory(distDir, destination);
    fs.copyFileSync(source, destination);
    assertNoForbiddenRuntimeReferences(repositoryDir, destination);
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
