import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { repositoryRoot } from "./lib/workspaces.mjs";

export const distributableExtensions = new Set([
    ".7z",
    ".AppImage",
    ".apk",
    ".blockmap",
    ".deb",
    ".dmg",
    ".exe",
    ".flatpak",
    ".freebsd",
    ".mas",
    ".msi",
    ".nupkg",
    ".p5p",
    ".pacman",
    ".pkg",
    ".rpm",
    ".snap",
    ".tar.bz2",
    ".tar.gz",
    ".tar.xz",
    ".yml",
    ".zip",
]);

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
        printUsage();
    } else {
        printDistributableHashes(options.directory);
    }
}

export function findDistributableFiles(rootDirectory) {
    if (!fs.existsSync(rootDirectory)) {
        return [];
    }

    const files = [];
    const pendingDirectories = [path.resolve(rootDirectory)];

    while (pendingDirectories.length > 0) {
        const directory = pendingDirectories.pop();

        for (const entry of fs.readdirSync(directory, {
            withFileTypes: true,
        })) {
            const entryPath = path.join(directory, entry.name);

            if (entry.isDirectory()) {
                pendingDirectories.push(entryPath);
            } else if (entry.isFile() && isDistributableFile(entry.name)) {
                files.push(entryPath);
            }
        }
    }

    return files.sort((left, right) => left.localeCompare(right));
}

export function formatHashLine(filePath, baseDirectory = repositoryRoot) {
    const displayPath = path.relative(baseDirectory, filePath) || filePath;
    const hash = crypto.createHash("sha512");

    hash.update(fs.readFileSync(filePath));

    return `${normalizeDisplayPath(displayPath)}: ${hash.digest("base64")}`;
}

export function isDistributableFile(fileName) {
    return [...distributableExtensions].some((extension) =>
        fileName.endsWith(extension)
    );
}

export function parseArgs(args) {
    const options = {
        directory: undefined,
        help: false,
    };

    for (const arg of args) {
        if (arg === "--help" || arg === "-h") {
            options.help = true;
            continue;
        }

        if (options.directory === undefined) {
            options.directory = arg;
            continue;
        }

        throw new Error(`Unknown option: ${arg}`);
    }

    if (!options.help && !options.directory) {
        throw new Error("A directory argument is required");
    }

    return options;
}

export function printDistributableHashes(rootDirectory, logger = console.log) {
    const files = findDistributableFiles(rootDirectory);

    if (files.length === 0) {
        logger(
            `[print-distributable-hashes] No distributable files found under ${rootDirectory}.`
        );
        return [];
    }

    const rootPath = path.resolve(rootDirectory);
    const lines = files.map((filePath) => formatHashLine(filePath, rootPath));

    for (const line of lines) {
        logger(line);
    }

    return lines;
}

function normalizeDisplayPath(displayPath) {
    return displayPath.split(path.sep).join("/");
}

function printUsage() {
    console.log(`Usage: node scripts/print-distributable-hashes.mjs <directory>

Print SHA-512 hashes for known distributable artifact file types.

Options:
  -h, --help  Show this help text.`);
}
