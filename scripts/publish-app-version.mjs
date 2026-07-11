import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { readInlineOptionValue, readOptionValue } from "./lib/cli-options.mjs";
import {
    repositoryRoot as defaultRepositoryRoot,
    rootPackageLockPath,
    rootPackageRepositoryPath,
} from "./lib/workspaces.mjs";

export const defaultVersionFiles = [
    rootPackageRepositoryPath,
    rootPackageLockPath,
];
export const githubActionsBot = {
    email: "41898282+github-actions[bot]@users.noreply.github.com",
    name: "github-actions[bot]",
};

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
        printUsage();
    } else {
        const result = publishAppVersion(options);

        if (options.githubOutput) {
            writeGithubOutput(result.bumpSha);
        }

        console.log(
            `[publish-app-version] Published ${result.tagName} from ${result.bumpSha} to ${result.branch}`
        );
    }
}

export function publishAppVersion(options) {
    const normalizedOptions = normalizePublishOptions(options);
    const commands = createPublishCommands(normalizedOptions);
    const captureRunner = normalizedOptions.captureRunner ?? captureCommand;
    const commandRunner = normalizedOptions.commandRunner ?? runCommand;

    if (normalizedOptions.dryRun) {
        return {
            branch: normalizedOptions.branch,
            bumpSha: "dry-run",
            commands,
            tagName: createTagName(normalizedOptions.version),
            version: normalizedOptions.version,
        };
    }

    for (const command of commands) {
        commandRunner(command.command, command.args, {
            cwd: normalizedOptions.repositoryRoot,
            stdio: "inherit",
        });
    }

    const bumpSha = captureRunner("git", ["rev-parse", "HEAD"], {
        cwd: normalizedOptions.repositoryRoot,
    });

    return {
        branch: normalizedOptions.branch,
        bumpSha,
        commands,
        tagName: createTagName(normalizedOptions.version),
        version: normalizedOptions.version,
    };
}

export function createCommitMessage(version) {
    return `🔖 [chore] Release v${version} [skip ci]`;
}

export function createPublishCommands(options) {
    const tagName = createTagName(options.version);

    return [
        {
            args: [
                "config",
                "user.name",
                githubActionsBot.name,
            ],
            command: "git",
        },
        {
            args: [
                "config",
                "user.email",
                githubActionsBot.email,
            ],
            command: "git",
        },
        {
            args: ["add", ...defaultVersionFiles],
            command: "git",
        },
        {
            args: [
                "commit",
                "-m",
                createCommitMessage(options.version),
            ],
            command: "git",
        },
        {
            args: [
                "push",
                "origin",
                `HEAD:${options.branch}`,
            ],
            command: "git",
        },
        {
            args: [
                "tag",
                "-a",
                tagName,
                "-m",
                createTagMessage(options.version),
            ],
            command: "git",
        },
        {
            args: [
                "push",
                "origin",
                tagName,
            ],
            command: "git",
        },
    ];
}

export function createTagMessage(version) {
    return `Release v${version}`;
}

export function createTagName(version) {
    return `v${version}`;
}

export function parseArgs(args) {
    const options = {
        branch: undefined,
        dryRun: false,
        githubOutput: false,
        help: false,
        version: undefined,
    };

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];

        if (arg === "--branch") {
            options.branch = readOptionValue(args, index, "--branch");
            index += 1;
            continue;
        }

        if (arg.startsWith("--branch=")) {
            options.branch = readInlineOptionValue(arg, "--branch");
            continue;
        }

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

    return options;
}

export function writeGithubOutput(
    bumpSha,
    outputPath = process.env.GITHUB_OUTPUT
) {
    if (!outputPath) {
        throw new Error("--github-output requires GITHUB_OUTPUT to be set");
    }

    fs.appendFileSync(outputPath, `bump_sha=${bumpSha}\n`);
}

function captureCommand(command, args, options) {
    const result = spawnSync(command, args, {
        ...options,
        encoding: "utf8",
        stdio: [
            "ignore",
            "pipe",
            "inherit",
        ],
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        throw new Error(`${command} ${args.join(" ")} failed`);
    }

    return result.stdout.trim();
}

function isValidSemver(version) {
    return /^\d+\.\d+\.\d+$/u.test(version);
}

function normalizePublishOptions(options) {
    const branch = options?.branch;
    const version = options?.version;

    if (typeof branch !== "string" || branch.trim() === "") {
        throw new Error("--branch is required");
    }

    if (typeof version !== "string" || !isValidSemver(version)) {
        throw new Error("--version must be a semver value like 1.2.3");
    }

    return {
        branch,
        captureRunner: options.captureRunner,
        commandRunner: options.commandRunner,
        dryRun: options.dryRun === true,
        repositoryRoot: path.resolve(
            options.repositoryRoot ?? defaultRepositoryRoot
        ),
        version,
    };
}

function printUsage() {
    console.log(`Usage: node scripts/publish-app-version.mjs --version <semver> --branch <branch> [options]

Options:
  --version <semver>  Version to commit and tag, without the leading v.
  --branch <branch>   Branch to push the version bump commit to.
  --github-output     Append bump_sha to GITHUB_OUTPUT for GitHub Actions.
  --dry-run           Print the planned publish result without running git.
  -h, --help          Show this help text.`);
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
