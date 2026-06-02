import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import { repositoryRoot } from "../../../scripts/lib/workspaces.mjs";

type CommandCall = {
    args: string[];
    command: string;
    options: {
        cwd: string;
        stdio: "inherit";
    };
};

type CommandRunner = (
    command: string,
    args: string[],
    options: CommandCall["options"]
) => void;

type FileSystem = {
    existsSync: (filePath: string) => boolean;
    rmSync: (
        filePath: string,
        options: { force: boolean; recursive: boolean }
    ) => void;
};

type Win7BuildModule = {
    createWin7BuildConfig: (options?: {
        files?: string[];
        output?: string;
        projectDir?: string;
    }) => {
        config: {
            artifactName: string;
            asar: boolean;
            directories: {
                output: string;
            };
            electronVersion: string;
            files: string[];
            npmRebuild: boolean;
            publish: null;
            win: {
                requestedExecutionLevel: string;
                target: string[];
            };
        };
        projectDir: string;
        targets: unknown;
    };
    resolveNpmCliPath: (options?: {
        environment?: Record<string, string | undefined>;
        executablePath?: string;
        fileSystem?: Pick<FileSystem, "existsSync">;
    }) => string | undefined;
    runNpmScript: (
        scriptName: string,
        options?: {
            commandRunner?: CommandRunner;
            environment?: Record<string, string | undefined>;
            executablePath?: string;
            fileSystem?: Pick<FileSystem, "existsSync">;
            platform?: NodeJS.Platform;
            repositoryRoot?: string;
        }
    ) => void;
    runWin7Build: (options?: {
        builder?: (options: unknown) => Promise<void>;
        commandRunner?: CommandRunner;
        environment?: Record<string, string | undefined>;
        errorLogger?: (message: string, error: unknown) => void;
        executablePath?: string;
        fileSystem?: FileSystem;
        logger?: (message: string) => void;
        outputDir?: string;
        platform?: NodeJS.Platform;
        repositoryRoot?: string;
    }) => Promise<number>;
    win7ElectronVersion: string;
};

async function importWin7Build(): Promise<Win7BuildModule> {
    return (await import("../../../scripts/build-win7.mjs")) as Win7BuildModule;
}

function makeCommandRecorder(): {
    calls: CommandCall[];
    commandRunner: CommandRunner;
} {
    const calls: CommandCall[] = [];

    return {
        calls,
        commandRunner(command, args, options) {
            calls.push({ args, command, options });
        },
    };
}

describe("build-win7 script", () => {
    it("resolves npm from npm_execpath before probing beside node", async () => {
        expect.assertions(1);

        const { resolveNpmCliPath } = await importWin7Build();

        expect(
            resolveNpmCliPath({
                environment: { npm_execpath: "C:/npm/bin/npm-cli.js" },
                executablePath: "C:/node/node.exe",
                fileSystem: { existsSync: () => true },
            })
        ).toBe("C:/npm/bin/npm-cli.js");
    });

    it("runs npm scripts from the repository root through the node npm CLI when available", async () => {
        expect.assertions(2);

        const { runNpmScript } = await importWin7Build();
        const { calls, commandRunner } = makeCommandRecorder();

        runNpmScript("build:runtime-ts", {
            commandRunner,
            environment: { npm_execpath: "C:/npm/bin/npm-cli.js" },
            executablePath: "C:/node/node.exe",
            repositoryRoot,
        });

        expect(calls).toStrictEqual([
            {
                args: [
                    "C:/npm/bin/npm-cli.js",
                    "run",
                    "build:runtime-ts",
                ],
                command: "C:/node/node.exe",
                options: {
                    cwd: repositoryRoot,
                    stdio: "inherit",
                },
            },
        ]);
        expect(
            calls.map((call) => ({
                cwdIsNestedElectronApp: path
                    .resolve(call.options.cwd)
                    .includes(`${path.sep}electron-app${path.sep}`),
                cwdRelativeToRepository: path.relative(
                    repositoryRoot,
                    path.resolve(call.options.cwd)
                ),
            }))
        ).toStrictEqual([
            {
                cwdIsNestedElectronApp: false,
                cwdRelativeToRepository: "",
            },
        ]);
    });

    it("falls back to the platform npm command when no npm CLI path exists", async () => {
        expect.assertions(1);

        const { runNpmScript } = await importWin7Build();
        const { calls, commandRunner } = makeCommandRecorder();

        runNpmScript("build:runtime-ts", {
            commandRunner,
            environment: {},
            executablePath: "C:/node/node.exe",
            fileSystem: { existsSync: () => false },
            platform: "win32",
            repositoryRoot,
        });

        expect(calls).toStrictEqual([
            {
                args: ["run", "build:runtime-ts"],
                command: "npm.cmd",
                options: {
                    cwd: repositoryRoot,
                    stdio: "inherit",
                },
            },
        ]);
    });

    it("creates the Electron 22 ia32 portable build config from root package files", async () => {
        expect.assertions(1);

        const { createWin7BuildConfig, win7ElectronVersion } =
            await importWin7Build();
        const output = path.join(repositoryRoot, "release-dist", "win7-test");

        const config = createWin7BuildConfig({
            files: ["dist/**", "package.json"],
            output,
            projectDir: repositoryRoot,
        });

        expect({
            artifactName: config.config.artifactName,
            asar: config.config.asar,
            electronVersion: config.config.electronVersion,
            files: config.config.files,
            output: config.config.directories.output,
            projectDir: config.projectDir,
            requestedExecutionLevel: config.config.win.requestedExecutionLevel,
            target: config.config.win.target,
        }).toStrictEqual({
            artifactName: "Fit-File-Viewer-win7-${arch}-${version}.${ext}",
            asar: false,
            electronVersion: win7ElectronVersion,
            files: ["dist/**", "package.json"],
            output,
            projectDir: repositoryRoot,
            requestedExecutionLevel: "asInvoker",
            target: ["portable"],
        });
    });

    it("runs the full Win7 build flow from the repository root", async () => {
        expect.assertions(1);

        const { runWin7Build, win7ElectronVersion } = await importWin7Build();
        const { calls, commandRunner } = makeCommandRecorder();
        const output = path.join(repositoryRoot, "release-dist", "win7-test");
        const fileSystem = {
            existsSync: () => false,
            rmSync: vi.fn<FileSystem["rmSync"]>(),
        };
        const builder = vi.fn<(options: unknown) => Promise<void>>(
            async () => {}
        );
        const logger = vi.fn<(message: string) => void>();

        const status = await runWin7Build({
            builder,
            commandRunner,
            environment: {},
            executablePath: process.execPath,
            fileSystem,
            logger,
            outputDir: output,
            platform: "linux",
            repositoryRoot,
        });

        const buildOptions = builder.mock.calls[0]?.[0] as ReturnType<
            Win7BuildModule["createWin7BuildConfig"]
        >;

        expect({
            buildElectronVersion: buildOptions.config.electronVersion,
            buildFiles: buildOptions.config.files,
            buildOutput: buildOptions.config.directories.output,
            buildProjectDir: buildOptions.projectDir,
            commandCalls: calls,
            logMessages: logger.mock.calls.map((call) => call[0]),
            removedOutput: fileSystem.rmSync.mock.calls,
            status,
        }).toStrictEqual({
            buildElectronVersion: win7ElectronVersion,
            buildFiles: ["dist/**", "package.json"],
            buildOutput: output,
            buildProjectDir: repositoryRoot,
            commandCalls: [
                {
                    args: ["run", "build:runtime-ts"],
                    command: "npm",
                    options: {
                        cwd: repositoryRoot,
                        stdio: "inherit",
                    },
                },
            ],
            logMessages: [
                "[win7-build] Starting Windows 7 compatibility build...",
                `🟢 [win7-build] Build finished. Artifacts available in ${output}`,
            ],
            removedOutput: [
                [
                    output,
                    {
                        force: true,
                        recursive: true,
                    },
                ],
            ],
            status: 0,
        });
    });

    it("returns failure without deleting paths outside the repository", async () => {
        expect.assertions(1);

        const { runWin7Build } = await importWin7Build();
        const { calls, commandRunner } = makeCommandRecorder();
        const fileSystem = {
            existsSync: () => false,
            rmSync: vi.fn<FileSystem["rmSync"]>(),
        };
        const builder = vi.fn<(options: unknown) => Promise<void>>(
            async () => {}
        );
        const errorLogger = vi.fn<(message: string, error: unknown) => void>();
        const output = path.join(repositoryRoot, "..", "win7-outside");

        const status = await runWin7Build({
            builder,
            commandRunner,
            errorLogger,
            fileSystem,
            logger: vi.fn<(message: string) => void>(),
            outputDir: output,
            repositoryRoot,
        });

        const loggedError = errorLogger.mock.calls[0]?.[1];

        expect({
            builderCalls: builder.mock.calls.length,
            commandCalls: calls.length,
            errorMessage:
                loggedError instanceof Error
                    ? loggedError.message
                    : String(loggedError),
            rmCalls: fileSystem.rmSync.mock.calls.length,
            status,
        }).toStrictEqual({
            builderCalls: 0,
            commandCalls: 0,
            errorMessage: `Refusing to operate outside repository: ${output}`,
            rmCalls: 0,
            status: 1,
        });
    });
});
