import { spawnSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { appSourceRepositoryPath, repositoryRoot } from "./lib/workspaces.mjs";

export const defaultDiffPath = `${appSourceRepositoryPath()}/`;
export const defaultTagPattern = "v*";

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
        printUsage();
    } else {
        process.exitCode = printElectronAppDiff(options);
    }
}

export function getRootCommit(runCommand = runCommandSync) {
    const result = runCommand("git", [
        "rev-list",
        "--max-parents=0",
        "HEAD",
    ]);

    return result.stdout.trim();
}

export function getLastVersionRef(tagPattern, runCommand = runCommandSync) {
    const tagResult = runCommand("git", [
        "describe",
        "--tags",
        "--match",
        tagPattern,
        "--abbrev=0",
    ]);

    if (tagResult.status === 0 && tagResult.stdout.trim()) {
        return tagResult.stdout.trim();
    }

    return getRootCommit(runCommand);
}

export function parseArgs(args) {
    const options = {
        diffPath: defaultDiffPath,
        help: false,
        tagPattern: defaultTagPattern,
    };

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];

        if (arg === "--diff-path") {
            options.diffPath = readOptionValue(args, index, "--diff-path");
            index += 1;
            continue;
        }

        if (arg.startsWith("--diff-path=")) {
            options.diffPath = readInlineOptionValue(arg, "--diff-path");
            continue;
        }

        if (arg === "--help" || arg === "-h") {
            options.help = true;
            continue;
        }

        if (arg === "--tag-pattern") {
            options.tagPattern = readOptionValue(args, index, "--tag-pattern");
            index += 1;
            continue;
        }

        if (arg.startsWith("--tag-pattern=")) {
            options.tagPattern = readInlineOptionValue(arg, "--tag-pattern");
            continue;
        }

        throw new Error(`Unknown option: ${arg}`);
    }

    return options;
}

export function printElectronAppDiff(options = {}, dependencies = {}) {
    const diffPath = options.diffPath ?? defaultDiffPath;
    const log = dependencies.log ?? console.log;
    const runCommand = dependencies.runCommand ?? runCommandSync;
    const tagPattern = options.tagPattern ?? defaultTagPattern;

    log("--- GIT DIFF OUTPUT (since last tag) ---");

    const fetchResult = runCommand("git", [
        "fetch",
        "--tags",
        "--force",
    ]);
    if (fetchResult.status !== 0) {
        log(fetchResult.stderr.trim());
        return fetchResult.status;
    }

    const lastRef = getLastVersionRef(tagPattern, runCommand);
    const diffResult = runCommand("git", [
        "diff",
        "--name-status",
        lastRef,
        "--",
        diffPath,
    ]);

    if (diffResult.stdout.trim()) {
        log(diffResult.stdout.trimEnd());
    }

    if (diffResult.stderr.trim()) {
        log(diffResult.stderr.trimEnd());
    }

    log("--- END GIT DIFF OUTPUT ---");

    return diffResult.status;
}

function printUsage() {
    console.log(`Usage: node scripts/print-electron-app-diff.mjs [options]

Options:
  --diff-path <path>     Repository path to diff. Defaults to electron-app/.
  --tag-pattern <glob>   Version tag pattern. Defaults to v*.
  -h, --help             Show this help text.`);
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

function runCommandSync(command, args) {
    const result = spawnSync(command, args, {
        cwd: repositoryRoot,
        encoding: "utf8",
    });

    if (result.error) {
        throw result.error;
    }

    return {
        status: result.status ?? 1,
        stderr: result.stderr ?? "",
        stdout: result.stdout ?? "",
    };
}
