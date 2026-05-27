import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    appWorkspaceName,
    repositoryRoot as defaultRepositoryRoot,
} from "./lib/workspaces.mjs";

export const defaultWorkspace = appWorkspaceName;

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
            `[bump-app-version] ${result.workspace}: ${result.currentVersion} -> ${result.newVersion}`
        );
    }
}

export function bumpAppVersion(options = {}) {
    const workspace = options.workspace ?? defaultWorkspace;
    const repositoryRoot = options.repositoryRoot ?? defaultRepositoryRoot;
    const packagePath = getWorkspacePackagePath(repositoryRoot, workspace);
    const packageJson = readPackageJson(packagePath);
    const currentVersion = packageJson.version;
    const newVersion = calculateNextVersion(currentVersion);

    if (!options.dryRun) {
        const commandRunner = options.commandRunner ?? runCommand;
        commandRunner("npm", createNpmVersionArgs(workspace, newVersion), {
            cwd: repositoryRoot,
            shell: process.platform === "win32",
            stdio: "inherit",
        });
    }

    return {
        currentVersion,
        newVersion,
        packagePath,
        workspace,
    };
}

export function calculateNextVersion(version) {
    const parsedVersion = parseSemver(version);

    if (parsedVersion.minor < 9) {
        return `${parsedVersion.major}.${parsedVersion.minor + 1}.0`;
    }

    return `${parsedVersion.major + 1}.0.0`;
}

export function createNpmVersionArgs(workspace, version) {
    return [
        "version",
        "--workspace",
        workspace,
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
        workspace: defaultWorkspace,
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

        if (arg === "--workspace") {
            const workspace = args[index + 1];

            if (!workspace || workspace.startsWith("-")) {
                throw new Error("--workspace requires a value");
            }

            options.workspace = workspace;
            index += 1;
            continue;
        }

        if (arg.startsWith("--workspace=")) {
            const workspace = arg.slice("--workspace=".length);

            if (!workspace) {
                throw new Error("--workspace requires a value");
            }

            options.workspace = workspace;
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

function getWorkspacePackagePath(repositoryRoot, workspace) {
    return path.join(repositoryRoot, workspace, "package.json");
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
  --workspace <name>  Workspace package to bump. Defaults to electron-app.
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
