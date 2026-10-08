import { chmodSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
    findForbiddenWindowsPackagingArtifacts,
    findPackagedElectronExecutable,
    getPackagedExecutableCandidates,
    getPackagedLaunchArgs,
    parseArgs,
    runPackagedSmoke,
} from "../../../scripts/run-packaged-smoke.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: {
        cwd: string;
        encoding: string;
        env: NodeJS.ProcessEnv;
        killSignal: string;
        stdio: (number | string)[];
        timeout: number;
    }
) => {
    error?: NodeJS.ErrnoException;
    signal?: string | null;
    status: number | null;
    stderr?: string;
    stdout?: string;
};

let temporaryRoot: string | null = null;

function createTemporaryRoot(): string {
    temporaryRoot = path.join(os.tmpdir(), `ffv-packaged-smoke-${Date.now()}`);
    mkdirSync(temporaryRoot, { recursive: true });
    return temporaryRoot;
}

function writeExecutable(filePath: string): void {
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, "");
    chmodSync(filePath, 0o755);
}

afterEach(() => {
    if (temporaryRoot) {
        rmSync(temporaryRoot, { force: true, recursive: true });
        temporaryRoot = null;
    }
});

describe("run-packaged-smoke script", () => {
    it("parses executable and release-dist arguments", () => {
        expect.assertions(3);

        expect(parseArgs(["--executable", "app.exe"])).toStrictEqual({
            executablePath: "app.exe",
            fixturePath: undefined,
            releaseDistPath: undefined,
            startupTimeoutMs: undefined,
        });
        expect(parseArgs(["--release-dist=dist"])).toStrictEqual({
            executablePath: undefined,
            fixturePath: undefined,
            releaseDistPath: "dist",
            startupTimeoutMs: undefined,
        });
        expect(() => parseArgs(["--executable"])).toThrow(
            "--executable requires a value"
        );
    });

    it("resolves platform-specific unpacked executable candidates", () => {
        expect.assertions(3);

        const releaseDistPath = path.join("tmp", "release-dist");

        expect(
            getPackagedExecutableCandidates({
                platform: "win32",
                releaseDistPath,
            })
        ).toStrictEqual([
            path.join(releaseDistPath, "win-unpacked", "Fit File Viewer.exe"),
        ]);
        expect(
            getPackagedExecutableCandidates({
                platform: "darwin",
                releaseDistPath,
            }).some((candidate) =>
                candidate.endsWith(
                    path.join(
                        "Fit File Viewer.app",
                        "Contents",
                        "MacOS",
                        "Fit File Viewer"
                    )
                )
            )
        ).toBe(true);
        expect(
            getPackagedExecutableCandidates({
                platform: "linux",
                releaseDistPath,
            })
        ).toContain(
            path.join(releaseDistPath, "linux-unpacked", "fitfileviewer")
        );
    });

    it("finds the packaged executable from release-dist", () => {
        expect.assertions(2);

        const releaseDistPath = createTemporaryRoot();
        const linuxExecutablePath = path.join(
            releaseDistPath,
            "linux-unpacked",
            "fitfileviewer"
        );
        writeExecutable(linuxExecutablePath);

        expect(
            findPackagedElectronExecutable({
                platform: "linux",
                releaseDistPath,
            })
        ).toBe(linuxExecutablePath);
        expect(() =>
            findPackagedElectronExecutable({
                executablePath: path.join(releaseDistPath, "missing"),
            })
        ).toThrow("Packaged Electron executable not found");
    });

    it("finds known Squirrel.Windows package artifacts", () => {
        expect.assertions(1);

        const releaseDistPath = createTemporaryRoot();
        const forbiddenPaths = [
            path.join(releaseDistPath, "squirrel-windows"),
            path.join(
                releaseDistPath,
                "win-unpacked",
                "Fit File Viewer_ExecutionStub.exe"
            ),
            path.join(releaseDistPath, "win-unpacked", "Squirrel.exe"),
            path.join(releaseDistPath, "FitFileViewer-30.0.1-full.nupkg"),
            path.join(
                releaseDistPath,
                "Fit-File-Viewer-squirrel-x64-30.0.1.exe"
            ),
        ];
        mkdirSync(forbiddenPaths[0], { recursive: true });
        for (const forbiddenPath of forbiddenPaths.slice(1)) {
            writeExecutable(forbiddenPath);
        }

        expect(
            findForbiddenWindowsPackagingArtifacts(releaseDistPath)
        ).toStrictEqual(forbiddenPaths.sort());
    });

    it("rejects Squirrel.Windows artifacts before launching an app", () => {
        expect.assertions(2);

        const releaseDistPath = createTemporaryRoot();
        const executablePath = path.join(
            releaseDistPath,
            "win-unpacked",
            "Fit File Viewer.exe"
        );
        writeExecutable(executablePath);
        writeExecutable(
            path.join(
                releaseDistPath,
                "win-unpacked",
                "Fit File Viewer_ExecutionStub.exe"
            )
        );
        const commandRunner = vi.fn<CommandRunner>();

        expect(() =>
            runPackagedSmoke(
                ["--executable", executablePath],
                {},
                commandRunner
            )
        ).toThrow("forbidden Squirrel.Windows packaging artifacts");
        expect(commandRunner).not.toHaveBeenCalled();
    });

    it("allows Electron's macOS Squirrel updater framework", () => {
        expect.assertions(1);

        const releaseDistPath = createTemporaryRoot();
        mkdirSync(
            path.join(
                releaseDistPath,
                "mac-arm64",
                "Fit File Viewer.app",
                "Contents",
                "Frameworks",
                "Squirrel.framework"
            ),
            { recursive: true }
        );

        expect(
            findForbiddenWindowsPackagingArtifacts(releaseDistPath)
        ).toStrictEqual([]);
    });

    it("requires a nonce-bound report from a visible UI with parsed FIT data", () => {
        expect.assertions(6);
        const executablePath = path.join(createTemporaryRoot(), "app.exe");
        writeExecutable(executablePath);
        const commandRunner = vi
            .fn<CommandRunner>()
            .mockImplementation((_command, _args, options) => {
                writeFileSync(
                    path.join(
                        String(options.env.FFV_SMOKE_DIRECTORY),
                        "report.json"
                    ),
                    JSON.stringify({
                        nonce: options.env.FFV_SMOKE_NONCE,
                        status: "passed",
                        visible: true,
                        activity: {
                            recordCount: 1285,
                            sessionCount: 1,
                            appInitialized: true,
                            mapReady: true,
                            routeCount: 58,
                        },
                    })
                );
                return { status: 0 };
            });
        const logger = vi.fn();
        expect(
            runPackagedSmoke(
                ["--executable", executablePath],
                {},
                commandRunner,
                logger
            )
        ).toBe(0);
        const [
            _command,
            args,
            options,
        ] = commandRunner.mock.calls[0]!;
        expect(args).toContain("--ffv-smoke-test");
        expect(options.env.FFV_SMOKE_FIXTURE).toMatch(/\.fit$/u);
        expect(options.env.NODE_ENV).toBe("production");
        expect(options.timeout).toBe(60_000);
        expect(logger).toHaveBeenCalledWith(
            expect.stringContaining("Verified visible renderer")
        );
        rmSync(String(options.env.FFV_SMOKE_DIRECTORY), {
            force: true,
            recursive: true,
        });
    });

    it.each([
        { status: null, signal: "SIGSEGV" },
        { status: null, signal: "SIGABRT" },
        { status: null, signal: "SIGKILL" },
        { status: 1 },
        { status: null },
        {
            status: 0,
            error: Object.assign(new Error("timeout"), { code: "ETIMEDOUT" }),
        },
    ])("rejects unsuccessful process completion %j", (result) => {
        expect.assertions(1);
        const executablePath = path.join(createTemporaryRoot(), "app.exe");
        writeExecutable(executablePath);
        const commandRunner = vi.fn<CommandRunner>().mockReturnValue(result);
        expect(() =>
            runPackagedSmoke(
                ["--executable", executablePath],
                {},
                commandRunner
            )
        ).toThrow("did not complete");
        const options = commandRunner.mock.calls[0]![2];
        rmSync(String(options.env.FFV_SMOKE_DIRECTORY), {
            force: true,
            recursive: true,
        });
    });

    it.each([
        undefined,
        {
            status: "passed",
            visible: true,
        },
        {
            status: "passed",
            visible: true,
            activity: null,
        },
        {
            status: "passed",
            visible: true,
            activity: "untrusted report data",
        },
        {
            nonce: "forged",
            status: "passed",
            visible: true,
            activity: { recordCount: 1, sessionCount: 1 },
        },
        {
            status: "failed",
            visible: true,
            activity: { recordCount: 1, sessionCount: 1 },
        },
        {
            status: "passed",
            visible: false,
            activity: { recordCount: 1, sessionCount: 1 },
        },
        {
            status: "passed",
            visible: true,
            activity: { recordCount: 0, sessionCount: 1 },
        },
        {
            status: "passed",
            visible: true,
            activity: {
                recordCount: 1285,
                sessionCount: 1,
                appInitialized: false,
                mapReady: true,
                routeCount: 58,
            },
        },
        {
            status: "passed",
            visible: true,
            activity: {
                recordCount: 1285,
                sessionCount: 1,
                appInitialized: true,
                mapReady: false,
                routeCount: 0,
            },
        },
    ])("rejects missing or invalid readiness evidence %j", (report) => {
        expect.assertions(1);
        const executablePath = path.join(createTemporaryRoot(), "app.exe");
        writeExecutable(executablePath);
        const commandRunner = vi
            .fn<CommandRunner>()
            .mockImplementation((_command, _args, options) => {
                if (report)
                    writeFileSync(
                        path.join(
                            String(options.env.FFV_SMOKE_DIRECTORY),
                            "report.json"
                        ),
                        JSON.stringify({
                            nonce: options.env.FFV_SMOKE_NONCE,
                            ...report,
                        })
                    );
                return { status: 0 };
            });
        expect(() =>
            runPackagedSmoke(
                ["--executable", executablePath],
                {},
                commandRunner
            )
        ).toThrow(/readiness report/u);
        const options = commandRunner.mock.calls[0]![2];
        rmSync(String(options.env.FFV_SMOKE_DIRECTORY), {
            force: true,
            recursive: true,
        });
    });

    it.each([
        [
            "FFV_SMOKE_EXPECTED_ARCH",
            "arm64",
            "architecture",
        ],
        [
            "FFV_SMOKE_EXPECTED_VERSION",
            "30.0.4",
            "version",
        ],
    ])("checks reported identity against %s", (key, value, failure) => {
        expect.assertions(1);
        const executablePath = path.join(createTemporaryRoot(), "app.exe");
        writeExecutable(executablePath);
        const commandRunner = vi
            .fn<CommandRunner>()
            .mockImplementation((_command, _args, options) => {
                writeFileSync(
                    path.join(
                        String(options.env.FFV_SMOKE_DIRECTORY),
                        "report.json"
                    ),
                    JSON.stringify({
                        nonce: options.env.FFV_SMOKE_NONCE,
                        status: "passed",
                        visible: true,
                        activity: {
                            recordCount: 1285,
                            sessionCount: 1,
                            appInitialized: true,
                            mapReady: true,
                            routeCount: 58,
                        },
                        arch: "x64",
                        version: "30.0.3",
                    })
                );
                return { status: 0 };
            });
        expect(() =>
            runPackagedSmoke(
                ["--executable", executablePath],
                { [key]: value },
                commandRunner
            )
        ).toThrow(failure);
        rmSync(
            String(commandRunner.mock.calls[0]![2].env.FFV_SMOKE_DIRECTORY),
            { force: true, recursive: true }
        );
    });

    it("never excuses failed HTML loading based on a display log", () => {
        expect.assertions(1);
        const executablePath = path.join(createTemporaryRoot(), "app.exe");
        writeExecutable(executablePath);
        const commandRunner = vi.fn<CommandRunner>().mockReturnValue({
            status: 0,
            stderr: "Window displayed successfully\nError loading main HTML file ERR_FAILED",
        });
        expect(() =>
            runPackagedSmoke(
                ["--executable", executablePath],
                {},
                commandRunner
            )
        ).toThrow("failure marker");
        rmSync(
            String(commandRunner.mock.calls[0]![2].env.FFV_SMOKE_DIRECTORY),
            { force: true, recursive: true }
        );
    });

    it("disables Chromium's setuid sandbox only on Linux CI runners", () => {
        expect.assertions(3);
        expect(getPackagedLaunchArgs({ CI: "true" }, "linux")).toContain(
            "--no-sandbox"
        );
        expect(getPackagedLaunchArgs({}, "linux")).not.toContain(
            "--no-sandbox"
        );
        expect(getPackagedLaunchArgs({ CI: "true" }, "darwin")).not.toContain(
            "--no-sandbox"
        );
    });

    it.each([
        "1000oops",
        "1500.5",
        "999",
        "Infinity",
    ])("rejects invalid timeout %s", (timeout) => {
        expect.assertions(1);
        expect(() => parseArgs(["--startup-timeout-ms", timeout])).toThrow(
            "integer >= 1000"
        );
    });
});
