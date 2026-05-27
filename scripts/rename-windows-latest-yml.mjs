import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

export const defaultArtifactsDirectory = "artifacts";
export const renameRules = [
    {
        from: path.join("dist-windows-latest-ia32", "latest.yml"),
        to: path.join("dist-windows-latest-ia32", "latest-win32.yml"),
    },
    {
        from: path.join("dist-windows-latest-ia32", "nsis-web", "latest.yml"),
        to: path.join(
            "dist-windows-latest-ia32",
            "nsis-web",
            "latest-nsis-web-win32.yml"
        ),
    },
    {
        from: path.join("dist-windows-latest-x64", "nsis-web", "latest.yml"),
        to: path.join(
            "dist-windows-latest-x64",
            "nsis-web",
            "latest-nsis-web.yml"
        ),
    },
];

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
        printUsage();
    } else {
        const renamedFiles = renameWindowsLatestYml(options.artifactsDirectory);

        if (renamedFiles.length === 0) {
            console.log("[rename-windows-latest-yml] No files renamed.");
        } else {
            for (const renamedFile of renamedFiles) {
                console.log(
                    `[rename-windows-latest-yml] Renamed ${renamedFile.from} -> ${renamedFile.to}`
                );
            }
        }
    }
}

export function parseArgs(args) {
    const options = {
        artifactsDirectory: defaultArtifactsDirectory,
        help: false,
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

        throw new Error(`Unknown option: ${arg}`);
    }

    return options;
}

export function renameWindowsLatestYml(
    artifactsDirectory = defaultArtifactsDirectory
) {
    const renamedFiles = [];

    for (const rule of renameRules) {
        const sourcePath = path.join(artifactsDirectory, rule.from);
        const destinationPath = path.join(artifactsDirectory, rule.to);

        if (!fs.existsSync(sourcePath)) {
            continue;
        }

        fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
        fs.renameSync(sourcePath, destinationPath);
        renamedFiles.push({
            from: normalizePath(sourcePath),
            to: normalizePath(destinationPath),
        });
    }

    return renamedFiles;
}

function normalizePath(filePath) {
    return filePath.split(path.sep).join("/");
}

function printUsage() {
    console.log(`Usage: node scripts/rename-windows-latest-yml.mjs [options]

Options:
  --artifacts-directory <path>  Artifacts directory. Defaults to artifacts.
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
