import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { readInlineOptionValue, readOptionValue } from "./lib/cli-options.mjs";
import { rootArtifactsPath, rootReleaseDistPath } from "./lib/workspaces.mjs";

export const defaultArtifactsDirectory = rootArtifactsPath;
export const defaultOutputDirectory = rootReleaseDistPath;
export const artifactSubdirectories = [
    "nsis-web",
    "squirrel-windows",
    "squirrel-windows-ia32",
];

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
        printUsage();
    } else {
        const result = organizeDistributables(options);

        console.log(
            `[organize-distributables] Copied ${result.copiedFiles.length} files and ${result.copiedDirectories.length} directories into ${options.outputDirectory}.`
        );
    }
}

export function getArtifactPlatformArch(artifactDirectoryName) {
    return artifactDirectoryName.startsWith("dist-")
        ? artifactDirectoryName.slice("dist-".length)
        : "";
}

export function isTopLevelDistributable(fileName) {
    return (
        fileName.startsWith("Fit-File-Viewer-") ||
        fileName.startsWith("fitfileviewer-") ||
        fileName.endsWith(".yml")
    );
}

export function hasUniversalMacZip(topLevelDistributableEntries) {
    return topLevelDistributableEntries.some(
        (entry) =>
            entry.isFile() &&
            /^Fit-File-Viewer-darwin-universal-.+\.zip$/u.test(entry.name)
    );
}

export function organizeDistributables(options = {}) {
    const artifactsDirectory =
        options.artifactsDirectory ?? defaultArtifactsDirectory;
    const outputDirectory = options.outputDirectory ?? defaultOutputDirectory;
    const copiedDirectories = [];
    const copiedFiles = [];
    const processedArtifacts = [];

    if (!fs.existsSync(artifactsDirectory)) {
        return {
            copiedDirectories,
            copiedFiles,
            processedArtifacts,
        };
    }

    const artifactEntries = fs
        .readdirSync(artifactsDirectory, {
            withFileTypes: true,
        })
        .filter(
            (entry) => entry.isDirectory() && entry.name.startsWith("dist-")
        );

    if (artifactEntries.length === 0) {
        return {
            copiedDirectories,
            copiedFiles,
            processedArtifacts,
        };
    }

    const artifactsToProcess = artifactEntries
        .map((entry) => {
            const artifactDirectory = path.join(artifactsDirectory, entry.name);
            const childEntries = fs.readdirSync(artifactDirectory, {
                withFileTypes: true,
            });
            const topLevelDistributableEntries = childEntries.filter(
                (childEntry) =>
                    childEntry.isFile() &&
                    isTopLevelDistributable(childEntry.name)
            );
            const updaterSubdirectories = artifactSubdirectories.filter(
                (subdirectory) =>
                    childEntries.some(
                        (childEntry) =>
                            childEntry.isDirectory() &&
                            childEntry.name === subdirectory
                    )
            );

            return {
                artifactDirectory,
                entry,
                topLevelDistributableEntries,
                updaterSubdirectories,
            };
        })
        .filter(
            ({ topLevelDistributableEntries, updaterSubdirectories }) =>
                topLevelDistributableEntries.length > 0 ||
                updaterSubdirectories.length > 0
        );

    if (artifactsToProcess.length === 0) {
        return {
            copiedDirectories,
            copiedFiles,
            processedArtifacts,
        };
    }

    fs.mkdirSync(outputDirectory, { recursive: true });

    for (const {
        artifactDirectory,
        entry,
        topLevelDistributableEntries,
        updaterSubdirectories,
    } of artifactsToProcess) {
        const platformArch = getArtifactPlatformArch(entry.name);
        const platformOutputDirectory = path.join(
            outputDirectory,
            platformArch
        );

        fs.mkdirSync(platformOutputDirectory, { recursive: true });
        processedArtifacts.push(normalizePath(artifactDirectory));

        for (const childEntry of topLevelDistributableEntries) {
            const sourcePath = path.join(artifactDirectory, childEntry.name);
            const destinationPath = path.join(
                platformOutputDirectory,
                childEntry.name
            );

            fs.copyFileSync(sourcePath, destinationPath);
            copiedFiles.push({
                from: normalizePath(sourcePath),
                to: normalizePath(destinationPath),
            });
        }

        const latestMacPath = path.join(artifactDirectory, "latest-mac.yml");
        if (fs.existsSync(latestMacPath)) {
            const renamedLatestMacPath = path.join(
                platformOutputDirectory,
                `latest-${platformArch}.yml`
            );

            fs.copyFileSync(latestMacPath, renamedLatestMacPath);
            copiedFiles.push({
                from: normalizePath(latestMacPath),
                to: normalizePath(renamedLatestMacPath),
            });

            if (hasUniversalMacZip(topLevelDistributableEntries)) {
                const canonicalLatestMacPath = path.join(
                    outputDirectory,
                    "latest-mac.yml"
                );

                fs.copyFileSync(latestMacPath, canonicalLatestMacPath);
                copiedFiles.push({
                    from: normalizePath(latestMacPath),
                    to: normalizePath(canonicalLatestMacPath),
                });
            }

            fs.rmSync(latestMacPath, { force: true });
        }

        for (const subdirectory of updaterSubdirectories) {
            const sourcePath = path.join(artifactDirectory, subdirectory);
            const destinationPath = path.join(
                platformOutputDirectory,
                subdirectory
            );

            fs.cpSync(sourcePath, destinationPath, {
                force: true,
                recursive: true,
            });
            copiedDirectories.push({
                from: normalizePath(sourcePath),
                to: normalizePath(destinationPath),
            });
        }

        fs.rmSync(path.join(platformOutputDirectory, "latest-mac.yml"), {
            force: true,
        });
    }

    return {
        copiedDirectories,
        copiedFiles,
        processedArtifacts,
    };
}

export function parseArgs(args) {
    const options = {
        artifactsDirectory: defaultArtifactsDirectory,
        help: false,
        outputDirectory: defaultOutputDirectory,
    };

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];

        if (arg === "--artifacts-directory") {
            options.artifactsDirectory = readOptionValue(
                args,
                index,
                "--artifacts-directory"
            );
            index += 1;
            continue;
        }

        if (arg.startsWith("--artifacts-directory=")) {
            options.artifactsDirectory = readInlineOptionValue(
                arg,
                "--artifacts-directory"
            );
            continue;
        }

        if (arg === "--help" || arg === "-h") {
            options.help = true;
            continue;
        }

        if (arg === "--output-directory") {
            options.outputDirectory = readOptionValue(
                args,
                index,
                "--output-directory"
            );
            index += 1;
            continue;
        }

        if (arg.startsWith("--output-directory=")) {
            options.outputDirectory = readInlineOptionValue(
                arg,
                "--output-directory"
            );
            continue;
        }

        throw new Error(`Unknown option: ${arg}`);
    }

    return options;
}

function normalizePath(filePath) {
    return filePath.split(path.sep).join("/");
}

function printUsage() {
    console.log(`Usage: node scripts/organize-distributables.mjs [options]

Options:
  --artifacts-directory <path>  Artifacts directory. Defaults to artifacts.
  --output-directory <path>     Output directory. Defaults to release-dist.
  -h, --help                    Show this help text.`);
}
