import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    repositoryPath,
    repositoryRoot,
    rootFlatpakBuildPath,
    rootFlatpakBundlePath,
    rootFlatpakManifestPath,
    rootFlatpakRepoPath,
} from "./lib/workspaces.mjs";

export const flatpakRepoDir = repositoryPath(rootFlatpakRepoPath);
export const flatpakBuildDir = repositoryPath(rootFlatpakBuildPath);
export const flatpakBundlePath = repositoryPath(rootFlatpakBundlePath);

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
            `--repo=${rootFlatpakRepoPath}`,
            "--force-clean",
            rootFlatpakBuildPath,
            rootFlatpakManifestPath,
        ],
        commandRunner
    );

    run(
        "flatpak",
        [
            "build-bundle",
            rootFlatpakRepoPath,
            rootFlatpakBundlePath,
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
