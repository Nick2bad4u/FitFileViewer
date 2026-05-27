import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const repositoryRoot = process.cwd();
const flatpakBundleName = "FitFileViewer.flatpak";
const flatpakZipName = `${flatpakBundleName}.zip`;

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const options = parseArgs(process.argv.slice(2), process.env);

    if (options.help) {
        printUsage();
    } else {
        publishFlatpakReleaseAssets(options);
    }
}

export function parseArgs(args, environment = process.env) {
    const options = {
        help: false,
        releaseTag: environment.RELEASE_TAG,
        root: repositoryRoot,
    };

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];

        if (arg === "--help" || arg === "-h") {
            options.help = true;
            continue;
        }

        if (arg === "--release-tag") {
            options.releaseTag = readOptionValue(args, index, "--release-tag");
            index += 1;
            continue;
        }

        if (arg.startsWith("--release-tag=")) {
            options.releaseTag = readInlineOptionValue(arg, "--release-tag");
            continue;
        }

        if (arg === "--root") {
            options.root = path.resolve(readOptionValue(args, index, "--root"));
            index += 1;
            continue;
        }

        if (arg.startsWith("--root=")) {
            options.root = path.resolve(readInlineOptionValue(arg, "--root"));
            continue;
        }

        throw new Error(`Unknown option: ${arg}`);
    }

    if (!options.help) {
        requireOption(options.releaseTag, "--release-tag or RELEASE_TAG");
    }

    return options;
}

export function publishFlatpakReleaseAssets({
    releaseTag,
    root = repositoryRoot,
    runCommand = execFileSync,
}) {
    requireOption(releaseTag, "--release-tag or RELEASE_TAG");

    const paths = getFlatpakReleaseAssetPaths(root, releaseTag);

    if (!fs.existsSync(paths.sourceBundlePath)) {
        throw new Error(`Flatpak bundle not found: ${paths.sourceBundlePath}`);
    }

    if (fs.existsSync(paths.sourceZipPath)) {
        fs.rmSync(paths.sourceZipPath, { force: true });
    }

    runCommand(
        "zip",
        [
            "-j",
            paths.sourceZipPath,
            paths.sourceBundlePath,
        ],
        {
            stdio: "inherit",
        }
    );

    fs.renameSync(paths.sourceBundlePath, paths.releaseBundlePath);
    fs.renameSync(paths.sourceZipPath, paths.releaseZipPath);

    runCommand(
        "gh",
        [
            "release",
            "upload",
            releaseTag,
            paths.releaseBundlePath,
            paths.releaseZipPath,
            "--clobber",
        ],
        { stdio: "inherit" }
    );

    return paths;
}

export function getFlatpakReleaseAssetPaths(root, releaseTag) {
    const releaseBaseName = `FitFileViewer-${releaseTag}`;

    return {
        releaseBundlePath: path.join(root, `${releaseBaseName}.flatpak`),
        releaseZipPath: path.join(root, `${releaseBaseName}.flatpak.zip`),
        sourceBundlePath: path.join(root, flatpakBundleName),
        sourceZipPath: path.join(root, flatpakZipName),
    };
}

function printUsage() {
    console.log(`Usage: node scripts/publish-flatpak-release-assets.mjs [options]

Options:
  --release-tag <tag>  Release tag to upload to. Defaults to RELEASE_TAG.
  --root <path>        Workspace root containing FitFileViewer.flatpak.
  -h, --help           Show this help text.`);
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

function requireOption(value, optionName) {
    if (!value) {
        throw new Error(`${optionName} is required`);
    }
}
