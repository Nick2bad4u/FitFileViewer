// @vitest-environment node

import { createRequire } from "node:module";
import { beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);

type CjsCacheEntry = {
    exports: unknown;
    filename: string;
    id: string;
    loaded: boolean;
};

type AutoUpdaterLike = {
    autoDownload: boolean;
    feedURL?: string;
    on: (event: string, listener: (...args: unknown[]) => void) => void;
    removeListener: (
        event: string,
        listener: (...args: unknown[]) => void
    ) => void;
};

type MainWindowLike = {
    isDestroyed: () => boolean;
    webContents: {
        isDestroyed: () => boolean;
    };
};

type SetupAutoUpdaterModule = {
    setupAutoUpdater: (
        mainWindow: MainWindowLike,
        autoUpdater: AutoUpdaterLike | null
    ) => void;
};

const mockElectronLog = {
    transports: {
        file: {
            level: "",
        },
    },
    info: vi.fn<(message: string) => void>(),
    error: vi.fn<(message: string) => void>(),
};

function getRequireCache(): Record<string, CjsCacheEntry> {
    return (require as unknown as { cache: Record<string, CjsCacheEntry> })
        .cache;
}

function requireSetupAutoUpdater(): SetupAutoUpdaterModule {
    return require("../../../../electron-app/main/updater/setupAutoUpdater.js");
}

function createMainWindow(): MainWindowLike {
    return {
        isDestroyed: () => false,
        webContents: { isDestroyed: () => false },
    };
}

describe("setupAutoUpdater", () => {
    beforeEach(() => {
        mockElectronLog.info.mockClear();
        mockElectronLog.error.mockClear();

        // Inject electron-log mock for CJS require() consumers.
        const electronLogPath = require.resolve("electron-log");
        const cache = getRequireCache();
        cache[electronLogPath] = {
            exports: mockElectronLog,
            filename: electronLogPath,
            id: electronLogPath,
            loaded: true,
        };

        // Ensure the module under test is reloaded per test.
        const sutPath =
            require.resolve("../../../../electron-app/main/updater/setupAutoUpdater.js");
        delete cache[sutPath];
    });

    it("does not throw when autoUpdater is explicitly unavailable", async () => {
        expect.hasAssertions();

        // Require the CJS module so it uses our require.cache injection.
        const { setupAutoUpdater } = requireSetupAutoUpdater();

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const mockWindow = createMainWindow();

        expect(() => setupAutoUpdater(mockWindow, null)).not.toThrow();
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining("autoUpdater is unavailable")
        );

        warnSpy.mockRestore();
    });

    it("redacts credentials when logging feedURL and does not crash with minimal updater surface", async () => {
        expect.hasAssertions();

        const { setupAutoUpdater } = requireSetupAutoUpdater();
        const mockWindow = createMainWindow();

        const autoUpdater: AutoUpdaterLike = {
            autoDownload: false,
            feedURL: "https://user:pass@example.com/releases",
            on: vi.fn<
                (event: string, listener: (...args: unknown[]) => void) => void
            >(),
            removeListener: vi.fn<
                (event: string, listener: (...args: unknown[]) => void) => void
            >(),
        };

        expect(() => setupAutoUpdater(mockWindow, autoUpdater)).not.toThrow();
        expect(autoUpdater.autoDownload).toBe(true);

        // electron-log receives the safe/redacted string
        expect(mockElectronLog.info).toHaveBeenCalledWith(
            expect.stringContaining(
                "AutoUpdater feed URL: https://example.com/releases"
            )
        );
    });
});
