import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    readInlineOptionValue,
    readOptionValue,
    requireOption,
} from "./lib/cli-options.mjs";
import { repositoryRoot, rootChangelogPath } from "./lib/workspaces.mjs";

const BOT_EMAIL = "41898282+github-actions[bot]@users.noreply.github.com";
const BOT_NAME = "github-actions[bot]";

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const options = parseArgs(process.argv.slice(2), process.env);

    if (options.help) {
        printUsage();
    } else {
        commitChangelogWorkflow(options);
    }
}

export function createChangelogCommitMessage(version) {
    return `📝 [docs] Update changelog for v${version} [skip ci]`;
}

export function commitChangelogWorkflow(options) {
    const cwd = path.resolve(options.cwd ?? repositoryRoot);
    const log = options.log ?? console.log;
    const runCommand = options.runCommand ?? spawnSync;

    runGit(
        [
            "config",
            "user.name",
            BOT_NAME,
        ],
        { cwd, runCommand }
    );
    runGit(
        [
            "config",
            "user.email",
            BOT_EMAIL,
        ],
        { cwd, runCommand }
    );
    runGit(["add", rootChangelogPath], { cwd, runCommand });

    const diffResult = runCommand(
        "git",
        [
            "diff",
            "--staged",
            "--quiet",
        ],
        {
            cwd,
            stdio: "inherit",
        }
    );

    if (diffResult.error) {
        throw diffResult.error;
    }

    if (diffResult.status === 0) {
        log("No changelog changes to commit");
        return false;
    }

    if (diffResult.status !== 1) {
        throw new Error(
            `git diff --staged --quiet failed with status ${diffResult.status}`
        );
    }

    runGit(
        [
            "commit",
            "-m",
            createChangelogCommitMessage(options.version),
        ],
        {
            cwd,
            runCommand,
        }
    );
    runGit(
        [
            "push",
            "origin",
            options.targetBranch,
        ],
        { cwd, runCommand }
    );
    log("Changelogs updated and pushed to repository");

    return true;
}

export function parseArgs(args, environment = process.env) {
    const options = {
        help: false,
        targetBranch: environment.TARGET_BRANCH,
        version: environment.CHANGELOG_VERSION,
    };

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];

        if (arg === "--help" || arg === "-h") {
            options.help = true;
            continue;
        }

        if (arg === "--target-branch") {
            options.targetBranch = readOptionValue(
                args,
                index,
                "--target-branch"
            );
            index += 1;
            continue;
        }

        if (arg.startsWith("--target-branch=")) {
            options.targetBranch = readInlineOptionValue(
                arg,
                "--target-branch"
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

    if (!options.help) {
        requireOption(options.targetBranch, "--target-branch or TARGET_BRANCH");
        requireOption(options.version, "--version or CHANGELOG_VERSION");
    }

    return options;
}

function printUsage() {
    console.log(`Usage: node scripts/commit-changelog-workflow.mjs [options]

Options:
  --version <version>              Changelog version. Defaults to CHANGELOG_VERSION.
  --target-branch <branch>         Branch to push to. Defaults to TARGET_BRANCH.
  -h, --help                       Show this help text.`);
}

function runGit(args, options) {
    const result = options.runCommand("git", args, {
        cwd: options.cwd,
        stdio: "inherit",
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        throw new Error(
            `git ${args.join(" ")} failed with status ${result.status}`
        );
    }
}
