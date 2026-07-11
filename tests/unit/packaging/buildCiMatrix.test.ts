import { describe, expect, it } from "vitest";

import {
    repositoryRoot,
    rootReleaseDistPath,
    runElectronBuilderScriptPath,
} from "../../../scripts/lib/workspaces.mjs";

type CommandRunOptions = {
    cwd: string;
};

type CommandCall = {
    args: string[];
    command: string;
    cwd: string | undefined;
};

type BuildCiMatrixModule = {
    buildCiMatrix: (
        options: {
            arch: string;
            dryRun?: boolean;
            initialRetryDelaySeconds?: number;
            matrixOs: string;
            maxMacosAttempts?: number;
            releaseDirectory?: string;
            runnerOs: string;
        },
        dependencies?: {
            log?: (message: string) => void;
            removeDirectory?: (directory: string) => void;
            runCommand?: (
                command: string,
                args: string[],
                options: CommandRunOptions
            ) => number;
            sleep?: (delaySeconds: number) => void;
        }
    ) => number;
    defaultReleaseDirectory: string;
    getDryRunSummary: (options: {
        arch: string;
        matrixOs: string;
        runnerOs: string;
    }) => string;
    getElectronBuilderArgs: (options: {
        arch: string;
        matrixOs: string;
        runnerOs: string;
    }) => string[];
    getNpmInvocation: (
        environment?: Record<string, string | undefined>,
        platform?: string
    ) => { args: string[]; command: string };
    parseArgs: (
        args: string[],
        environment?: Record<string, string | undefined>
    ) => {
        arch: string;
        dryRun: boolean;
        help: boolean;
        initialRetryDelaySeconds: number;
        matrixOs: string;
        maxMacosAttempts: number;
        releaseDirectory: string;
        runnerOs: string;
    };
    retryElectronBuilder: (
        builderArgs: string[],
        options: {
            initialRetryDelaySeconds: number;
            log: (message: string) => void;
            maxAttempts: number;
            releaseDirectory: string;
            removeDirectory: (directory: string) => void;
            runCommand: (
                command: string,
                args: string[],
                options: CommandRunOptions
            ) => number;
            sleep: (delaySeconds: number) => void;
        }
    ) => number;
    shouldRetryElectronBuilder: (options: { matrixOs: string }) => boolean;
};

async function importBuildCiMatrix(): Promise<BuildCiMatrixModule> {
    return (await import("../../../scripts/build-ci-matrix.mjs")) as BuildCiMatrixModule;
}

describe("build-ci-matrix script", () => {
    it("selects electron-builder args for the GitHub build matrix", async () => {
        expect.assertions(1);

        const { getElectronBuilderArgs } = await importBuildCiMatrix();
        const matrixCases = [
            {
                arch: "x64",
                builderArgs: [
                    "--win",
                    "--publish",
                    "never",
                ],
                matrixOs: "windows-latest",
                runnerOs: "Windows",
            },
            {
                arch: "ia32",
                builderArgs: [
                    "--win",
                    "--ia32",
                    "--publish",
                    "never",
                ],
                matrixOs: "windows-latest",
                runnerOs: "Windows",
            },
            {
                arch: "arm64",
                builderArgs: [
                    "--arm64",
                    "--publish",
                    "never",
                ],
                matrixOs: "macos-15",
                runnerOs: "macOS",
            },
            {
                arch: "universal",
                builderArgs: [
                    "--universal",
                    "--publish",
                    "never",
                ],
                matrixOs: "macos-latest",
                runnerOs: "macOS",
            },
            {
                arch: "x64",
                builderArgs: [
                    "--mac",
                    "--x64",
                    "--publish",
                    "never",
                ],
                matrixOs: "macos-15-intel",
                runnerOs: "macOS",
            },
            {
                arch: "arm64",
                builderArgs: [
                    "--linux",
                    "--arm64",
                    "--publish",
                    "never",
                ],
                matrixOs: "ubuntu-24.04-arm",
                runnerOs: "Linux",
            },
            {
                arch: "x64",
                builderArgs: [
                    "--linux",
                    "--x64",
                    "--publish",
                    "never",
                ],
                matrixOs: "ubuntu-latest",
                runnerOs: "Linux",
            },
            {
                arch: "arm64",
                builderArgs: [
                    "--arm64",
                    "--publish",
                    "never",
                ],
                matrixOs: "custom-runner",
                runnerOs: "Linux",
            },
        ];

        expect(
            matrixCases.map(({ builderArgs, ...options }) => ({
                ...options,
                builderArgs: getElectronBuilderArgs(options),
                expectedBuilderArgs: builderArgs,
            }))
        ).toStrictEqual(
            matrixCases.map(({ builderArgs, ...options }) => ({
                ...options,
                builderArgs,
                expectedBuilderArgs: builderArgs,
            }))
        );
    });

    it("retries only macOS builder runs", async () => {
        expect.assertions(1);

        const { shouldRetryElectronBuilder } = await importBuildCiMatrix();

        expect(
            [
                "macos-15",
                "macos-latest",
                "macos-15-intel",
                "windows-latest",
            ].map((matrixOs) => ({
                matrixOs,
                shouldRetry: shouldRetryElectronBuilder({ matrixOs }),
            }))
        ).toStrictEqual([
            { matrixOs: "macos-15", shouldRetry: true },
            { matrixOs: "macos-latest", shouldRetry: true },
            { matrixOs: "macos-15-intel", shouldRetry: true },
            { matrixOs: "windows-latest", shouldRetry: false },
        ]);
    });

    it("runs runtime build before electron-builder for non-retry builds", async () => {
        expect.assertions(1);

        const { buildCiMatrix, getNpmInvocation } = await importBuildCiMatrix();
        const commandCalls: CommandCall[] = [];
        const npmInvocation = getNpmInvocation();

        const exitCode = buildCiMatrix(
            {
                arch: "x64",
                matrixOs: "windows-latest",
                runnerOs: "Windows",
            },
            {
                runCommand(command, args, options) {
                    commandCalls.push({ args, command, cwd: options.cwd });
                    return 0;
                },
            }
        );

        expect({ commandCalls, exitCode }).toStrictEqual({
            commandCalls: [
                {
                    args: [
                        ...npmInvocation.args,
                        "run",
                        "build:runtime-ts",
                    ],
                    command: npmInvocation.command,
                    cwd: repositoryRoot,
                },
                {
                    args: [
                        runElectronBuilderScriptPath,
                        "--win",
                        "--publish",
                        "never",
                    ],
                    command: process.execPath,
                    cwd: repositoryRoot,
                },
            ],
            exitCode: 0,
        });
    });

    it("stops before electron-builder when runtime build fails", async () => {
        expect.assertions(1);

        const { buildCiMatrix, getNpmInvocation } = await importBuildCiMatrix();
        const commandCalls: CommandCall[] = [];
        const npmInvocation = getNpmInvocation();

        const exitCode = buildCiMatrix(
            {
                arch: "x64",
                matrixOs: "windows-latest",
                runnerOs: "Windows",
            },
            {
                runCommand(command, args, options) {
                    commandCalls.push({ args, command, cwd: options.cwd });
                    return 2;
                },
            }
        );

        expect({ commandCalls, exitCode }).toStrictEqual({
            commandCalls: [
                {
                    args: [
                        ...npmInvocation.args,
                        "run",
                        "build:runtime-ts",
                    ],
                    command: npmInvocation.command,
                    cwd: repositoryRoot,
                },
            ],
            exitCode: 2,
        });
    });

    it("resolves npm without spawning Windows command shims directly", async () => {
        expect.assertions(3);

        const { getNpmInvocation } = await importBuildCiMatrix();

        expect(
            getNpmInvocation({ npm_execpath: "C:\\npm\\npm-cli.js" }, "win32")
        ).toStrictEqual({
            args: ["C:\\npm\\npm-cli.js"],
            command: process.execPath,
        });
        expect(getNpmInvocation({}, "linux")).toStrictEqual({
            args: [],
            command: "npm",
        });
        expect(getNpmInvocation({ ComSpec: "cmd.exe" }, "win32")).toStrictEqual(
            {
                args: [
                    "/d",
                    "/s",
                    "/c",
                    "npm.cmd",
                ],
                command: "cmd.exe",
            }
        );
    });

    it("cleans release output and retries macOS electron-builder failures", async () => {
        expect.assertions(1);

        const { retryElectronBuilder } = await importBuildCiMatrix();
        const commandCalls: CommandCall[] = [];
        const logMessages: string[] = [];
        const removedDirectories: string[] = [];
        const sleepDelays: number[] = [];
        const exitCodes = [1, 0];
        const builderArgs = [
            "--universal",
            "--publish",
            "never",
        ];

        const exitCode = retryElectronBuilder(builderArgs, {
            initialRetryDelaySeconds: 15,
            log(message) {
                logMessages.push(message);
            },
            maxAttempts: 3,
            releaseDirectory: rootReleaseDistPath,
            removeDirectory(directory) {
                removedDirectories.push(directory);
            },
            runCommand(command, args, options) {
                commandCalls.push({ args, command, cwd: options.cwd });
                return exitCodes.shift() ?? 1;
            },
            sleep(delaySeconds) {
                sleepDelays.push(delaySeconds);
            },
        });

        expect({
            commandCalls,
            exitCode,
            logMessages,
            remainingExitCodes: exitCodes,
            removedDirectories,
            sleepDelays,
        }).toStrictEqual({
            commandCalls: [
                {
                    args: [runElectronBuilderScriptPath, ...builderArgs],
                    command: process.execPath,
                    cwd: repositoryRoot,
                },
                {
                    args: [runElectronBuilderScriptPath, ...builderArgs],
                    command: process.execPath,
                    cwd: repositoryRoot,
                },
            ],
            exitCode: 0,
            logMessages: [
                "Running: node scripts/run-electron-builder.mjs --universal --publish never (attempt 1/3)",
                "Command failed (exit code 1). Retrying in 15s...",
                "Running: node scripts/run-electron-builder.mjs --universal --publish never (attempt 2/3)",
            ],
            remainingExitCodes: [],
            removedDirectories: [rootReleaseDistPath, rootReleaseDistPath],
            sleepDelays: [15],
        });
    });

    it("returns the final macOS builder failure after the last retry", async () => {
        expect.assertions(1);

        const { retryElectronBuilder } = await importBuildCiMatrix();
        const commandCalls: CommandCall[] = [];
        const logMessages: string[] = [];
        const builderArgs = [
            "--arm64",
            "--publish",
            "never",
        ];

        const exitCode = retryElectronBuilder(builderArgs, {
            initialRetryDelaySeconds: 1,
            log(message) {
                logMessages.push(message);
            },
            maxAttempts: 2,
            releaseDirectory: rootReleaseDistPath,
            removeDirectory() {},
            runCommand(command, args, options) {
                commandCalls.push({ args, command, cwd: options.cwd });
                return 7;
            },
            sleep() {},
        });

        expect({ commandCalls, exitCode, logMessages }).toStrictEqual({
            commandCalls: [
                {
                    args: [runElectronBuilderScriptPath, ...builderArgs],
                    command: process.execPath,
                    cwd: repositoryRoot,
                },
                {
                    args: [runElectronBuilderScriptPath, ...builderArgs],
                    command: process.execPath,
                    cwd: repositoryRoot,
                },
            ],
            exitCode: 7,
            logMessages: [
                "Running: node scripts/run-electron-builder.mjs --arm64 --publish never (attempt 1/2)",
                "Command failed (exit code 7). Retrying in 1s...",
                "Running: node scripts/run-electron-builder.mjs --arm64 --publish never (attempt 2/2)",
                "Command failed after 2 attempts (exit code 7).",
            ],
        });
    });

    it("parses CLI arguments and environment defaults", async () => {
        expect.assertions(2);

        const { defaultReleaseDirectory, parseArgs } =
            await importBuildCiMatrix();

        expect(
            parseArgs([], {
                MATRIX_ARCH: "x64",
                MATRIX_OS: "ubuntu-latest",
                RUNNER_OS: "Linux",
            })
        ).toStrictEqual({
            arch: "x64",
            dryRun: false,
            help: false,
            initialRetryDelaySeconds: 15,
            matrixOs: "ubuntu-latest",
            maxMacosAttempts: 3,
            releaseDirectory: defaultReleaseDirectory,
            runnerOs: "Linux",
        });
        expect(
            parseArgs(
                [
                    "--runner-os=macOS",
                    "--matrix-os",
                    "macos-latest",
                    "--arch=universal",
                    "--dry-run",
                    "--max-macos-attempts",
                    "4",
                    "--initial-retry-delay-seconds=2",
                    "--release-directory",
                    "tmp/release",
                ],
                {}
            )
        ).toStrictEqual({
            arch: "universal",
            dryRun: true,
            help: false,
            initialRetryDelaySeconds: 2,
            matrixOs: "macos-latest",
            maxMacosAttempts: 4,
            releaseDirectory: "tmp/release",
            runnerOs: "macOS",
        });
    });

    it("rejects missing required matrix options", async () => {
        expect.assertions(4);

        const { parseArgs } = await importBuildCiMatrix();

        expect(() => parseArgs(["--runner-os=Linux"], {})).toThrow(
            "--matrix-os or MATRIX_OS is required"
        );
        expect(() => parseArgs(["--matrix-os=ubuntu-latest"], {})).toThrow(
            "--runner-os or RUNNER_OS is required"
        );
        expect(() =>
            parseArgs(["--runner-os=Linux", "--matrix-os=ubuntu-latest"], {})
        ).toThrow("--arch or MATRIX_ARCH is required");
        expect(parseArgs(["--help"], {})).toStrictEqual({
            arch: undefined,
            dryRun: false,
            help: true,
            initialRetryDelaySeconds: 15,
            matrixOs: undefined,
            maxMacosAttempts: 3,
            releaseDirectory: rootReleaseDistPath,
            runnerOs: undefined,
        });
    });

    it("prints selected builder args in dry run mode", async () => {
        expect.assertions(2);

        const { buildCiMatrix, getDryRunSummary } = await importBuildCiMatrix();
        const logMessages: string[] = [];
        const commandCalls: CommandCall[] = [];
        const dryRunOptions = {
            arch: "x64",
            dryRun: true,
            matrixOs: "ubuntu-latest",
            runnerOs: "Linux",
        };

        const exitCode = buildCiMatrix(dryRunOptions, {
            log(message) {
                logMessages.push(message);
            },
            runCommand(command, args, options) {
                commandCalls.push({ args, command, cwd: options.cwd });
                return 0;
            },
        });

        expect({ commandCalls, exitCode, logMessages }).toStrictEqual({
            commandCalls: [],
            exitCode: 0,
            logMessages: [getDryRunSummary(dryRunOptions)],
        });
        expect(logMessages[0]).toBe(
            [
                "[build-ci-matrix] Dry run",
                "runnerOs=Linux",
                "matrixOs=ubuntu-latest",
                "arch=x64",
                "builderArgs=--linux --x64 --publish never",
                "retry=false",
            ].join("\n")
        );
    });
});
