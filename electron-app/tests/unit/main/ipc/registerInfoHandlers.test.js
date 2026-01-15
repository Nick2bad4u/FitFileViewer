/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("registerInfoHandlers", () => {
    let registerInfoHandlers;
    let registerIpcHandle;
    let appRef;
    let fs;
    let path;
    let logWithContext;
    let mockConfGet;
    const CONSTANTS = { DEFAULT_THEME: "light", SETTINGS_CONFIG_NAME: "ffv-settings" };

    beforeEach(async () => {
        vi.resetModules();

        mockConfGet = vi.fn((key, fallback) => {
            const store = {
                selectedMapTab: "map",
                theme: "dark",
            };
            return key in store ? store[key] : fallback;
        });

        ({ registerInfoHandlers } = await import("../../../../main/ipc/registerInfoHandlers.js"));
        registerIpcHandle = vi.fn();
        appRef = vi.fn().mockReturnValue({
            getVersion: vi.fn().mockReturnValue("1.2.3"),
            getAppPath: vi.fn().mockReturnValue("/base"),
        });
        fs = { readFileSync: vi.fn() };
        path = { join: vi.fn((...args) => args.join("/")) };
        logWithContext = vi.fn();
    });

    const getHandlers = () => {
        class ConfMock {
            get(key, fallback) {
                return mockConfGet(key, fallback);
            }
        }
        const handlers = {};
        registerIpcHandle.mockImplementation((channel, handler) => {
            handlers[channel] = handler;
        });
        registerInfoHandlers({
            registerIpcHandle,
            appRef,
            fs,
            path,
            CONSTANTS,
            logWithContext,
            confModule: { Conf: ConfMock },
        });
        return handlers;
    };

    it("no-ops when registerIpcHandle is missing", () => {
        registerInfoHandlers({ registerIpcHandle: null, appRef, fs, path, CONSTANTS, logWithContext });
        expect(registerIpcHandle).not.toHaveBeenCalled();
    });

    it("provides app/platform metadata and map/theme defaults", async () => {
        const handlers = getHandlers();
        const licenseJson = { license: "Unlicense" };
        fs.readFileSync.mockReturnValue(Buffer.from(JSON.stringify(licenseJson)));

        await expect(handlers.getAppVersion()).resolves.toBe("1.2.3");
        await expect(handlers.getChromeVersion()).resolves.toBe(process.versions.chrome);
        await expect(handlers.getElectronVersion()).resolves.toBe(process.versions.electron);
        await expect(handlers.getLicenseInfo()).resolves.toBe("Unlicense");
        await expect(handlers.getNodeVersion()).resolves.toBe(process.versions.node);
        await expect(handlers.getPlatformInfo()).resolves.toEqual({ arch: process.arch, platform: process.platform });
        await expect(handlers["map-tab:get"]()).resolves.toBe("map");
        await expect(handlers["theme:get"]()).resolves.toBe("dark");

        expect(path.join).toHaveBeenCalledWith("/base", "package.json");
        expect(logWithContext).not.toHaveBeenCalled();
    });

    it("returns 'Unknown' and logs when license read fails", async () => {
        const handlers = getHandlers();
        fs.readFileSync.mockImplementation(() => {
            throw new Error("fs failure");
        });

        await expect(handlers.getLicenseInfo()).resolves.toBe("Unknown");

        expect(logWithContext).toHaveBeenCalledWith("error", "Failed to read license from package.json:", {
            error: "fs failure",
        });
    });

    it("normalizes corrupted persisted theme/map-tab values", async () => {
        mockConfGet = vi.fn((key, fallback) => {
            if (key === "selectedMapTab") return "<img src=x onerror=alert(1)>";
            if (key === "theme") return "neon";
            return fallback;
        });

        const handlers = getHandlers();
        await expect(handlers["map-tab:get"]()).resolves.toBe("map");
        await expect(handlers["theme:get"]()).resolves.toBe(CONSTANTS.DEFAULT_THEME);
    });
});
