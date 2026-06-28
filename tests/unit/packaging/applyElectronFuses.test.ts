import { FuseState, FuseV1Options, FuseVersion } from "@electron/fuses";
import * as path from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
    applyElectronFuses,
    electronFuseConfig,
    expectedElectronFuseStates,
    getElectronBuilderAfterPackExecutablePath,
    getPackagedElectronExecutableCandidates,
} from "../../../scripts/apply-electron-fuses.mjs";

describe("apply-electron-fuses script", () => {
    it("documents the hardened Electron fuse policy", () => {
        expect.assertions(2);

        expect(electronFuseConfig).toMatchObject({
            [FuseV1Options.EnableCookieEncryption]: true,
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            [FuseV1Options.EnableNodeCliInspectArguments]: false,
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            [FuseV1Options.GrantFileProtocolExtraPrivileges]: true,
            [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: false,
            [FuseV1Options.OnlyLoadAppFromAsar]: true,
            [FuseV1Options.RunAsNode]: false,
            [FuseV1Options.WasmTrapHandlers]: true,
            strictlyRequireAllFuses: true,
            version: FuseVersion.V1,
        });
        expect(expectedElectronFuseStates).toStrictEqual({
            [FuseV1Options.EnableCookieEncryption]: FuseState.ENABLE,
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]:
                FuseState.ENABLE,
            [FuseV1Options.EnableNodeCliInspectArguments]: FuseState.DISABLE,
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]:
                FuseState.DISABLE,
            [FuseV1Options.GrantFileProtocolExtraPrivileges]: FuseState.ENABLE,
            [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]:
                FuseState.DISABLE,
            [FuseV1Options.OnlyLoadAppFromAsar]: FuseState.ENABLE,
            [FuseV1Options.RunAsNode]: FuseState.DISABLE,
            [FuseV1Options.WasmTrapHandlers]: FuseState.ENABLE,
        });
    });

    it("finds expected unpacked Electron executable locations", () => {
        expect.assertions(1);

        const releaseDistPath = path.join(process.cwd(), "release-dist");

        expect(
            getPackagedElectronExecutableCandidates({
                productName: "Fit File Viewer",
                releaseDistPath,
            })
        ).toStrictEqual([
            path.join(
                releaseDistPath,
                "linux-arm64-unpacked",
                "Fit File Viewer"
            ),
            path.join(
                releaseDistPath,
                "linux-ia32-unpacked",
                "Fit File Viewer"
            ),
            path.join(releaseDistPath, "linux-unpacked", "Fit File Viewer"),
            path.join(
                releaseDistPath,
                "mac",
                "Fit File Viewer.app",
                "Contents",
                "MacOS",
                "Fit File Viewer"
            ),
            path.join(
                releaseDistPath,
                "mac-arm64",
                "Fit File Viewer.app",
                "Contents",
                "MacOS",
                "Fit File Viewer"
            ),
            path.join(
                releaseDistPath,
                "mas",
                "Fit File Viewer.app",
                "Contents",
                "MacOS",
                "Fit File Viewer"
            ),
            path.join(
                releaseDistPath,
                "mas-dev",
                "Fit File Viewer.app",
                "Contents",
                "MacOS",
                "Fit File Viewer"
            ),
            path.join(
                releaseDistPath,
                "win-arm64-unpacked",
                "Fit File Viewer.exe"
            ),
            path.join(
                releaseDistPath,
                "win-ia32-unpacked",
                "Fit File Viewer.exe"
            ),
            path.join(releaseDistPath, "win-unpacked", "Fit File Viewer.exe"),
        ]);
    });

    it("flips and verifies each requested Electron executable", async () => {
        expect.assertions(5);

        const executablePaths = [
            path.join(process.cwd(), "release-dist", "win-unpacked", "app.exe"),
        ];
        const flipFusesImpl = vi.fn(() => Promise.resolve());
        const getCurrentFuseWireImpl = vi.fn(() =>
            Promise.resolve({
                ...expectedElectronFuseStates,
            })
        );
        const logger = vi.fn<(message: string) => void>();

        await expect(
            applyElectronFuses({
                executablePaths,
                flipFusesImpl,
                getCurrentFuseWireImpl,
                logger,
            })
        ).resolves.toStrictEqual(executablePaths);
        expect(flipFusesImpl).toHaveBeenCalledWith(
            executablePaths[0],
            electronFuseConfig
        );
        expect(getCurrentFuseWireImpl).toHaveBeenCalledWith(executablePaths[0]);
        expect(logger).toHaveBeenCalledWith(
            `[apply-electron-fuses] ${executablePaths[0]}`
        );
        expect(flipFusesImpl).toHaveBeenCalledBefore(getCurrentFuseWireImpl);
    });

    it("rejects missing package outputs before mutating fuses", async () => {
        expect.assertions(1);

        await expect(
            applyElectronFuses({
                executablePaths: [],
                flipFusesImpl: vi.fn(),
                getCurrentFuseWireImpl: vi.fn(),
            })
        ).rejects.toThrow("No unpacked Electron executable found");
    });

    it("resolves electron-builder afterPack executable paths before signing", () => {
        expect.assertions(4);

        expect(
            getElectronBuilderAfterPackExecutablePath({
                appOutDir: path.join("release-dist", "win-unpacked"),
                electronPlatformName: "win32",
                packager: {
                    appInfo: {
                        productFilename: "Fit File Viewer",
                    },
                },
            })
        ).toBe(
            path.join("release-dist", "win-unpacked", "Fit File Viewer.exe")
        );
        expect(
            getElectronBuilderAfterPackExecutablePath({
                appOutDir: path.join("release-dist", "linux-unpacked"),
                electronPlatformName: "linux",
                packager: {
                    appInfo: {
                        productFilename: "Fit File Viewer",
                    },
                },
            })
        ).toBe(path.join("release-dist", "linux-unpacked", "Fit File Viewer"));
        expect(
            getElectronBuilderAfterPackExecutablePath({
                appOutDir: path.join("release-dist", "mac"),
                electronPlatformName: "darwin",
                packager: {
                    appInfo: {
                        productFilename: "Fit File Viewer",
                    },
                },
            })
        ).toBe(
            path.join(
                "release-dist",
                "mac",
                "Fit File Viewer.app",
                "Contents",
                "MacOS",
                "Fit File Viewer"
            )
        );
        expect(() =>
            getElectronBuilderAfterPackExecutablePath({
                appOutDir: "",
            })
        ).toThrow("electron-builder afterPack context is missing appOutDir");
    });

    it("rejects fuse verification drift", async () => {
        expect.assertions(1);

        await expect(
            applyElectronFuses({
                executablePaths: ["app.exe"],
                flipFusesImpl: vi.fn(() => Promise.resolve()),
                getCurrentFuseWireImpl: vi.fn(() =>
                    Promise.resolve({
                        ...expectedElectronFuseStates,
                        [FuseV1Options.RunAsNode]: FuseState.ENABLE,
                    })
                ),
                logger: vi.fn(),
            })
        ).rejects.toThrow(
            "Electron fuse verification failed for app.exe: 0=49 expected 48"
        );
    });
});
