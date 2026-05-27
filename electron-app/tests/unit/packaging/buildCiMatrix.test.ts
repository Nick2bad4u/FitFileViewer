import path from "node:path";

import { describe, expect, it } from "vitest";

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
            runCommand?: (command: string, args: string[]) => number;
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
            runCommand: (command: string, args: string[]) => number;
            sleep: (delaySeconds: number) => void;
        }
    ) => number;
    shouldRetryElectronBuilder: (options: { matrixOs: string }) => boolean;
};

async function importBuildCiMatrix(): Promise<BuildCiMatrixModule> {
    return (await import("../../../../scripts/build-ci-matrix.mjs")) as BuildCiMatrixModule;
}

describe("build-ci-matrix script", () => {
    it("selects electron-builder args for the GitHub build matrix", async () => {
        expect.assertions(8);

        const { getElectronBuilderArgs } = await importBuildCiMatrix();

        expect(
            getElectronBuilderArgs({
                arch: "x64",
                matrixOs: "windows-latest",
                runnerOs: "Windows",
            })
        ).toStrictEqual([
            "--win",
            "--publish",
            "never",
        ]);
        expect(
            getElectronBuilderArgs({
                arch: "ia32",
                matrixOs: "windows-latest",
                runnerOs: "Windows",
            })
        ).toStrictEqual([
            "--win",
            "--ia32",
            "--publish",
            "never",
        ]);
        expect(
            getElectronBuilderArgs({
                arch: "arm64",
                matrixOs: "macos-15",
                runnerOs: "macOS",
            })
        ).toStrictEqual([
            "--arm64",
            "--publish",
            "never",
        ]);
        expect(
            getElectronBuilderArgs({
                arch: "universal",
                matrixOs: "macos-latest",
                runnerOs: "macOS",
            })
        ).toStrictEqual([
            "--universal",
            "--publish",
            "never",
        ]);
        expect(
            getElectronBuilderArgs({
                arch: "x64",
                matrixOs: "macos-15-intel",
                runnerOs: "macOS",
            })
        ).toStrictEqual([
            "--mac",
            "--x64",
            "--publish",
            "never",
        ]);
        expect(
            getElectronBuilderArgs({
                arch: "arm64",
                matrixOs: "ubuntu-24.04-arm",
                runnerOs: "Linux",
            })
        ).toStrictEqual([
            "--linux",
            "--arm64",
            "--publish",
            "never",
        ]);
        expect(
            getElectronBuilderArgs({
                arch: "x64",
                matrixOs: "ubuntu-latest",
                runnerOs: "Linux",
            })
        ).toStrictEqual([
            "--linux",
            "--x64",
            "--publish",
            "never",
        ]);
        expect(
            getElectronBuilderArgs({
                arch: "arm64",
                matrixOs: "custom-runner",
                runnerOs: "Linux",
            })
        ).toStrictEqual([
            "--arm64",
            "--publish",
            "never",
        ]);
    });

    it("retries only macOS builder runs", async () => {
        expect.assertions(4);

        const { shouldRetryElectronBuilder } = await importBuildCiMatrix();

        expect(shouldRetryElectronBuilder({ matrixOs: "macos-15" })).toBe(true);
        expect(shouldRetryElectronBuilder({ matrixOs: "macos-latest" })).toBe(
            true
        );
        expect(shouldRetryElectronBuilder({ matrixOs: "macos-15-intel" })).toBe(
            true
        );
        expect(shouldRetryElectronBuilder({ matrixOs: "windows-latest" })).toBe(
            false
        );
    });

    it("runs runtime build before electron-builder for non-retry builds", async () => {
        expect.assertions(2);

        const { buildCiMatrix } = await importBuildCiMatrix();
        const commands: string[] = [];

        const exitCode = buildCiMatrix(
            {
                arch: "x64",
                matrixOs: "windows-latest",
                runnerOs: "Windows",
            },
            {
                runCommand(command, args) {
                    commands.push([command, ...args].join(" "));
                    return 0;
                },
            }
        );

        expect(exitCode).toBe(0);
        expect(commands).toStrictEqual([
            expect.stringMatching(/npm(?:\.cmd)? run build:runtime-ts/u),
            [
                process.execPath,
                path.join("scripts", "run-electron-builder.mjs"),
                "--win",
                "--publish",
                "never",
            ].join(" "),
        ]);
    });

    it("stops before electron-builder when runtime build fails", async () => {
        expect.assertions(2);

        const { buildCiMatrix } = await importBuildCiMatrix();
        let commandCount = 0;

        const exitCode = buildCiMatrix(
            {
                arch: "x64",
                matrixOs: "windows-latest",
                runnerOs: "Windows",
            },
            {
                runCommand() {
                    commandCount += 1;
                    return 2;
                },
            }
        );

        expect(exitCode).toBe(2);
        expect(commandCount).toBe(1);
    });

    it("cleans release output and retries macOS electron-builder failures", async () => {
        expect.assertions(4);

        const { retryElectronBuilder } = await importBuildCiMatrix();
        const removedDirectories: string[] = [];
        const sleepDelays: number[] = [];
        const exitCodes = [1, 0];

        const exitCode = retryElectronBuilder(
            [
                "--universal",
                "--publish",
                "never",
            ],
            {
                initialRetryDelaySeconds: 15,
                log() {},
                maxAttempts: 3,
                releaseDirectory: "electron-app/release",
                removeDirectory(directory) {
                    removedDirectories.push(directory);
                },
                runCommand() {
                    return exitCodes.shift() ?? 1;
                },
                sleep(delaySeconds) {
                    sleepDelays.push(delaySeconds);
                },
            }
        );

        expect(exitCode).toBe(0);
        expect(removedDirectories).toStrictEqual([
            "electron-app/release",
            "electron-app/release",
        ]);
        expect(sleepDelays).toStrictEqual([15]);
        expect(exitCodes).toStrictEqual([]);
    });

    it("returns the final macOS builder failure after the last retry", async () => {
        expect.assertions(2);

        const { retryElectronBuilder } = await importBuildCiMatrix();
        const logMessages: string[] = [];

        const exitCode = retryElectronBuilder(
            [
                "--arm64",
                "--publish",
                "never",
            ],
            {
                initialRetryDelaySeconds: 1,
                log(message) {
                    logMessages.push(message);
                },
                maxAttempts: 2,
                releaseDirectory: "electron-app/release",
                removeDirectory() {},
                runCommand() {
                    return 7;
                },
                sleep() {},
            }
        );

        expect(exitCode).toBe(7);
        expect(logMessages.at(-1)).toBe(
            "Command failed after 2 attempts (exit code 7)."
        );
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
        expect.assertions(1);

        const { parseArgs } = await importBuildCiMatrix();

        expect(() => parseArgs(["--runner-os=Linux"], {})).toThrow(
            "--matrix-os or MATRIX_OS is required"
        );
    });

    it("prints selected builder args in dry run mode", async () => {
        expect.assertions(1);

        const { getDryRunSummary } = await importBuildCiMatrix();

        expect(
            getDryRunSummary({
                arch: "x64",
                matrixOs: "ubuntu-latest",
                runnerOs: "Linux",
            })
        ).toContain("builderArgs=--linux --x64 --publish never");
    });
});
