import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const repositoryRoot = resolveRepositoryRoot();

export const cleanupTargets = [
    ".cache",
    ".stylelintcache",
    path.join("docusaurus", ".docusaurus"),
    path.join("docusaurus", "build"),
    path.join("docusaurus", "docs", "api"),
    path.join("docusaurus", "static", "favicon.ico"),
    path.join("docusaurus", "static", "img", "favicon.ico"),
    path.join("docusaurus", "static", "img", "screenshots", "ChartsV3.png"),
    path.join("docusaurus", "static", "img", "screenshots", "DataV2.png"),
    path.join("docusaurus", "static", "img", "screenshots", "MapsV2.png"),
    "FitFileViewer.flatpak",
    "FitFileViewer.flatpak.zip",
    "flatpak-build-dir",
    "flatpak-repo",
    "html",
    "playwright-report",
    "test-results",
    path.join("electron-app", "dist"),
    path.join("electron-app", "html"),
    path.join("electron-app", "logs"),
    path.join("electron-app", "release"),
    path.join("electron-app", "temp-win7"),
    path.join("electron-app", "test-results"),
    path.join("electron-app", "types"),
];

export function cleanWorkspace(
    root = repositoryRoot,
    targets = cleanupTargets
) {
    const removedTargets = [];

    for (const relativeTarget of targets) {
        const targetPath = path.join(root, relativeTarget);
        assertInsideRepository(root, targetPath);

        if (fs.existsSync(targetPath)) {
            fs.rmSync(targetPath, { force: true, recursive: true });
            removedTargets.push(relativeTarget);
        }
    }

    return removedTargets;
}

function assertInsideRepository(root, targetPath) {
    const relativePath = path.relative(root, path.resolve(targetPath));

    if (
        relativePath === "" ||
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error(`Refusing to remove outside repository: ${targetPath}`);
    }
}

function printCleanupResult(removedTargets) {
    if (removedTargets.length > 0) {
        console.log(
            `[clean-workspace] Removed generated paths: ${removedTargets.join(", ")}`
        );
    } else {
        console.log("[clean-workspace] No generated paths to remove.");
    }
}

function resolveRepositoryRoot() {
    try {
        return fileURLToPath(new URL("..", import.meta.url));
    } catch {
        return process.cwd();
    }
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    printCleanupResult(cleanWorkspace());
}
