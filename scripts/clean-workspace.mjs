import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const cleanupTargets = [
    ".cache",
    path.join("docusaurus", ".docusaurus"),
    path.join("docusaurus", "build"),
    path.join("docusaurus", "docs", "api"),
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

function assertInsideRepository(targetPath) {
    const relativePath = path.relative(
        repositoryRoot,
        path.resolve(targetPath)
    );

    if (
        relativePath === "" ||
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error(`Refusing to remove outside repository: ${targetPath}`);
    }
}

const removedTargets = [];
for (const relativeTarget of cleanupTargets) {
    const targetPath = path.join(repositoryRoot, relativeTarget);
    assertInsideRepository(targetPath);

    if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { force: true, recursive: true });
        removedTargets.push(relativeTarget);
    }
}

if (removedTargets.length > 0) {
    console.log(
        `[clean-workspace] Removed generated paths: ${removedTargets.join(", ")}`
    );
} else {
    console.log("[clean-workspace] No generated paths to remove.");
}
