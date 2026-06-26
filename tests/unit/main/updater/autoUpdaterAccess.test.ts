// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { resolveAutoUpdaterAsync } from "../../../../electron-app/main/updater/autoUpdaterAccess.js";
import type { AutoUpdaterAccessRuntime } from "../../../../electron-app/main/updater/autoUpdaterAccessRuntime.js";

describe("autoUpdaterAccess", () => {
    it("resolves Vitest electron-updater mocks through the injected runtime provider", async () => {
        expect.assertions(4);

        const autoUpdater = {
            checkForUpdatesAndNotify: vi.fn(),
            on: vi.fn(),
        };
        const importMock = vi.fn(async () => ({ autoUpdater }));
        const runtime: AutoUpdaterAccessRuntime = {
            getVitestImportMockCandidate: () => ({ importMock }),
        };

        const resolved = await resolveAutoUpdaterAsync(runtime);

        expect(resolved).toBe(autoUpdater);
        expect(importMock).toHaveBeenCalledExactlyOnceWith(
            "electron-updater"
        );
        expect(resolved?.checkForUpdatesAndNotify).toBe(
            autoUpdater.checkForUpdatesAndNotify
        );
        expect(resolved?.on).toBe(autoUpdater.on);
    });
});
