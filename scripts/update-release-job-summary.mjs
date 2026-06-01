import fs from "node:fs";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    readInlineOptionValue,
    readOptionValue,
    requireOption,
} from "./lib/cli-options.mjs";

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const options = parseArgs(process.argv.slice(2), process.env);

    if (options.help) {
        printUsage();
    } else {
        updateReleaseJobSummary(options);
    }
}

export function createReleaseJobSummary(options) {
    return [
        "## \u{1F3D7}\uFE0F Build and Release Electron App Workflow Summary",
        "",
        "See above for the full build matrix results.",
        "---",
        "- **Version bump and tagging** performed for the root app package.",
        "- **Builds executed** for multiple OS and architectures.",
        "- **Build artifacts uploaded** for each platform.",
        "- **Release created** if build and version bump succeeded.",
        "- **Changelogs will be updated** and committed directly to the repository.",
        `- Workflow completed with status: ${options.jobStatus}`,
        "",
    ].join("\n");
}

export function parseArgs(args, environment = process.env) {
    const options = {
        githubStepSummary: environment.GITHUB_STEP_SUMMARY,
        help: false,
        jobStatus: environment.JOB_STATUS,
    };

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];

        if (arg === "--github-step-summary") {
            options.githubStepSummary = readOptionValue(
                args,
                index,
                "--github-step-summary"
            );
            index += 1;
            continue;
        }

        if (arg.startsWith("--github-step-summary=")) {
            options.githubStepSummary = readInlineOptionValue(
                arg,
                "--github-step-summary"
            );
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

        throw new Error(`Unknown option: ${arg}`);
    }

    if (!options.help) {
        requireOption(options.githubStepSummary, "GITHUB_STEP_SUMMARY");
        requireOption(options.jobStatus, "--job-status or JOB_STATUS");
    }

    return options;
}

export function updateReleaseJobSummary(options) {
    fs.appendFileSync(
        options.githubStepSummary,
        createReleaseJobSummary(options)
    );
}

function printUsage() {
    console.log(`Usage: node scripts/update-release-job-summary.mjs [options]

Options:
  --job-status <status>            Release job status. Defaults to JOB_STATUS.
  --github-step-summary <path>     Summary file. Defaults to GITHUB_STEP_SUMMARY.
  -h, --help                       Show this help text.`);
}
