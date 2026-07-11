import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { readInlineOptionValue, readOptionValue } from "./lib/cli-options.mjs";
import { repositoryRoot as defaultRepositoryRoot } from "./lib/workspaces.mjs";

export const defaultMaxReleaseNoteCommits = 100;

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
        printUsage();
    } else {
        const result = generateReleaseNotes(options);

        if (options.githubOutput) {
            writeGithubOutput(result.notes);
        }

        console.log(result.notes);
    }
}

export function createCommitPrettyFormat(repository) {
    return `- %s%n  - Author: %an <%ae>%n  - Commit: [%h](https://github.com/${repository}/commit/%H)%n  - Date: %ad%n`;
}

export function createGitLogArgs(
    rangeSpec,
    repository,
    maxCommits = defaultMaxReleaseNoteCommits
) {
    return [
        "log",
        rangeSpec,
        `--max-count=${maxCommits}`,
        `--pretty=format:${createCommitPrettyFormat(repository)}`,
        "--date=short",
    ];
}

export function appendReleaseNotesOverflow(
    notes,
    {
        commitCount,
        currentTag,
        maxCommits = defaultMaxReleaseNoteCommits,
        previousTag,
        repository,
    }
) {
    const omittedCommitCount = Math.max(commitCount - maxCommits, 0);
    if (omittedCommitCount === 0 || !previousTag) {
        return notes;
    }

    const comparisonUrl = `https://github.com/${repository}/compare/${previousTag}...${currentTag}`;
    return `${notes}\n\n_${omittedCommitCount.toLocaleString("en-US")} additional commits are included in the [full comparison](${comparisonUrl})._`;
}

export function createRangeSpec(currentTag, previousTag) {
    return previousTag ? `${previousTag}..${currentTag}` : currentTag;
}

export function createTagName(version) {
    return version.startsWith("v") ? version : `v${version}`;
}

export function generateReleaseNotes(options) {
    const normalizedOptions = normalizeOptions(options);
    const commandRunner = normalizedOptions.commandRunner ?? captureCommand;
    const currentTag = createTagName(normalizedOptions.version);

    commandRunner(
        "git",
        [
            "fetch",
            "--tags",
            "--force",
        ],
        {
            cwd: normalizedOptions.repositoryRoot,
        }
    );

    const previousTag = findPreviousTag({
        commandRunner,
        currentTag,
        repositoryRoot: normalizedOptions.repositoryRoot,
    });
    const rangeSpec = createRangeSpec(currentTag, previousTag);
    const commitCount = parseCommitCount(
        commandRunner(
            "git",
            [
                "rev-list",
                "--count",
                rangeSpec,
            ],
            {
                cwd: normalizedOptions.repositoryRoot,
            }
        )
    );
    const rawNotes = commandRunner(
        "git",
        createGitLogArgs(rangeSpec, normalizedOptions.repository),
        {
            cwd: normalizedOptions.repositoryRoot,
        }
    );
    const notes = appendReleaseNotesOverflow(
        normalizeReleaseNotes(rawNotes, rangeSpec),
        {
            commitCount,
            currentTag,
            previousTag,
            repository: normalizedOptions.repository,
        }
    );

    return {
        currentTag,
        commitCount,
        notes,
        previousTag,
        rangeSpec,
    };
}

function parseCommitCount(value) {
    const commitCount = Number.parseInt(value.trim(), 10);
    if (!Number.isSafeInteger(commitCount) || commitCount < 0) {
        throw new Error(
            `Invalid commit count returned by git: ${value.trim()}`
        );
    }

    return commitCount;
}

export function normalizeReleaseNotes(notes, rangeSpec) {
    const trimmedNotes = notes.trim();

    return trimmedNotes || `No commits found for range ${rangeSpec}`;
}

export function parseArgs(args) {
    const options = {
        githubOutput: false,
        help: false,
        repository: undefined,
        repositoryRoot: defaultRepositoryRoot,
        version: undefined,
    };

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];

        if (arg === "--github-output") {
            options.githubOutput = true;
            continue;
        }

        if (arg === "--help" || arg === "-h") {
            options.help = true;
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

        if (arg === "--repository-root") {
            options.repositoryRoot = readOptionValue(
                args,
                index,
                "--repository-root"
            );
            index += 1;
            continue;
        }

        if (arg.startsWith("--repository-root=")) {
            options.repositoryRoot = readInlineOptionValue(
                arg,
                "--repository-root"
            );
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
    notes,
    outputPath = process.env.GITHUB_OUTPUT
) {
    if (!outputPath) {
        throw new Error("--github-output requires GITHUB_OUTPUT to be set");
    }

    fs.appendFileSync(outputPath, `notes<<EOF\n${notes}\nEOF\n`);
}

function captureCommand(command, args, options = {}) {
    const result = spawnSync(command, args, {
        ...options,
        encoding: "utf8",
        stdio: [
            "ignore",
            "pipe",
            "pipe",
        ],
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        throw new Error(
            `${command} ${args.join(" ")} failed: ${result.stderr.trim()}`
        );
    }

    return result.stdout;
}

function findPreviousTag({ commandRunner, currentTag, repositoryRoot }) {
    try {
        return commandRunner(
            "git",
            [
                "describe",
                "--tags",
                "--match",
                "v*",
                "--abbrev=0",
                `${currentTag}^`,
            ],
            {
                cwd: repositoryRoot,
            }
        ).trim();
    } catch {
        return "";
    }
}

function isValidSemver(version) {
    return /^v?\d+\.\d+\.\d+$/u.test(version);
}

function normalizeOptions(options) {
    if (!options || typeof options !== "object") {
        throw new TypeError("options are required");
    }

    if (
        typeof options.repository !== "string" ||
        options.repository.trim() === ""
    ) {
        throw new Error("--repository is required");
    }

    if (
        typeof options.version !== "string" ||
        !isValidSemver(options.version)
    ) {
        throw new Error("--version must be a semver value like 1.2.3");
    }

    return {
        commandRunner: options.commandRunner,
        repository: options.repository,
        repositoryRoot: path.resolve(
            options.repositoryRoot ?? defaultRepositoryRoot
        ),
        version: options.version,
    };
}

function printUsage() {
    console.log(`Usage: node scripts/generate-release-notes.mjs --version <semver> --repository <owner/name> [options]

Options:
  --version <semver>          Current release version, with or without leading v.
  --repository <owner/name>   GitHub repository used for commit links.
  --repository-root <path>    Git repository root. Defaults to this repository root.
  --github-output             Append notes to GITHUB_OUTPUT for GitHub Actions.
  -h, --help                  Show this help text.`);
}
