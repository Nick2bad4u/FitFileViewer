import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function assertInsideRepo(targetPath) {
    const relativePath = path.relative(repoRoot, path.resolve(targetPath));

    if (
        relativePath === "" ||
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error(`Refusing to operate outside repo root: ${targetPath}`);
    }
}

function run(command, args) {
    execFileSync(command, args, {
        cwd: repoRoot,
        env: process.env,
        stdio: "inherit",
    });
}

const flatpakRepoDir = path.join(repoRoot, "flatpak-repo");
const buildDir = path.join(repoRoot, "flatpak-build-dir");
const bundlePath = path.join(repoRoot, "FitFileViewer.flatpak");

assertInsideRepo(flatpakRepoDir);
assertInsideRepo(buildDir);
assertInsideRepo(bundlePath);

function buildFlatpak() {
    fs.rmSync(flatpakRepoDir, { force: true, recursive: true });
    fs.rmSync(buildDir, { force: true, recursive: true });
    fs.rmSync(bundlePath, { force: true });

    run("flatpak-builder", [
        "--repo=flatpak-repo",
        "--force-clean",
        "flatpak-build-dir",
        "flatpak-build.yml",
    ]);

    run("flatpak", [
        "build-bundle",
        "flatpak-repo",
        "FitFileViewer.flatpak",
        "com.nick2bad4u.fitfileviewer",
    ]);
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    buildFlatpak();
}
