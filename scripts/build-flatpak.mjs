import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const electronAppDir = path.join(repoRoot, "electron-app");

function assertInsideElectronApp(targetPath) {
    const relativePath = path.relative(
        electronAppDir,
        path.resolve(targetPath)
    );

    if (
        relativePath === "" ||
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error(
            `Refusing to operate outside electron-app: ${targetPath}`
        );
    }
}

function run(command, args) {
    execFileSync(command, args, {
        cwd: electronAppDir,
        env: process.env,
        stdio: "inherit",
    });
}

const flatpakRepoDir = path.join(electronAppDir, "flatpak-repo");
const buildDir = path.join(electronAppDir, "build-dir");
const bundlePath = path.join(electronAppDir, "FitFileViewer.flatpak");

assertInsideElectronApp(flatpakRepoDir);
assertInsideElectronApp(buildDir);
assertInsideElectronApp(bundlePath);

function buildFlatpak() {
    fs.rmSync(flatpakRepoDir, { force: true, recursive: true });
    fs.rmSync(buildDir, { force: true, recursive: true });
    fs.rmSync(bundlePath, { force: true });

    run("flatpak-builder", [
        "--repo=flatpak-repo",
        "--force-clean",
        "build-dir",
        "flatpak-build.yml",
    ]);

    run("flatpak", [
        "build-bundle",
        "flatpak-repo",
        "FitFileViewer.flatpak",
        "com.nick2bad4u.fitfileviewer",
    ]);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    buildFlatpak();
}
