import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

export const defaultSquirrelWin32Directory = path.join(
    "release-dist",
    "windows-latest-ia32",
    "squirrel-windows-ia32"
);

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
        printUsage();
    } else {
        const renamedFiles = renameSquirrelWin32ReleaseAssets(
            options.squirrelDirectory
        );

        if (renamedFiles.length === 0) {
            console.log(
                "[rename-squirrel-win32-release-assets] No files renamed."
            );
        } else {
            for (const renamedFile of renamedFiles) {
                console.log(
                    `[rename-squirrel-win32-release-assets] Renamed ${renamedFile.from} -> ${renamedFile.to}`
                );
            }
        }
    }
}

export function getWin32NupkgFileName(fileName) {
    if (
        !/^fitfileviewer-.+-full\.nupkg$/u.test(fileName) ||
        fileName.endsWith("-win32-full.nupkg")
    ) {
        return "";
    }

    return fileName.replace(/-full\.nupkg$/u, "-win32-full.nupkg");
}

export function parseArgs(args) {
    const options = {
        help: false,
        squirrelDirectory: defaultSquirrelWin32Directory,
    };

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];

        if (arg === "--help" || arg === "-h") {
            options.help = true;
            continue;
        }

        if (arg === "--squirrel-directory") {
            options.squirrelDirectory = readOptionValue(
                args,
                index,
                "--squirrel-directory"
            );
            index += 1;
            continue;
        }

        if (arg.startsWith("--squirrel-directory=")) {
            options.squirrelDirectory = readInlineOptionValue(
                arg,
                "--squirrel-directory"
            );
            continue;
        }

        throw new Error(`Unknown option: ${arg}`);
    }

    return options;
}

export function renameSquirrelWin32ReleaseAssets(
    squirrelDirectory = defaultSquirrelWin32Directory
) {
    const renamedFiles = [];

    if (!fs.existsSync(squirrelDirectory)) {
        return renamedFiles;
    }

    for (const entry of fs.readdirSync(squirrelDirectory, {
        withFileTypes: true,
    })) {
        if (!entry.isFile()) {
            continue;
        }

        const renamedNupkgFileName = getWin32NupkgFileName(entry.name);

        if (!renamedNupkgFileName) {
            continue;
        }

        renamedFiles.push(
            renameFile(
                path.join(squirrelDirectory, entry.name),
                path.join(squirrelDirectory, renamedNupkgFileName)
            )
        );
    }

    const releasesPath = path.join(squirrelDirectory, "RELEASES");
    if (fs.existsSync(releasesPath)) {
        renamedFiles.push(
            renameFile(
                releasesPath,
                path.join(squirrelDirectory, "RELEASES-win32")
            )
        );
    }

    return renamedFiles;
}

function normalizePath(filePath) {
    return filePath.split(path.sep).join("/");
}

function printUsage() {
    console.log(`Usage: node scripts/rename-squirrel-win32-release-assets.mjs [options]

Options:
  --squirrel-directory <path>  Squirrel win32 directory. Defaults to release-dist/windows-latest-ia32/squirrel-windows-ia32.
  -h, --help                   Show this help text.`);
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

function renameFile(sourcePath, destinationPath) {
    fs.renameSync(sourcePath, destinationPath);

    return {
        from: normalizePath(sourcePath),
        to: normalizePath(destinationPath),
    };
}
