import { EventEmitter } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
    captureDiagnosticCommand,
    findSmokeProcesses,
    runMacosSmokeDiagnostics,
    sampleHungSmokeProcesses,
    selectProcessesToSample,
    verifyRosetta,
} from "../../../scripts/run-macos-smoke-diagnostics.mjs";

type DiagnosticResult = { status: number; stdout: string; stderr: string };
const directories: string[] = [];
const processCommand =
    "/tmp/extracted/Fit File Viewer.app/Contents/MacOS/Fit File Viewer --ffv-smoke-test";

function createDirectory() {
    const directory = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-native-diagnostics-")
    );
    directories.push(directory);
    return directory;
}

function successfulCapture() {
    return vi
        .fn<(...args: unknown[]) => Promise<DiagnosticResult>>()
        .mockResolvedValue({ status: 0, stdout: "", stderr: "" });
}

afterEach(() => {
    vi.useRealTimers();
    for (const directory of directories.splice(0))
        fs.rmSync(directory, { recursive: true, force: true });
});

describe("macOS smoke diagnostics", () => {
    it("selects only smoke app descendants without exposing unrelated commands", () => {
        expect.assertions(1);
        const listing = `40 20 ${processCommand}\n20 10 /usr/bin/arch -x86_64 executable\n80 1 ${processCommand}\n90 40 Fit File Viewer Helper\n10 1 node smoke\n100 1 secret-command --token secret`;
        expect(findSmokeProcesses(listing, 10)).toStrictEqual([
            { pid: 40, parentPid: 20, command: processCommand },
        ]);
    });

    it("samples a stalled process once after twenty seconds", () => {
        expect.assertions(4);
        const processes = [{ pid: 40, parentPid: 10, command: processCommand }];
        const observations = new Map();
        expect(
            selectProcessesToSample(processes, observations, 0)
        ).toStrictEqual([]);
        expect(
            selectProcessesToSample(processes, observations, 19_999)
        ).toStrictEqual([]);
        expect(
            selectProcessesToSample(processes, observations, 20_000)
        ).toStrictEqual(processes);
        expect(
            selectProcessesToSample(processes, observations, 40_000)
        ).toStrictEqual([]);
    });

    it("captures bounded native samples while preserving only the target process", async () => {
        expect.assertions(3);
        const directory = createDirectory();
        const capture = successfulCapture();
        capture.mockResolvedValueOnce({
            status: 0,
            stdout: `40 10 ${processCommand}\n80 1 secret-command`,
            stderr: "",
        });
        const observations = new Map([[40, { firstSeen: 0, sampled: false }]]);
        await sampleHungSmokeProcesses(10, directory, observations, {
            capture,
            now: () => 20_000,
        });
        expect(capture).toHaveBeenLastCalledWith("/usr/bin/sample", [
            "40",
            "5",
            "1",
            "-file",
            path.join(directory, "sample-40.txt"),
        ]);
        expect(
            fs.readFileSync(path.join(directory, "process-40.json"), "utf8")
        ).not.toContain("secret-command");
        expect(
            fs.existsSync(path.join(directory, "sample-40-command.txt"))
        ).toBe(true);
    });

    it("bounds diagnostic commands and records command failures", async () => {
        expect.assertions(2);
        const runner = vi.fn().mockRejectedValue(
            Object.assign(new Error("timed out"), {
                stdout: "partial sample",
                stderr: "timeout",
            })
        );
        await expect(
            captureDiagnosticCommand("/usr/bin/sample", ["40"], runner)
        ).resolves.toStrictEqual({
            status: 1,
            stdout: "partial sample",
            stderr: "timeout",
        });
        expect(runner).toHaveBeenCalledWith(
            "/usr/bin/sample",
            ["40"],
            expect.objectContaining({
                timeout: 15_000,
                maxBuffer: 4 * 1024 * 1024,
            })
        );
    });

    it("captures a real diagnostic child command without a shell", async () => {
        expect.assertions(1);
        await expect(
            captureDiagnosticCommand(process.execPath, [
                "-e",
                "process.stdout.write('diagnostic-ready')",
            ])
        ).resolves.toMatchObject({
            status: 0,
            stdout: "diagnostic-ready",
            stderr: "",
        });
    });

    it.each([false, true])(
        "forwards Rosetta opt-in %s without changing the harness result",
        async (includeRosetta) => {
            expect.assertions(2);
            const child = Object.assign(new EventEmitter(), { pid: 10 });
            const spawn = vi
                .fn<(...args: unknown[]) => typeof child>()
                .mockReturnValue(child);
            const running = runMacosSmokeDiagnostics(
                {
                    platform: "darwin",
                    directory: createDirectory(),
                    includeRosetta,
                },
                { spawn, capture: successfulCapture() }
            );
            expect(spawn.mock.calls[0]?.[1]).toEqual([
                expect.stringContaining("run-distributable-smoke.mjs"),
                ...(includeRosetta ? ["--include-rosetta"] : []),
            ]);
            child.emit("close", 0, null);
            await expect(running).resolves.toBe(0);
        }
    );

    it("preserves harness spawn errors while collecting system diagnostics", async () => {
        expect.assertions(2);
        const directory = createDirectory();
        const child = Object.assign(new EventEmitter(), { pid: undefined });
        const running = runMacosSmokeDiagnostics(
            { platform: "darwin", directory },
            { spawn: () => child, capture: successfulCapture() }
        );
        queueMicrotask(() => {
            child.emit("error", new Error("spawn denied"));
        });
        await expect(running).rejects.toThrow("spawn denied");
        expect(fs.existsSync(path.join(directory, "rosetta-system.log"))).toBe(
            true
        );
    });

    it("does not overlap inspections or keep polling after the harness exits", async () => {
        expect.assertions(3);
        vi.useFakeTimers();
        const directory = createDirectory();
        const child = Object.assign(new EventEmitter(), { pid: 10 });
        let finishInspection: (() => void) | undefined;
        const inspection = new Promise<void>((resolve) => {
            finishInspection = resolve;
        });
        const inspect = vi.fn(() => inspection);
        const running = runMacosSmokeDiagnostics(
            { platform: "darwin", directory },
            { spawn: () => child, capture: successfulCapture(), inspect }
        );
        await vi.advanceTimersByTimeAsync(15_000);
        expect(inspect).toHaveBeenCalledOnce();
        child.emit("close", 0, null);
        finishInspection?.();
        await expect(running).resolves.toBe(0);
        await vi.advanceTimersByTimeAsync(15_000);
        expect(inspect).toHaveBeenCalledOnce();
    });

    it("probes real Intel execution and rejects a failed Rosetta probe", async () => {
        expect.assertions(3);
        const directory = createDirectory();
        const capture = successfulCapture();
        await verifyRosetta(directory, capture);
        expect(capture).toHaveBeenCalledWith("/usr/bin/arch", [
            "-x86_64",
            "/usr/bin/true",
        ]);
        capture.mockResolvedValueOnce({
            status: 1,
            stdout: "",
            stderr: "translation unavailable",
        });
        await expect(verifyRosetta(directory, capture)).rejects.toThrow(
            "Rosetta execution probe failed"
        );
        expect(
            fs.readFileSync(path.join(directory, "rosetta-probe.log"), "utf8")
        ).toContain("translation unavailable");
    });

    it.each([
        [
            0,
            null,
            0,
        ],
        [
            1,
            null,
            1,
        ],
        [
            null,
            "SIGTERM",
            1,
        ],
    ] as const)(
        "preserves harness status %s and signal %s",
        async (status, signal, expected) => {
            expect.assertions(3);
            vi.useFakeTimers();
            const directory = createDirectory();
            const child = Object.assign(new EventEmitter(), { pid: 10 });
            const capture = successfulCapture();
            const inspect = vi.fn().mockResolvedValue(undefined);
            const running = runMacosSmokeDiagnostics(
                { platform: "darwin", directory },
                { spawn: () => child, capture, inspect }
            );
            await vi.advanceTimersByTimeAsync(5000);
            expect(inspect).toHaveBeenCalledOnce();
            child.emit("close", status, signal);
            await expect(running).resolves.toBe(expected);
            expect(
                fs.readFileSync(
                    path.join(directory, "rosetta-system.log"),
                    "utf8"
                )
            ).toContain("status=0");
        }
    );
});
