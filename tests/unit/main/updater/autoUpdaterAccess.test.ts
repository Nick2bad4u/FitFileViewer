// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveAutoUpdaterAsync } from "../../../../electron-app/main/updater/autoUpdaterAccess.js";
import {
    getAutoUpdaterAccessRuntime,
    type AutoUpdaterAccessRuntime,
    type AutoUpdaterAccessRuntimeScope,
} from "../../../../electron-app/main/updater/autoUpdaterAccessRuntime.js";

describe("autoUpdaterAccess", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("resolves the default Vitest mock candidate through the shared global-property boundary", () => {
        expect.assertions(1);

        const importMock = vi.fn();

        vi.stubGlobal("vi", { importMock });

        expect(
            getAutoUpdaterAccessRuntime().getVitestImportMockCandidate()
        ).toStrictEqual({ importMock });
    });

    it("allows the Vitest import mock provider to report no candidate", () => {
        expect.assertions(1);

        expect(
            getAutoUpdaterAccessRuntime({
                getIsTestEnvironment: () => () => false,
                getVitestImportMockCandidate: () => undefined,
            }).getVitestImportMockCandidate()
        ).toBeUndefined();
    });

    it("fails clearly when the Vitest import mock provider is omitted", () => {
        expect.assertions(2);

        expect(() =>
            getAutoUpdaterAccessRuntime(
                {} as unknown as AutoUpdaterAccessRuntimeScope
            )
        ).toThrow(
            "autoUpdaterAccessRuntime requires Vitest import mock candidate provider"
        );
        expect(() =>
            getAutoUpdaterAccessRuntime({
                getVitestImportMockCandidate: () => undefined,
            } as unknown as AutoUpdaterAccessRuntimeScope)
        ).toThrow(
            "autoUpdaterAccessRuntime requires test environment provider"
        );
    });

    it("reads test mode through the injected runtime provider", () => {
        expect.assertions(2);

        const isTestEnvironment = vi.fn<() => boolean>(() => true);
        const runtime = getAutoUpdaterAccessRuntime({
            getIsTestEnvironment: () => isTestEnvironment,
            getVitestImportMockCandidate: () => undefined,
        });

        expect(runtime.isTestEnvironment()).toBe(true);
        expect(isTestEnvironment).toHaveBeenCalledOnce();
    });

    it("fails clearly when the test environment runtime is missing", () => {
        expect.assertions(1);

        const runtime = getAutoUpdaterAccessRuntime({
            getIsTestEnvironment: () => undefined,
            getVitestImportMockCandidate: () => undefined,
        });

        expect(() => runtime.isTestEnvironment()).toThrow(
            "autoUpdaterAccessRuntime requires a test environment runtime"
        );
    });

    it("resolves Vitest electron-updater mocks through the injected runtime provider", async () => {
        expect.assertions(4);

        const autoUpdater = {
            checkForUpdatesAndNotify: vi.fn(),
            on: vi.fn(),
        };
        const updaterModule = { autoUpdater };
        Object.defineProperty(updaterModule, "default", {
            get: () => {
                throw new Error("lazy default unavailable");
            },
        });
        const importMock = vi.fn(async () => updaterModule);
        const runtime: AutoUpdaterAccessRuntime = {
            getVitestImportMockCandidate: () => ({ importMock }),
            isTestEnvironment: () => true,
        };

        const resolved = await resolveAutoUpdaterAsync(runtime);

        expect(resolved).toBe(autoUpdater);
        expect(importMock).toHaveBeenCalledExactlyOnceWith("electron-updater");
        expect(resolved?.checkForUpdatesAndNotify).toBe(
            autoUpdater.checkForUpdatesAndNotify
        );
        expect(resolved?.on).toBe(autoUpdater.on);
    });
});
