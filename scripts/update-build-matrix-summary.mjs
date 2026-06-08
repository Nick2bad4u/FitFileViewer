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
        updateBuildMatrixSummary(options);
    }
}

export function createBuildMatrixSummaryRow(options) {
    const status = resolveBuildStatus(
        options.jobStatus,
        options.buildOutcome,
        options.packagedSmokeOutcome
    );

    return `| ${options.version} | ${options.matrixOs} | ${options.arch} | Build Status: ${status} |`;
}

export function parseArgs(args, environment = process.env) {
    const options = {
        arch: environment.MATRIX_ARCH,
        buildOutcome: environment.BUILD_APP_OUTCOME,
        githubStepSummary: environment.GITHUB_STEP_SUMMARY,
        help: false,
        jobStatus: environment.JOB_STATUS,
        matrixOs: environment.MATRIX_OS,
        packagedSmokeOutcome: environment.PACKAGED_SMOKE_OUTCOME,
        version: environment.BUILD_VERSION,
    };

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];

        if (arg === "--arch") {
            options.arch = readOptionValue(args, index, "--arch");
            index += 1;
            continue;
        }

        if (arg.startsWith("--arch=")) {
            options.arch = readInlineOptionValue(arg, "--arch");
            continue;
        }

        if (arg === "--build-outcome") {
            options.buildOutcome = readOptionValue(
                args,
                index,
                "--build-outcome"
            );
            index += 1;
            continue;
        }

        if (arg.startsWith("--build-outcome=")) {
            options.buildOutcome = readInlineOptionValue(
                arg,
                "--build-outcome"
            );
            continue;
        }

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

        if (arg === "--packaged-smoke-outcome") {
            options.packagedSmokeOutcome = readOptionValue(
                args,
                index,
                "--packaged-smoke-outcome"
            );
            index += 1;
            continue;
        }

        if (arg.startsWith("--packaged-smoke-outcome=")) {
            options.packagedSmokeOutcome = readInlineOptionValue(
                arg,
                "--packaged-smoke-outcome"
            );
            continue;
        }

        if (arg === "--matrix-os") {
            options.matrixOs = readOptionValue(args, index, "--matrix-os");
            index += 1;
            continue;
        }

        if (arg.startsWith("--matrix-os=")) {
            options.matrixOs = readInlineOptionValue(arg, "--matrix-os");
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
        requireOption(options.arch, "--arch or MATRIX_ARCH");
        requireOption(options.githubStepSummary, "GITHUB_STEP_SUMMARY");
        requireOption(options.jobStatus, "--job-status or JOB_STATUS");
        requireOption(options.matrixOs, "--matrix-os or MATRIX_OS");
        requireOption(options.version, "--version or BUILD_VERSION");
    }

    return options;
}

export function resolveBuildStatus(
    jobStatus,
    buildOutcome,
    packagedSmokeOutcome
) {
    if (buildOutcome === "failure") {
        return "failure";
    }

    if (packagedSmokeOutcome === "failure") {
        return "failure";
    }

    if (buildOutcome === "success" && packagedSmokeOutcome === "success") {
        return "success";
    }

    return jobStatus;
}

export function updateBuildMatrixSummary(options) {
    fs.appendFileSync(
        options.githubStepSummary,
        `${createBuildMatrixSummaryRow(options)}\n`
    );
}

function printUsage() {
    console.log(`Usage: node scripts/update-build-matrix-summary.mjs [options]

Options:
  --version <version>              Build version. Defaults to BUILD_VERSION.
  --matrix-os <name>               Matrix OS. Defaults to MATRIX_OS.
  --arch <name>                    Matrix arch. Defaults to MATRIX_ARCH.
  --job-status <status>            Job status. Defaults to JOB_STATUS.
  --build-outcome <outcome>        Build step outcome. Defaults to BUILD_APP_OUTCOME.
  --packaged-smoke-outcome <outcome>
                                   Packaged smoke step outcome. Defaults to PACKAGED_SMOKE_OUTCOME.
  --github-step-summary <path>     Summary file. Defaults to GITHUB_STEP_SUMMARY.
  -h, --help                       Show this help text.`);
}
