import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    repositoryRoot as defaultRepositoryRoot,
    rootPackageJsonPath,
} from "./lib/workspaces.mjs";
import { resolveCommandForPlatform } from "./lib/child-process.mjs";

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
        printUsage();
    } else {
        const result = bumpAppVersion(options);

        if (options.githubOutput) {
            writeGithubOutput(result.newVersion);
        }

        console.log(
            `[bump-app-version] root: ${result.currentVersion} -> ${result.newVersion}`
        );
    }
}

export function bumpAppVersion(options = {}) {
    const repositoryRoot = path.resolve(
        options.repositoryRoot ?? defaultRepositoryRoot
    );
    const packagePath = rootPackagePathFromRepository(repositoryRoot);
    const packageJson = readPackageJson(packagePath);
    const currentVersion = packageJson.version;
    const newVersion = calculateNextVersion(currentVersion);

    if (!options.dryRun) {
        const commandRunner = options.commandRunner ?? runCommand;
        commandRunner(
            resolveCommandForPlatform("npm"),
            createNpmVersionArgs(newVersion),
            {
                cwd: repositoryRoot,
                stdio: "inherit",
            }
        );
    }

    return {
        currentVersion,
        newVersion,
        packagePath,
    };
}

export function calculateNextVersion(version) {
    const parsedVersion = parseSemver(version);

    if (parsedVersion.minor < 9) {
        return `${parsedVersion.major}.${parsedVersion.minor + 1}.0`;
    }

    return `${parsedVersion.major + 1}.0.0`;
}

export function createNpmVersionArgs(version) {
    return [
        "version",
        "--no-git-tag-version",
        "--ignore-scripts",
        version,
    ];
}

export function parseArgs(args) {
    const options = {
        dryRun: false,
        githubOutput: false,
        help: false,
    };

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];

        if (arg === "--dry-run") {
            options.dryRun = true;
            continue;
        }

        if (arg === "--github-output") {
            options.githubOutput = true;
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

export function writeGithubOutput(
    newVersion,
    outputPath = process.env.GITHUB_OUTPUT
) {
    if (!outputPath) {
        throw new Error("--github-output requires GITHUB_OUTPUT to be set");
    }

    fs.appendFileSync(outputPath, `new_version=${newVersion}\n`);
}

function rootPackagePathFromRepository(repositoryRoot) {
    return path.join(repositoryRoot, rootPackageJsonPath);
}

function parseSemver(version) {
    if (typeof version !== "string") {
        throw new TypeError("package.json version must be a string");
    }

    const match = /^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)$/u.exec(
        version
    );

    if (!match?.groups) {
        throw new Error(`Unsupported package version: ${version}`);
    }

    return {
        major: Number.parseInt(match.groups.major, 10),
        minor: Number.parseInt(match.groups.minor, 10),
        patch: Number.parseInt(match.groups.patch, 10),
    };
}

function printUsage() {
    console.log(`Usage: node scripts/bump-app-version.mjs [options]

Options:
  --github-output    Append new_version to GITHUB_OUTPUT for GitHub Actions.
  --dry-run          Compute the next version without updating package files.
  -h, --help         Show this help text.`);
}

function readPackageJson(packagePath) {
    if (!fs.existsSync(packagePath)) {
        throw new Error(`Package file not found: ${packagePath}`);
    }

    try {
        return JSON.parse(fs.readFileSync(packagePath, "utf8"));
    } catch (error) {
        throw new Error(`Package file is not valid JSON: ${packagePath}`, {
            cause: error,
        });
    }
}

function runCommand(command, args, options) {
    const result = spawnSync(command, args, options);

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        throw new Error(`${command} ${args.join(" ")} failed`);
    }
}
