import { execFileSync } from "node:child_process";
import fs from "node:fs";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    readInlineOptionValue,
    readOptionValue,
    requireOption,
} from "./lib/cli-options.mjs";

const CHECK_RUN_NAME = "Update ChangeLogs";
const GITHUB_JSON_HEADERS = [
    "-H",
    "Accept: application/vnd.github+json",
    "-H",
    "X-GitHub-Api-Version: 2022-11-28",
];

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const options = parseArgs(process.argv.slice(2), process.env);

    if (options.help) {
        printUsage();
    } else {
        updateChangelogCheckRun(options);
    }
}

export function buildCreateCheckRunPayload(options) {
    return {
        head_sha: options.headSha,
        name: CHECK_RUN_NAME,
        output: {
            summary: "Changelog update in progress",
            title: CHECK_RUN_NAME,
        },
        status: "in_progress",
    };
}

export function buildGeneratedCheckRunPayload(options) {
    return {
        output: {
            summary: `Changelogs generated for v${options.version} and committed to repository`,
            title: CHECK_RUN_NAME,
        },
        status: "in_progress",
    };
}

export function buildCompleteCheckRunPayload(options) {
    return {
        conclusion: resolveCheckRunConclusion(options.jobStatus),
        output: {
            summary: `Changelog update workflow completed with status: ${options.jobStatus}`,
            title: CHECK_RUN_NAME,
        },
    };
}

export function createChangelogCheckRun(options) {
    const result = runGhApi(
        {
            method: "POST",
            payload: buildCreateCheckRunPayload(options),
            repository: options.repository,
            route: "check-runs",
        },
        options.runCommand
    );
    const checkId = result.id;

    if (!checkId) {
        throw new Error("GitHub check-run creation did not return an id");
    }

    fs.appendFileSync(options.githubEnv, `CHECKID=${checkId}\n`);

    return checkId;
}

export function markChangelogsGenerated(options) {
    runGhApi(
        {
            method: "PATCH",
            payload: buildGeneratedCheckRunPayload(options),
            repository: options.repository,
            route: `check-runs/${options.checkId}`,
        },
        options.runCommand
    );
}

export function parseArgs(args, environment = process.env) {
    const options = {
        action: undefined,
        checkId: environment.CHECKID,
        githubEnv: environment.GITHUB_ENV,
        headSha: environment.GITHUB_SHA,
        help: false,
        jobStatus: environment.JOB_STATUS,
        repository: environment.GITHUB_REPOSITORY,
        version: environment.CHANGELOG_VERSION,
    };

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];

        if (!arg.startsWith("-") && !options.action) {
            options.action = arg;
            continue;
        }

        if (arg === "--check-id") {
            options.checkId = readOptionValue(args, index, "--check-id");
            index += 1;
            continue;
        }

        if (arg.startsWith("--check-id=")) {
            options.checkId = readInlineOptionValue(arg, "--check-id");
            continue;
        }

        if (arg === "--github-env") {
            options.githubEnv = readOptionValue(args, index, "--github-env");
            index += 1;
            continue;
        }

        if (arg.startsWith("--github-env=")) {
            options.githubEnv = readInlineOptionValue(arg, "--github-env");
            continue;
        }

        if (arg === "--head-sha") {
            options.headSha = readOptionValue(args, index, "--head-sha");
            index += 1;
            continue;
        }

        if (arg.startsWith("--head-sha=")) {
            options.headSha = readInlineOptionValue(arg, "--head-sha");
            continue;
        }

        if (arg === "--help" || arg === "-h") {
            options.help = true;
            continue;
        }

        if (arg === "--job-status") {
            options.jobStatus = readOptionValue(args, index, "--job-status");
            index += 1;
            continue;
        }

        if (arg.startsWith("--job-status=")) {
            options.jobStatus = readInlineOptionValue(arg, "--job-status");
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
        requireOption(options.action, "action");
        requireKnownAction(options.action);
        requireOption(options.repository, "--repository or GITHUB_REPOSITORY");

        if (options.action === "create") {
            requireOption(options.githubEnv, "--github-env or GITHUB_ENV");
            requireOption(options.headSha, "--head-sha or GITHUB_SHA");
        }

        if (options.action === "generated") {
            requireOption(options.checkId, "--check-id or CHECKID");
            requireOption(options.version, "--version or CHANGELOG_VERSION");
        }

        if (options.action === "complete") {
            requireOption(options.checkId, "--check-id or CHECKID");
            requireOption(options.jobStatus, "--job-status or JOB_STATUS");
        }
    }

    return options;
}

export function resolveCheckRunConclusion(jobStatus) {
    return jobStatus === "success" ? "success" : "failure";
}

export function updateChangelogCheckRun(options) {
    if (options.action === "create") {
        return createChangelogCheckRun(options);
    }

    if (options.action === "generated") {
        markChangelogsGenerated(options);
        return undefined;
    }

    completeChangelogCheckRun(options);
    return undefined;
}

export function completeChangelogCheckRun(options) {
    runGhApi(
        {
            method: "PATCH",
            payload: buildCompleteCheckRunPayload(options),
            repository: options.repository,
            route: `check-runs/${options.checkId}`,
        },
        options.runCommand
    );
}

function printUsage() {
    console.log(`Usage: node scripts/update-changelog-check-run.mjs <action> [options]

Actions:
  create       Create the Update ChangeLogs check run and write CHECKID to GITHUB_ENV.
  generated    Mark the check run as generated after changelog generation and commit.
  complete     Complete the check run using JOB_STATUS.

Options:
  --repository <owner/repo>        Repository. Defaults to GITHUB_REPOSITORY.
  --head-sha <sha>                 Commit SHA for create. Defaults to GITHUB_SHA.
  --github-env <path>              GitHub env file for create. Defaults to GITHUB_ENV.
  --check-id <id>                  Check run id. Defaults to CHECKID.
  --version <version>              Changelog version. Defaults to CHANGELOG_VERSION.
  --job-status <status>            Job status. Defaults to JOB_STATUS.
  -h, --help                       Show this help text.`);
}

function requireKnownAction(action) {
    if (
        ![
            "complete",
            "create",
            "generated",
        ].includes(action)
    ) {
        throw new Error(`Unknown action: ${action}`);
    }
}

function runGhApi(options, runCommand = execFileSync) {
    const output = runCommand(
        "gh",
        [
            "api",
            "-X",
            options.method,
            ...GITHUB_JSON_HEADERS,
            `/repos/${options.repository}/${options.route}`,
            "--input",
            "-",
        ],
        {
            encoding: "utf8",
            input: `${JSON.stringify(options.payload)}\n`,
        }
    );

    return output ? JSON.parse(output) : {};
}
