import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

export const defaultReleaseDistDirectory = "release-dist";

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
        printUsage();
    } else {
        console.log(createReleaseDistFileReport(options.releaseDistDirectory));
    }
}

export function findDuplicateFilePaths(filePaths) {
    const counts = new Map();

    for (const filePath of filePaths) {
        counts.set(filePath, (counts.get(filePath) ?? 0) + 1);
    }

    return [...counts]
        .filter(([, count]) => count > 1)
        .map(([filePath]) => filePath)
        .sort((left, right) => left.localeCompare(right));
}

export function listReleaseDistFiles(
    releaseDistDirectory = defaultReleaseDistDirectory
) {
    if (!fs.existsSync(releaseDistDirectory)) {
        return [];
    }

    const files = [];

    for (const entry of fs.readdirSync(releaseDistDirectory, {
        withFileTypes: true,
    })) {
        const entryPath = path.join(releaseDistDirectory, entry.name);

        if (entry.isDirectory()) {
            files.push(...listReleaseDistFiles(entryPath));
            continue;
        }

        if (entry.isFile()) {
            files.push(normalizePath(entryPath));
        }
    }

    return files.sort((left, right) => left.localeCompare(right));
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

export function createReleaseDistFileReport(
    releaseDistDirectory = defaultReleaseDistDirectory
) {
    const filePaths = listReleaseDistFiles(releaseDistDirectory);
    const duplicateFilePaths = findDuplicateFilePaths(filePaths);
    const lines = [
        `Listing all files in ${releaseDistDirectory} before deduplication:`,
        ...filePaths,
        "",
        `Deduplicating files in ${releaseDistDirectory}...`,
        ...duplicateFilePaths.map((filePath) => `Duplicate file: ${filePath}`),
        "",
        `Final file list in ${releaseDistDirectory}:`,
        ...filePaths,
    ];

    return lines.join("\n");
}

function normalizePath(filePath) {
    return filePath.split(path.sep).join("/");
}

function printUsage() {
    console.log(`Usage: node scripts/list-release-dist-files.mjs [options]

Options:
  --release-dist-directory <path>  Release distributables directory. Defaults to release-dist.
  -h, --help                       Show this help text.`);
}

function readInlineOptionValue(arg, optionName) {
    const value = arg.slice(`${optionName}=`.length);

    if (!value) {
        throw new Error(`${optionName} requires a value`);
    }

    return value;
}

function readOptionValue(args, index, optionName) {
    const value = args[index + 1];

    if (!value || value.startsWith("-")) {
        throw new Error(`${optionName} requires a value`);
    }

    return value;
}
