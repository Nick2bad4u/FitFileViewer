import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { readInlineOptionValue, readOptionValue } from "./lib/cli-options.mjs";
import { rootReleaseDistPath } from "./lib/workspaces.mjs";

export const defaultReleaseDistDirectory = rootReleaseDistPath;

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
        printUsage();
    } else {
        const summaries = fixLatestYmlSha512(options.releaseDistDirectory);

        if (summaries.length === 0) {
            console.log("[fix-latest-yml-sha512] No latest*.yml files found.");
        } else {
            for (const summary of summaries) {
                console.log(
                    `[fix-latest-yml-sha512] ${summary.file}: ${summary.fileCount} files, ${summary.updatedCount} updated, ${summary.missingCount} missing`
                );
            }
        }
    }
}

export function fixLatestYmlSha512(
    releaseDistDirectory = defaultReleaseDistDirectory
) {
    const summaries = [];

    if (!fs.existsSync(releaseDistDirectory)) {
        return summaries;
    }

    const artifactFilesByName = indexArtifactFilesByName(releaseDistDirectory);
    for (const latestYmlFile of findLatestYmlFiles(releaseDistDirectory)) {
        summaries.push(
            updateLatestYmlSha512(latestYmlFile, artifactFilesByName)
        );
    }

    return summaries;
}

export function findLatestYmlFiles(rootDirectory) {
    const latestYmlFiles = [];

    if (!fs.existsSync(rootDirectory)) {
        return latestYmlFiles;
    }

    for (const entry of fs.readdirSync(rootDirectory, {
        withFileTypes: true,
    })) {
        const entryPath = path.join(rootDirectory, entry.name);

        if (entry.isDirectory()) {
            latestYmlFiles.push(...findLatestYmlFiles(entryPath));
            continue;
        }

        if (entry.isFile() && /^latest.*\.yml$/u.test(entry.name)) {
            latestYmlFiles.push(entryPath);
        }
    }

    return latestYmlFiles.sort((left, right) => left.localeCompare(right));
}

export function parseArgs(args) {
    const options = {
        help: false,
        releaseDistDirectory: defaultReleaseDistDirectory,
    };

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];

        if (arg === "--help" || arg === "-h") {
            options.help = true;
            continue;
        }

        if (arg === "--release-dist-directory") {
            options.releaseDistDirectory = readOptionValue(
                args,
                index,
                "--release-dist-directory"
            );
            index += 1;
            continue;
        }

        if (arg.startsWith("--release-dist-directory=")) {
            options.releaseDistDirectory = readInlineOptionValue(
                arg,
                "--release-dist-directory"
            );
            continue;
        }

        throw new Error(`Unknown option: ${arg}`);
    }

    return options;
}

export function toSha512Base64(filePath) {
    return crypto
        .createHash("sha512")
        .update(fs.readFileSync(filePath))
        .digest("base64");
}

export function updateLatestYmlSha512(
    latestYmlFile,
    artifactFilesByName = new Map()
) {
    const directory = path.dirname(latestYmlFile);
    const lines = fs.readFileSync(latestYmlFile, "utf8").split(/\r?\n/u);
    const hasTrailingNewline = lines.at(-1) === "";
    const outputLines = [];
    let fileCount = 0;
    let firstFilePath = "";
    let firstFileSha512 = "";
    let inFilesSection = false;
    let missingCount = 0;
    let updatedCount = 0;
    let currentUrl = "";

    for (const line of hasTrailingNewline ? lines.slice(0, -1) : lines) {
        if (/^\s*files:/u.test(line)) {
            inFilesSection = true;
            outputLines.push(line);
            continue;
        }

        if (inFilesSection) {
            const urlMatch = line.match(/^\s*-\s*url:\s*(.*)$/u);

            if (urlMatch) {
                currentUrl = urlMatch[1] ?? "";
                outputLines.push(`  - url: ${currentUrl}`);
                fileCount += 1;
                continue;
            }

            if (/^\s*sha512:\s*/u.test(line) && currentUrl) {
                const directFilePath = path.join(directory, currentUrl);
                const recursiveMatches =
                    artifactFilesByName.get(path.basename(currentUrl)) ?? [];
                const filePath = fs.existsSync(directFilePath)
                    ? directFilePath
                    : recursiveMatches.length === 1
                      ? recursiveMatches[0]
                      : null;

                if (filePath) {
                    const sha512 = toSha512Base64(filePath);

                    outputLines.push(`    sha512: ${sha512}`);
                    if (!firstFileSha512) {
                        firstFileSha512 = sha512;
                        firstFilePath = currentUrl;
                    }
                    updatedCount += 1;
                } else {
                    outputLines.push("    sha512: ");
                    missingCount += 1;
                }

                currentUrl = "";
                continue;
            }

            if (/^\s*size:\s*/u.test(line)) {
                outputLines.push(`    ${line.trimStart()}`);
                continue;
            }

            if (/^\s*path:\s/u.test(line)) {
                inFilesSection = false;
                outputLines.push(
                    firstFilePath ? `path: ${firstFilePath}` : line
                );
                continue;
            }

            if (/^\s*sha512:\s/u.test(line)) {
                inFilesSection = false;
                outputLines.push(
                    firstFileSha512 ? `sha512: ${firstFileSha512}` : line
                );
                continue;
            }

            if (/^\s*releaseDate:\s/u.test(line)) {
                inFilesSection = false;
                outputLines.push(line);
                continue;
            }

            outputLines.push(line);
            continue;
        }

        if (/^path:\s/u.test(line)) {
            outputLines.push(firstFilePath ? `path: ${firstFilePath}` : line);
            continue;
        }

        if (/^sha512:\s/u.test(line)) {
            outputLines.push(
                firstFileSha512 ? `sha512: ${firstFileSha512}` : line
            );
            continue;
        }

        outputLines.push(line);
    }

    fs.writeFileSync(
        latestYmlFile,
        `${outputLines.join("\n")}${hasTrailingNewline ? "\n" : ""}`
    );

    return {
        file: normalizePath(latestYmlFile),
        fileCount,
        missingCount,
        updatedCount,
    };
}

function indexArtifactFilesByName(rootDirectory) {
    const filesByName = new Map();

    function visit(directory) {
        for (const entry of fs.readdirSync(directory, {
            withFileTypes: true,
        })) {
            const entryPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                visit(entryPath);
                continue;
            }
            if (!entry.isFile()) {
                continue;
            }

            const paths = filesByName.get(entry.name) ?? [];
            paths.push(entryPath);
            filesByName.set(entry.name, paths);
        }
    }

    visit(rootDirectory);
    return filesByName;
}

function normalizePath(filePath) {
    return filePath.split(path.sep).join("/");
}

function printUsage() {
    console.log(`Usage: node scripts/fix-latest-yml-sha512.mjs [options]

Options:
  --release-dist-directory <path>  Release distributables directory. Defaults to release-dist.
  -h, --help                       Show this help text.`);
}
