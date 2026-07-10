import { chmodSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
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
            releaseDistPath: undefined,
            startupTimeoutMs: undefined,
        });
        expect(parseArgs(["--release-dist=dist"])).toStrictEqual({
            executablePath: undefined,
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

    it("launches the packaged executable and treats timeout as a healthy startup", () => {
        expect.assertions(7);

        const releaseDistPath = createTemporaryRoot();
        const executablePath = path.join(
            releaseDistPath,
            "win-unpacked",
            "Fit File Viewer.exe"
        );
        writeExecutable(executablePath);

        const commandRunner = vi.fn<CommandRunner>().mockReturnValue({
            error: Object.assign(new Error("timed out"), {
                code: "ETIMEDOUT",
            }),
            status: null,
        });
        const logger = vi.fn<(message: string) => void>();

        expect(
            runPackagedSmoke(
                ["--executable", executablePath],
                { PATH: process.env.PATH },
                commandRunner,
                logger
            )
        ).toBe(0);

        const [
            command,
            args,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect(command).toBe(executablePath);
        expect(args).toStrictEqual(["--disable-http-cache"]);
        expect(options?.env.ELECTRON_IS_DEV).toBe("0");
        expect(options?.stdio).toHaveLength(3);
        expect(options?.timeout).toBe(10_000);
        expect(logger).toHaveBeenCalledWith(
            `[packaged-smoke] Launching ${executablePath} for 10000ms`
        );
    });

    it("treats a clean timeout shutdown as a healthy startup", () => {
        expect.assertions(1);

        const releaseDistPath = createTemporaryRoot();
        const executablePath = path.join(
            releaseDistPath,
            "win-unpacked",
            "Fit File Viewer.exe"
        );
        writeExecutable(executablePath);

        const commandRunner = vi.fn<CommandRunner>().mockReturnValue({
            error: Object.assign(new Error("timed out"), {
                code: "ETIMEDOUT",
            }),
            status: 0,
        });

        expect(
            runPackagedSmoke(
                ["--executable", executablePath],
                {},
                commandRunner
            )
        ).toBe(0);
    });

    it("disables Chromium's setuid sandbox only on Linux CI runners", () => {
        expect.assertions(3);

        expect(getPackagedLaunchArgs({ CI: "true" }, "linux")).toStrictEqual([
            "--disable-http-cache",
            "--no-sandbox",
        ]);
        expect(getPackagedLaunchArgs({}, "linux")).toStrictEqual([
            "--disable-http-cache",
        ]);
        expect(getPackagedLaunchArgs({ CI: "true" }, "darwin")).toStrictEqual([
            "--disable-http-cache",
        ]);
    });

    it("fails when packaged startup output contains fatal renderer or asset errors", () => {
        expect.assertions(1);

        const releaseDistPath = createTemporaryRoot();
        const executablePath = path.join(
            releaseDistPath,
            "win-unpacked",
            "Fit File Viewer.exe"
        );
        writeExecutable(executablePath);

        const commandRunner = vi.fn<CommandRunner>().mockReturnValue({
            error: Object.assign(new Error("timed out"), {
                code: "ETIMEDOUT",
            }),
            status: null,
            stderr: "Failed to load URL: file:///app.asar/dist/index.html",
        });

        expect(() =>
            runPackagedSmoke(
                ["--executable", executablePath],
                {},
                commandRunner
            )
        ).toThrow("Failed to load URL");
    });

    it("fails when the packaged executable exits before the startup window", () => {
        expect.assertions(1);

        const releaseDistPath = createTemporaryRoot();
        const executablePath = path.join(
            releaseDistPath,
            "win-unpacked",
            "Fit File Viewer.exe"
        );
        writeExecutable(executablePath);

        const commandRunner = vi.fn<CommandRunner>().mockReturnValue({
            status: 0,
        });

        expect(() =>
            runPackagedSmoke(
                [
                    "--executable",
                    executablePath,
                    "--startup-timeout-ms",
                    "1000",
                ],
                {},
                commandRunner
            )
        ).toThrow("exited before the 1000ms startup smoke window");
    });
});
