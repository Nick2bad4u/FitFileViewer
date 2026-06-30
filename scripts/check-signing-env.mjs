import process from "node:process";
import { pathToFileURL } from "node:url";

import { getCodeSigningValidationErrors } from "./run-electron-builder.mjs";

const runnerOsToPlatform = {
    Linux: "linux",
    macOS: "darwin",
    Windows: "win32",
};
const signingRequiredPlatforms = new Set(["darwin", "win32"]);

export function parseArgs(argv) {
    let platform;
    let requireSigning;
    let runnerOs;

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === "--platform") {
            platform = argv[index + 1];
            if (!platform || platform.startsWith("-")) {
                throw new Error("--platform requires a value");
            }

            index += 1;
            continue;
        }

        if (arg.startsWith("--platform=")) {
            platform = arg.slice("--platform=".length);
            if (!platform) {
                throw new Error("--platform must not be empty");
            }

            continue;
        }

        if (arg === "--runner-os") {
            runnerOs = argv[index + 1];
            if (!runnerOs || runnerOs.startsWith("-")) {
                throw new Error("--runner-os requires a value");
            }

            index += 1;
            continue;
        }

        if (arg.startsWith("--runner-os=")) {
            runnerOs = arg.slice("--runner-os=".length);
            if (!runnerOs) {
                throw new Error("--runner-os must not be empty");
            }

            continue;
        }

        if (arg === "--require-signing") {
            requireSigning = true;
            continue;
        }

        if (arg === "--optional-signing") {
            requireSigning = false;
            continue;
        }

        throw new Error(`Unknown argument: ${arg}`);
    }

    return { platform, requireSigning, runnerOs };
}

export function resolveSigningPlatform({ platform, runnerOs } = {}) {
    if (platform) {
        return platform;
    }

    const normalizedRunnerOs = runnerOs ?? process.env.RUNNER_OS;
    if (
        normalizedRunnerOs &&
        Object.hasOwn(runnerOsToPlatform, normalizedRunnerOs)
    ) {
        return runnerOsToPlatform[normalizedRunnerOs];
    }

    return process.platform;
}

export function getSigningPreflightReport(
    environment = process.env,
    platform = resolveSigningPlatform(),
    options = {}
) {
    const signingRequested =
        options.requireSigning ?? environment.REQUIRE_CODE_SIGNING === "true";
    const signingRequired =
        signingRequested && signingRequiredPlatforms.has(platform);
    const validationEnvironment = {
        ...environment,
        REQUIRE_CODE_SIGNING: signingRequired ? "true" : "false",
    };
    const errors = getCodeSigningValidationErrors(
        validationEnvironment,
        platform
    );

    return {
        errors,
        platform,
        signingRequired,
        valid: errors.length === 0,
    };
}

export function runSigningPreflight(
    argv = process.argv.slice(2),
    environment = process.env,
    output = {
        error: console.error,
        log: console.log,
    }
) {
    const { platform, requireSigning, runnerOs } = parseArgs(argv);
    const report = getSigningPreflightReport(
        environment,
        resolveSigningPlatform({ platform, runnerOs }),
        { requireSigning }
    );

    if (!report.signingRequired) {
        output.log(
            `[signing] Code signing is not required for ${report.platform}; skipping preflight.`
        );
        return 0;
    }

    if (report.valid) {
        output.log(
            `[signing] Code signing environment is complete for ${report.platform}.`
        );
        return 0;
    }

    output.error(
        [
            `[signing] Code signing is required for ${report.platform}, but the signing environment is incomplete.`,
            ...report.errors.map((error) => `- ${error}`),
        ].join("\n")
    );
    return 1;
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    process.exitCode = runSigningPreflight();
}
