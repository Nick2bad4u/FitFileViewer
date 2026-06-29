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
                getVitestImportMockCandidate: () => undefined,
            }).getVitestImportMockCandidate()
        ).toBeUndefined();
    });

    it("fails clearly when the Vitest import mock provider is omitted", () => {
        expect.assertions(1);

        expect(() =>
            getAutoUpdaterAccessRuntime(
                {} as unknown as AutoUpdaterAccessRuntimeScope
            )
        ).toThrow(
            "autoUpdaterAccessRuntime requires Vitest import mock candidate provider"
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
