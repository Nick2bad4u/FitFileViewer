import fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
    assertNoWindowsInstallRegistrations,
    getDistributableNames,
    getWindowsInstallRegistrations,
    runChecked,
    runDistributableSmoke,
} from "../../../scripts/run-distributable-smoke.mjs";

const directories: string[] = [];

function makeRelease(platform: string, arch: string): string {
    const directory = fs.mkdtempSync(path.join(tmpdir(), "ffv-artifact-test-"));
    directories.push(directory);
    for (const name of getDistributableNames({
        platform,
        arch,
        version: "30.0.3",
    })) {
        fs.writeFileSync(path.join(directory, name), "fixture artifact");
    }
    return directory;
}

function createExecutable(destination: string, platform: string): void {
    const executable =
        platform === "darwin"
            ? path.join(destination, "Contents", "MacOS", "Fit File Viewer")
            : path.join(destination, "Fit File Viewer.exe");
    fs.mkdirSync(path.dirname(executable), { recursive: true });
    fs.writeFileSync(executable, "fixture executable");
}

afterEach(() => {
    for (const directory of directories.splice(0)) {
        fs.rmSync(directory, { recursive: true, force: true });
    }
});

describe("final distributable smoke", () => {
    it.each([
        [
            "CurrentUser",
            "Registry32",
            "141b3184-244b-5640-abaf-338415dd90dc",
        ],
        [
            "CurrentUser",
            "Registry64",
            "2eccf151-6603-512f-93c6-ea96e8d92a75",
        ],
        [
            "LocalMachine",
            "Registry32",
            "2eccf151-6603-512f-93c6-ea96e8d92a75",
        ],
        [
            "LocalMachine",
            "Registry64",
            "141b3184-244b-5640-abaf-338415dd90dc",
        ],
    ])("refuses existing registrations in %s/%s for %s", (hive, view, guid) => {
        expect.assertions(1);
        expect(() =>
            assertNoWindowsInstallRegistrations(() => [
                { Hive: hive, View: view, Key: `Software\\${guid}` },
            ])
        ).toThrow("Use a clean disposable Windows runner");
    });

    it("fails closed when registry inspection fails or returns unexpected data", () => {
        expect.assertions(2);
        expect(() =>
            getWindowsInstallRegistrations(() => {
                throw new Error("Access denied");
            })
        ).toThrow("Access denied");
        expect(() =>
            getWindowsInstallRegistrations(() => ({ stdout: "null" }))
        ).toThrow("invalid data");
    });

    it("never starts the installer or uninstaller when an existing user install is registered", () => {
        expect.assertions(2);
        const releaseDirectory = makeRelease("win32", "x64");
        const calls: string[] = [];
        const run = (command: string, args: string[]): void => {
            calls.push(command);
            if (command === "tar") createExecutable(args[3] ?? "", "win32");
        };
        expect(() =>
            runDistributableSmoke(
                {
                    arch: "x64",
                    platform: "win32",
                    version: "30.0.3",
                    releaseDirectory,
                },
                {
                    run,
                    smoke: () => 0,
                    inspectWindowsRegistrations: () => [
                        {
                            Key: "Software\\fixture",
                            InstallLocation:
                                "C:\\Users\\fixture\\AppData\\Local\\Programs\\Fit File Viewer",
                        },
                    ],
                }
            )
        ).toThrow("Refusing NSIS smoke installation");
        expect(calls).toStrictEqual(["tar"]);
    });

    it("preserves a partial install if registration cleanup cannot be verified", () => {
        expect.assertions(3);
        const releaseDirectory = makeRelease("win32", "x64");
        let installation = "";
        const inspectWindowsRegistrations = vi
            .fn()
            .mockReturnValueOnce([])
            .mockReturnValue([{ Key: "Software\\fixture" }]);
        const run = (command: string, args: string[]): void => {
            if (command === "tar") createExecutable(args[3] ?? "", "win32");
            if (command.includes("-nsis-")) {
                installation = args[2]?.slice(3) ?? "";
                directories.push(path.dirname(installation));
                createExecutable(installation, "win32");
                throw new Error("Installer failed after registration");
            }
        };
        expect(() =>
            runDistributableSmoke(
                {
                    arch: "x64",
                    platform: "win32",
                    version: "30.0.3",
                    releaseDirectory,
                },
                { run, smoke: () => 0, inspectWindowsRegistrations }
            )
        ).toThrow("cleanup failed; preserved");
        expect(
            fs.existsSync(path.join(installation, "Fit File Viewer.exe"))
        ).toBeTruthy();
        expect(
            JSON.parse(
                fs.readFileSync(
                    path.join(
                        releaseDirectory,
                        "distributable-smoke-win32-x64.json"
                    ),
                    "utf8"
                )
            )
        ).toMatchObject({
            artifacts: expect.arrayContaining([
                {
                    artifact: "Fit-File-Viewer-nsis-x64-30.0.3.exe",
                    passed: false,
                    phase: "cleanup",
                    error: expect.stringContaining("preserved"),
                },
            ]),
        });
    });

    it("replaces stale success evidence when a required artifact is missing", () => {
        expect.assertions(2);
        const releaseDirectory = makeRelease("darwin", "arm64");
        fs.rmSync(
            path.join(releaseDirectory, "Fit-File-Viewer-dmg-arm64-30.0.3.dmg")
        );
        const report = path.join(
            releaseDirectory,
            "distributable-smoke-darwin-arm64.json"
        );
        fs.writeFileSync(report, '{"passed":true}');
        expect(() =>
            runDistributableSmoke({
                arch: "arm64",
                platform: "darwin",
                version: "30.0.3",
                releaseDirectory,
            })
        ).toThrow("Required distributable is missing");
        expect(JSON.parse(fs.readFileSync(report, "utf8"))).toMatchObject({
            artifacts: [{ passed: false }],
        });
    });

    it("launches Linux tar and extracted AppImage payloads from fresh directories", () => {
        expect.assertions(3);
        const releaseDirectory = makeRelease("linux", "x64");
        const smoke = vi.fn(() => 0);
        const calls: string[] = [];
        const run = (
            command: string,
            args: string[],
            options?: { cwd: string }
        ): void => {
            calls.push(command);
            const destination = command === "tar" ? args[3] : options?.cwd;
            if (!destination) throw new Error("Missing extraction directory");
            fs.writeFileSync(
                path.join(destination, "fitfileviewer"),
                "fixture executable",
                { mode: 0o755 }
            );
        };
        expect(
            runDistributableSmoke(
                {
                    arch: "x64",
                    platform: "linux",
                    version: "30.0.3",
                    releaseDirectory,
                },
                { run, smoke }
            )
        ).toBe(0);
        expect(calls).toEqual([
            "tar",
            expect.stringContaining("appimage-x86_64-30.0.3.AppImage"),
        ]);
        expect(smoke).toHaveBeenCalledTimes(2);
    });

    it("requires exact architecture/version artifacts and rejects unsupported combinations", () => {
        expect.assertions(3);
        expect(
            getDistributableNames({
                platform: "linux",
                arch: "x64",
                version: "30.0.3",
            })
        ).toStrictEqual([
            "Fit-File-Viewer-linux-x64-30.0.3.tar.gz",
            "Fit-File-Viewer-appimage-x86_64-30.0.3.AppImage",
        ]);
        expect(() =>
            getDistributableNames({
                platform: "win32",
                arch: "universal",
                version: "30.0.3",
            })
        ).toThrow("Unsupported");
        expect(() =>
            getDistributableNames({
                platform: "darwin",
                arch: "arm64",
                version: "../latest",
            })
        ).toThrow("Invalid package version");
    });

    it("fails command signal termination and nonzero exits", () => {
        expect.assertions(2);
        expect(() =>
            runChecked("fixture", [], {}, () => ({
                status: null,
                signal: "SIGSEGV",
            }))
        ).toThrow("SIGSEGV");
        expect(() =>
            runChecked("fixture", [], {}, () => ({
                status: 3,
                stderr: "invalid signature",
            }))
        ).toThrow("invalid signature");
    });

    it("copies a mounted universal DMG, verifies signatures, then launches both slices and LaunchServices", () => {
        expect.assertions(7);
        const releaseDirectory = makeRelease("darwin", "universal");
        const commands: string[][] = [];
        const wrappers: string[] = [];
        const run = (command: string, args: string[]): void => {
            commands.push([command, ...args]);
            if (command === "ditto") createExecutable(args[1] ?? "", "darwin");
        };
        const smoke = (args: string[]): number => {
            wrappers.push(fs.readFileSync(args[1] ?? "", "utf8"));
            return 0;
        };
        expect(
            runDistributableSmoke(
                {
                    arch: "universal",
                    platform: "darwin",
                    version: "30.0.3",
                    releaseDirectory,
                },
                { run, smoke }
            )
        ).toBe(0);
        expect(commands.map((command) => command[0])).toStrictEqual([
            "hdiutil",
            "ditto",
            "hdiutil",
            "codesign",
        ]);
        expect(commands[0]).toContain("-readonly");
        expect(commands[3]).toContain("--all-architectures");
        expect(wrappers.map((wrapper) => wrapper.split("\n")[1])).toEqual([
            expect.stringContaining("arch -arm64"),
            expect.stringContaining("arch -x86_64"),
            expect.stringContaining("open -W -n"),
        ]);
        expect(wrappers[2]).toContain('"FFV_SMOKE_NONCE=$FFV_SMOKE_NONCE"');
        expect(
            JSON.parse(
                fs.readFileSync(
                    path.join(
                        releaseDirectory,
                        "distributable-smoke-darwin-universal.json"
                    ),
                    "utf8"
                )
            )
        ).toMatchObject({
            artifacts: [
                {
                    passed: true,
                    signatureVerified: true,
                    architectures: ["arm64", "x64"],
                },
            ],
        });
    });

    it("rejects an invalid final signature before launch and preserves failure evidence", () => {
        expect.assertions(3);
        const releaseDirectory = makeRelease("darwin", "arm64");
        const smoke = vi.fn();
        const run = (command: string, args: string[]): void => {
            if (command === "ditto") createExecutable(args[1] ?? "", "darwin");
            if (command === "codesign")
                throw new Error("invalid code-page hash");
        };
        expect(() =>
            runDistributableSmoke(
                {
                    arch: "arm64",
                    platform: "darwin",
                    version: "30.0.3",
                    releaseDirectory,
                },
                { run, smoke }
            )
        ).toThrow("invalid code-page hash");
        expect(smoke).not.toHaveBeenCalled();
        expect(
            JSON.parse(
                fs.readFileSync(
                    path.join(
                        releaseDirectory,
                        "distributable-smoke-darwin-arm64.json"
                    ),
                    "utf8"
                )
            )
        ).toMatchObject({
            artifacts: [{ passed: false, error: "invalid code-page hash" }],
        });
    });

    it("tests the extracted ZIP, installed NSIS app, and portable launcher separately", () => {
        expect.assertions(6);
        const releaseDirectory = makeRelease("win32", "ia32");
        const smoke = vi.fn(() => 0);
        const calls: string[][] = [];
        const inspectWindowsRegistrations = vi.fn(() => []);
        const run = (command: string, args: string[]): void => {
            calls.push([command, ...args]);
            if (command === "tar") createExecutable(args[3] ?? "", "win32");
            if (command.includes("-nsis-")) {
                const destination = args[2]?.slice(3) ?? "";
                createExecutable(destination, "win32");
                fs.writeFileSync(
                    path.join(destination, "Uninstall Fit File Viewer.exe"),
                    "fixture uninstaller"
                );
            }
        };
        expect(
            runDistributableSmoke(
                {
                    arch: "ia32",
                    platform: "win32",
                    version: "30.0.3",
                    releaseDirectory,
                },
                { run, smoke, inspectWindowsRegistrations }
            )
        ).toBe(0);
        expect(smoke).toHaveBeenCalledTimes(3);
        expect(calls[1]?.slice(1, 3)).toStrictEqual(["/S", "/currentuser"]);
        expect(calls[2]).toEqual([
            expect.stringContaining("Uninstall Fit File Viewer.exe"),
            "/S",
            "/currentuser",
            expect.stringContaining("_?="),
        ]);
        expect(inspectWindowsRegistrations).toHaveBeenCalledTimes(2);
        expect(smoke.mock.calls[2]).toEqual([
            expect.arrayContaining([
                expect.stringContaining("portable-ia32-30.0.3.exe"),
            ]),
            expect.any(Object),
        ]);
    });
});
