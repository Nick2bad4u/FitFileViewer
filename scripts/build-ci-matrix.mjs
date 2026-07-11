import { spawnSync } from "node:child_process";
import fs from "node:fs";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    readInlineOptionValue,
    readOptionValue,
    requireOption,
} from "./lib/cli-options.mjs";
import {
    repositoryRoot,
    rootReleaseDistPath,
    runElectronBuilderScriptPath,
} from "./lib/workspaces.mjs";

export const defaultInitialRetryDelaySeconds = 15;
export const defaultMaxMacosAttempts = 3;
export const defaultReleaseDirectory = rootReleaseDistPath;

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const options = parseArgs(process.argv.slice(2), process.env);

    if (options.help) {
        printUsage();
    } else {
        process.exitCode = buildCiMatrix(options);
    }
}

export function buildCiMatrix(options, dependencies = {}) {
    const runCommand = dependencies.runCommand ?? runCommandSync;
    const sleep = dependencies.sleep ?? sleepSync;
    const removeDirectory = dependencies.removeDirectory ?? removeDirectorySync;
    const log = dependencies.log ?? console.log;

    if (options.dryRun) {
        log(getDryRunSummary(options));
        return 0;
    }

    const runtimeResult = runRuntimeBuild({ runCommand });
    if (runtimeResult !== 0) {
        return runtimeResult;
    }

    const builderArgs = getElectronBuilderArgs(options);

    if (!shouldRetryElectronBuilder(options)) {
        return runElectronBuilder(builderArgs, { runCommand });
    }

    return retryElectronBuilder(builderArgs, {
        initialRetryDelaySeconds:
            options.initialRetryDelaySeconds ?? defaultInitialRetryDelaySeconds,
        log,
        maxAttempts: options.maxMacosAttempts ?? defaultMaxMacosAttempts,
        releaseDirectory: options.releaseDirectory ?? defaultReleaseDirectory,
        removeDirectory,
        runCommand,
        sleep,
    });
}

export function getDryRunSummary(options) {
    return [
        "[build-ci-matrix] Dry run",
        `runnerOs=${options.runnerOs}`,
        `matrixOs=${options.matrixOs}`,
        `arch=${options.arch}`,
        `builderArgs=${getElectronBuilderArgs(options).join(" ")}`,
        `retry=${shouldRetryElectronBuilder(options)}`,
    ].join("\n");
}

export function getElectronBuilderArgs({ arch, matrixOs, runnerOs }) {
    if (runnerOs === "Windows") {
        return getWindowsBuilderArgs(arch);
    }

    if (matrixOs === "macos-15") {
        return [
            "--arm64",
            "--publish",
            "never",
        ];
    }

    if (matrixOs === "macos-latest") {
        return [
            "--universal",
            "--publish",
            "never",
        ];
    }

    if (matrixOs === "macos-15-intel") {
        return [
            "--mac",
            `--${arch}`,
            "--publish",
            "never",
        ];
    }

    if (matrixOs === "windows-latest") {
        return getWindowsBuilderArgs(arch);
    }

    if (matrixOs === "ubuntu-24.04-arm") {
        return [
            "--linux",
            "--arm64",
            "--publish",
            "never",
        ];
    }

    if (matrixOs === "ubuntu-latest") {
        return [
            "--linux",
            `--${arch}`,
            "--publish",
            "never",
        ];
    }

    return [
        `--${arch}`,
        "--publish",
        "never",
    ];
}

export function getNpmInvocation(
    environment = process.env,
    platform = process.platform
) {
    const npmExecPath = environment.npm_execpath;
    if (typeof npmExecPath === "string" && npmExecPath.trim() !== "") {
        return {
            args: [npmExecPath],
            command: process.execPath,
        };
    }

    if (platform === "win32") {
        return {
            args: [
                "/d",
                "/s",
                "/c",
                "npm.cmd",
            ],
            command: environment.ComSpec ?? "cmd.exe",
        };
    }

    return { args: [], command: "npm" };
}

export function parseArgs(args, environment = process.env) {
    const options = {
        arch: environment.MATRIX_ARCH,
        dryRun: false,
        help: false,
        initialRetryDelaySeconds: defaultInitialRetryDelaySeconds,
        matrixOs: environment.MATRIX_OS,
        maxMacosAttempts: defaultMaxMacosAttempts,
        releaseDirectory: defaultReleaseDirectory,
        runnerOs: environment.RUNNER_OS,
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

        if (arg === "--dry-run") {
            options.dryRun = true;
            continue;
        }

        if (arg === "--help" || arg === "-h") {
            options.help = true;
            continue;
        }

        if (arg === "--initial-retry-delay-seconds") {
            options.initialRetryDelaySeconds = readPositiveIntegerOption(
                args,
                index,
                "--initial-retry-delay-seconds"
            );
            index += 1;
            continue;
        }

        if (arg.startsWith("--initial-retry-delay-seconds=")) {
            options.initialRetryDelaySeconds = readPositiveIntegerInlineOption(
                arg,
                "--initial-retry-delay-seconds"
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

        if (arg === "--max-macos-attempts") {
            options.maxMacosAttempts = readPositiveIntegerOption(
                args,
                index,
                "--max-macos-attempts"
            );
            index += 1;
            continue;
        }

        if (arg.startsWith("--max-macos-attempts=")) {
            options.maxMacosAttempts = readPositiveIntegerInlineOption(
                arg,
                "--max-macos-attempts"
            );
            continue;
        }

        if (arg === "--release-directory") {
            options.releaseDirectory = readOptionValue(
                args,
                index,
                "--release-directory"
            );
            index += 1;
            continue;
        }

        if (arg.startsWith("--release-directory=")) {
            options.releaseDirectory = readInlineOptionValue(
                arg,
                "--release-directory"
            );
            continue;
        }

        if (arg === "--runner-os") {
            options.runnerOs = readOptionValue(args, index, "--runner-os");
            index += 1;
            continue;
        }

        if (arg.startsWith("--runner-os=")) {
            options.runnerOs = readInlineOptionValue(arg, "--runner-os");
            continue;
        }

        throw new Error(`Unknown option: ${arg}`);
    }

    if (!options.help) {
        requireOption(options.runnerOs, "--runner-os or RUNNER_OS");
        requireOption(options.matrixOs, "--matrix-os or MATRIX_OS");
        requireOption(options.arch, "--arch or MATRIX_ARCH");
    }

    return options;
}

export function retryElectronBuilder(builderArgs, options) {
    let attempt = 1;
    let delaySeconds = options.initialRetryDelaySeconds;

    while (true) {
        options.log(
            `Running: node scripts/run-electron-builder.mjs ${builderArgs.join(
                " "
            )} (attempt ${attempt}/${options.maxAttempts})`
        );

        options.removeDirectory(options.releaseDirectory);

        const result = runElectronBuilder(builderArgs, {
            runCommand: options.runCommand,
        });

        if (result === 0) {
            return 0;
        }

        if (attempt >= options.maxAttempts) {
            options.log(
                `Command failed after ${attempt} attempts (exit code ${result}).`
            );
            return result;
        }

        options.log(
            `Command failed (exit code ${result}). Retrying in ${delaySeconds}s...`
        );
        options.sleep(delaySeconds);
        attempt += 1;
        delaySeconds *= 2;
    }
}

export function shouldRetryElectronBuilder({ matrixOs }) {
    return [
        "macos-15",
        "macos-latest",
        "macos-15-intel",
    ].includes(matrixOs);
}

function getWindowsBuilderArgs(arch) {
    if (arch === "x64") {
        return [
            "--win",
            "--publish",
            "never",
        ];
    }

    return [
        "--win",
        "--ia32",
        "--publish",
        "never",
    ];
}

function printUsage() {
    console.log(`Usage: node scripts/build-ci-matrix.mjs [options]

Options:
  --runner-os <name>                 GitHub runner OS, for example Windows, macOS, or Linux.
  --matrix-os <name>                 Build matrix os value.
  --arch <name>                      Build matrix arch value.
  --dry-run                          Print selected electron-builder args without running commands.
  --max-macos-attempts <count>       Max macOS builder attempts. Defaults to 3.
  --initial-retry-delay-seconds <n>  Initial macOS retry delay. Defaults to 15.
  --release-directory <path>         Release directory removed before macOS retries. Defaults to ${defaultReleaseDirectory}.
  -h, --help                         Show this help text.`);
}

function readPositiveIntegerInlineOption(arg, optionName) {
    return toPositiveInteger(
        readInlineOptionValue(arg, optionName),
        optionName
    );
}

function readPositiveIntegerOption(args, index, optionName) {
    return toPositiveInteger(
        readOptionValue(args, index, optionName),
        optionName
    );
}

function removeDirectorySync(directory) {
    fs.rmSync(directory, { force: true, recursive: true });
}

function runCommandSync(command, args, options = { cwd: repositoryRoot }) {
    const result = spawnSync(command, args, {
        cwd: options.cwd,
        stdio: "inherit",
    });

    if (result.error) {
        throw result.error;
    }

    return result.status ?? 1;
}

function runElectronBuilder(builderArgs, { runCommand }) {
    return runCommand(
        process.execPath,
        [runElectronBuilderScriptPath, ...builderArgs],
        { cwd: repositoryRoot }
    );
}

function runRuntimeBuild({ runCommand }) {
    const npmInvocation = getNpmInvocation();
    return runCommand(
        npmInvocation.command,
        [
            ...npmInvocation.args,
            "run",
            "build:runtime-ts",
        ],
        {
            cwd: repositoryRoot,
        }
    );
}

function sleepSync(delaySeconds) {
    Atomics.wait(
        new Int32Array(new SharedArrayBuffer(4)),
        0,
        0,
        delaySeconds * 1000
    );
}

function toPositiveInteger(value, optionName) {
    const parsed = Number.parseInt(value, 10);

    if (
        !Number.isSafeInteger(parsed) ||
        parsed < 1 ||
        String(parsed) !== value
    ) {
        throw new Error(`${optionName} requires a positive integer`);
    }

    return parsed;
}
