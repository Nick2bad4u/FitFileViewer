/**
 * @vitest-environment node
 */

import { createRequire } from "node:module";
import { beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);

const mockElectronLog = {
    transports: {
        file: {
            level: "",
        },
    },
    info: vi.fn(),
    error: vi.fn(),
};

describe("setupAutoUpdater", () => {
    beforeEach(() => {
        mockElectronLog.info.mockClear();
        mockElectronLog.error.mockClear();

        // Inject electron-log mock for CJS require() consumers.
        const electronLogPath = require.resolve("electron-log");
        const cache = (require as unknown as { cache: Record<string, any> })
            .cache;
        cache[electronLogPath] = {
            id: electronLogPath,
            filename: electronLogPath,
            loaded: true,
            exports: mockElectronLog,
        } as any;

        // Ensure the module under test is reloaded per test.
        const sutPath =
            require.resolve("../../../../main/updater/setupAutoUpdater.js");
        delete cache[sutPath];
    });

    it("does not throw when autoUpdater is explicitly unavailable", async () => {
        // Require the CJS module so it uses our require.cache injection.
        const {
            setupAutoUpdater,
        } = require("../../../../main/updater/setupAutoUpdater.js");

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const mockWindow = {
            isDestroyed: () => false,
            webContents: { isDestroyed: () => false },
        };

        expect(() =>
            setupAutoUpdater(mockWindow as any, null as any)
        ).not.toThrow();
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining("autoUpdater is unavailable")
        );

        warnSpy.mockRestore();
    });

    it("redacts credentials when logging feedURL and does not crash with minimal updater surface", async () => {
        const {
            setupAutoUpdater,
        } = require("../../../../main/updater/setupAutoUpdater.js");

        const mockWindow = {
            isDestroyed: () => false,
            webContents: { isDestroyed: () => false },
        };

        const autoUpdater = {
            on: vi.fn(),
            removeListener: vi.fn(),
            autoDownload: false,
            feedURL: "https://user:pass@example.com/releases",
        };

        expect(() =>
            setupAutoUpdater(mockWindow as any, autoUpdater as any)
        ).not.toThrow();
        expect(autoUpdater.autoDownload).toBe(true);

        // electron-log receives the safe/redacted string
        expect(mockElectronLog.info).toHaveBeenCalledWith(
            expect.stringContaining(
                "AutoUpdater feed URL: https://example.com/releases"
            )
        );
    });
});
