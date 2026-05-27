import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { repositoryPath, repositoryRoot } from "./lib/workspaces.mjs";

export const flatpakRepoDir = repositoryPath("flatpak-repo");
export const flatpakBuildDir = repositoryPath("flatpak-build-dir");
export const flatpakBundlePath = repositoryPath("FitFileViewer.flatpak");

export function assertInsideRepo(targetPath, root = repositoryRoot) {
    const relativePath = path.relative(root, path.resolve(targetPath));

    if (
        relativePath === "" ||
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error(`Refusing to operate outside repo root: ${targetPath}`);
    }
}

function run(command, args, commandRunner = execFileSync) {
    commandRunner(command, args, {
        cwd: repositoryRoot,
        env: process.env,
        stdio: "inherit",
    });
}

export function buildFlatpak({
    commandRunner = execFileSync,
    fileSystem = fs,
} = {}) {
    assertInsideRepo(flatpakRepoDir);
    assertInsideRepo(flatpakBuildDir);
    assertInsideRepo(flatpakBundlePath);

    fileSystem.rmSync(flatpakRepoDir, { force: true, recursive: true });
    fileSystem.rmSync(flatpakBuildDir, { force: true, recursive: true });
    fileSystem.rmSync(flatpakBundlePath, { force: true });

    run(
        "flatpak-builder",
        [
            "--repo=flatpak-repo",
            "--force-clean",
            "flatpak-build-dir",
            "flatpak-build.yml",
        ],
        commandRunner
    );

    run(
        "flatpak",
        [
            "build-bundle",
            "flatpak-repo",
            "FitFileViewer.flatpak",
            "com.nick2bad4u.fitfileviewer",
        ],
        commandRunner
    );
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    buildFlatpak();
}
