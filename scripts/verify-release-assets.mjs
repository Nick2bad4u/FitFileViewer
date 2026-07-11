import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { parse as parseYaml } from "yaml";

import {
    readInlineOptionValue,
    readOptionValue,
    requireOption,
} from "./lib/cli-options.mjs";
import { rootReleaseDistAbsolutePath } from "./lib/workspaces.mjs";

export const requiredUpdaterMetadataNames = [
    "latest.yml",
    "latest-win32.yml",
    "latest-mac.yml",
    "latest-linux.yml",
];

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const options = parseArgs(process.argv.slice(2), process.env);

    if (options.help) {
        printUsage();
    } else {
        const release = await fetchReleaseByTag(options);
        const result = verifyReleaseAssets({
            expectedVersion: options.version,
            release,
            releaseDistDirectory: options.releaseDistDirectory,
            requireDraft: options.requireDraft,
        });

        console.log(
            `[verify-release-assets] Verified ${result.metadataCount} updater metadata files and ${result.referencedAssetCount} referenced assets for ${options.tag}.`
        );
    }
}

export function parseArgs(args, environment = process.env) {
    const options = {
        apiUrl: environment.GITHUB_API_URL ?? "https://api.github.com",
        help: false,
        releaseDistDirectory: rootReleaseDistAbsolutePath,
        repository: environment.GITHUB_REPOSITORY,
        requireDraft: false,
        tag: undefined,
        token: environment.GH_TOKEN ?? environment.GITHUB_TOKEN,
        version: undefined,
    };

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];

        if (arg === "--help" || arg === "-h") {
            options.help = true;
            continue;
        }
        if (arg === "--require-draft") {
            options.requireDraft = true;
            continue;
        }
        if (arg === "--release-dist") {
            options.releaseDistDirectory = path.resolve(
                readOptionValue(args, index, "--release-dist")
            );
            index += 1;
            continue;
        }
        if (arg.startsWith("--release-dist=")) {
            options.releaseDistDirectory = path.resolve(
                readInlineOptionValue(arg, "--release-dist")
            );
            continue;
        }
        if (arg === "--repository") {
            options.repository = readOptionValue(args, index, "--repository");
            index += 1;
            continue;
        }
        if (arg.startsWith("--repository=")) {
            options.repository = readInlineOptionValue(arg, "--repository");
            continue;
        }
        if (arg === "--tag") {
            options.tag = readOptionValue(args, index, "--tag");
            index += 1;
            continue;
        }
        if (arg.startsWith("--tag=")) {
            options.tag = readInlineOptionValue(arg, "--tag");
            continue;
        }
        if (arg === "--version") {
            options.version = readOptionValue(args, index, "--version");
            index += 1;
            continue;
        }
        if (arg.startsWith("--version=")) {
            options.version = readInlineOptionValue(arg, "--version");
            continue;
        }

        throw new Error(`Unknown option: ${arg}`);
    }

    if (!options.help) {
        requireOption(options.repository, "--repository or GITHUB_REPOSITORY");
        requireOption(options.tag, "--tag");
        requireOption(options.token, "GH_TOKEN or GITHUB_TOKEN");
        requireOption(options.version, "--version");
    }

    return options;
}

export async function fetchReleaseByTag({
    apiUrl,
    repository,
    requireDraft = false,
    tag,
    token,
    fetchImplementation = fetch,
}) {
    const normalizedApiUrl = apiUrl.replace(/\/$/u, "");
    const headers = {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
    };
    const requestUrl = `${normalizedApiUrl}/repos/${repository}/releases/tags/${encodeURIComponent(tag)}`;
    const response = await fetchImplementation(requestUrl, { headers });

    if (response.ok) {
        return response.json();
    }

    if (response.status === 404 && requireDraft) {
        const releasesUrl = `${normalizedApiUrl}/repos/${repository}/releases?per_page=100`;
        const releasesResponse = await fetchImplementation(releasesUrl, {
            headers,
        });
        if (!releasesResponse.ok) {
            throw new Error(
                `GitHub release list lookup failed (${releasesResponse.status} ${releasesResponse.statusText}) for ${tag}`
            );
        }

        const releases = await releasesResponse.json();
        if (Array.isArray(releases)) {
            const matchingDraft = releases.find(
                (release) => release?.draft === true && release.tag_name === tag
            );
            if (matchingDraft) {
                return matchingDraft;
            }
        }
    }

    throw new Error(
        `GitHub release lookup failed (${response.status} ${response.statusText}) for ${tag}`
    );
}

export function verifyReleaseAssets({
    expectedVersion,
    release,
    releaseDistDirectory,
    requireDraft = false,
}) {
    if (!release || typeof release !== "object") {
        throw new TypeError("GitHub release response must be an object");
    }
    if (requireDraft && release.draft !== true) {
        throw new Error(
            "Release must remain a draft until verification passes"
        );
    }
    if (!Array.isArray(release.assets)) {
        throw new TypeError("GitHub release response must include assets");
    }
    if (!fs.existsSync(releaseDistDirectory)) {
        throw new Error(
            `Release distributable directory not found: ${releaseDistDirectory}`
        );
    }

    const releaseAssetsByName = new Map(
        release.assets.map((asset) => [asset.name, asset])
    );
    const localFilesByName = indexLocalFilesByName(releaseDistDirectory);
    const referencedAssetNames = new Set();

    for (const metadataName of requiredUpdaterMetadataNames) {
        const releaseMetadataAsset = releaseAssetsByName.get(metadataName);
        if (!releaseMetadataAsset) {
            throw new Error(
                `Release is missing required updater metadata: ${metadataName}`
            );
        }

        const metadataPath = getUniqueLocalFile(localFilesByName, metadataName);
        const metadata = parseUpdaterMetadata(metadataPath, metadataName);
        if (metadata.version !== expectedVersion) {
            throw new Error(
                `${metadataName} version ${String(metadata.version)} does not match ${expectedVersion}`
            );
        }
        if (!Array.isArray(metadata.files) || metadata.files.length === 0) {
            throw new Error(`${metadataName} does not list update files`);
        }

        verifyUploadedFile(metadataName, metadataPath, releaseMetadataAsset);

        for (const fileEntry of metadata.files) {
            verifyUpdaterFileEntry({
                fileEntry,
                localFilesByName,
                metadataName,
                releaseAssetsByName,
            });
            referencedAssetNames.add(fileEntry.url);
        }

        const primaryEntry = metadata.files.find(
            (fileEntry) => fileEntry.url === metadata.path
        );
        if (!primaryEntry || primaryEntry.sha512 !== metadata.sha512) {
            throw new Error(
                `${metadataName} primary path and sha512 must match a files entry`
            );
        }
    }

    return {
        metadataCount: requiredUpdaterMetadataNames.length,
        referencedAssetCount: referencedAssetNames.size,
    };
}

function indexLocalFilesByName(rootDirectory) {
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

            const existingPaths = filesByName.get(entry.name) ?? [];
            existingPaths.push(entryPath);
            filesByName.set(entry.name, existingPaths);
        }
    }

    visit(rootDirectory);
    return filesByName;
}

function getUniqueLocalFile(localFilesByName, fileName) {
    const matches = localFilesByName.get(fileName) ?? [];
    if (matches.length !== 1) {
        throw new Error(
            `Expected exactly one local ${fileName}, found ${matches.length}`
        );
    }
    return matches[0];
}

function parseUpdaterMetadata(metadataPath, metadataName) {
    const parsed = parseYaml(fs.readFileSync(metadataPath, "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error(`${metadataName} must contain a YAML object`);
    }
    return parsed;
}

function verifyUpdaterFileEntry({
    fileEntry,
    localFilesByName,
    metadataName,
    releaseAssetsByName,
}) {
    if (
        !fileEntry ||
        typeof fileEntry !== "object" ||
        typeof fileEntry.url !== "string" ||
        typeof fileEntry.sha512 !== "string"
    ) {
        throw new Error(`${metadataName} contains an invalid files entry`);
    }

    const localPath = getUniqueLocalFile(localFilesByName, fileEntry.url);
    const releaseAsset = releaseAssetsByName.get(fileEntry.url);
    if (!releaseAsset) {
        throw new Error(
            `${metadataName} references an asset that was not uploaded: ${fileEntry.url}`
        );
    }

    const localSize = fs.statSync(localPath).size;
    if (Number.isSafeInteger(fileEntry.size) && fileEntry.size !== localSize) {
        throw new Error(
            `${metadataName} size mismatch for ${fileEntry.url}: ${fileEntry.size} != ${localSize}`
        );
    }
    if (releaseAsset.size !== localSize) {
        throw new Error(
            `Uploaded size mismatch for ${fileEntry.url}: ${releaseAsset.size} != ${localSize}`
        );
    }

    const sha512 = hashFile(localPath, "sha512", "base64");
    if (fileEntry.sha512 !== sha512) {
        throw new Error(`${metadataName} sha512 mismatch for ${fileEntry.url}`);
    }

    verifyUploadedFile(fileEntry.url, localPath, releaseAsset);
}

function verifyUploadedFile(fileName, localPath, releaseAsset) {
    if (releaseAsset.state !== "uploaded") {
        throw new Error(`${fileName} upload state is ${releaseAsset.state}`);
    }

    const localSize = fs.statSync(localPath).size;
    if (releaseAsset.size !== localSize) {
        throw new Error(
            `Uploaded size mismatch for ${fileName}: ${releaseAsset.size} != ${localSize}`
        );
    }

    if (typeof releaseAsset.digest === "string") {
        const expectedDigest = `sha256:${hashFile(localPath, "sha256", "hex")}`;
        if (releaseAsset.digest !== expectedDigest) {
            throw new Error(`Uploaded digest mismatch for ${fileName}`);
        }
    }
}

function hashFile(filePath, algorithm, encoding) {
    const hash = createHash(algorithm);
    hash.update(fs.readFileSync(filePath));
    return hash.digest(encoding);
}

function printUsage() {
    console.log(`Usage: node scripts/verify-release-assets.mjs [options]

Options:
  --repository <owner/repo>  GitHub repository. Defaults to GITHUB_REPOSITORY.
  --tag <tag>                Release tag to verify.
  --version <version>        Expected app version in updater metadata.
  --release-dist <path>      Local release-dist directory.
  --require-draft            Require the release to still be a draft.
  -h, --help                 Show this help text.`);
}
