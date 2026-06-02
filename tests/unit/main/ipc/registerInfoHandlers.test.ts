// @vitest-environment node
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

type InfoInvokeChannel =
    | "getAppVersion"
    | "getChromeVersion"
    | "getElectronVersion"
    | "getLicenseInfo"
    | "getNodeVersion"
    | "getPlatformInfo"
    | "map-tab:get"
    | "theme:get";
type InfoIpcHandler = (event?: unknown, ...args: unknown[]) => Promise<unknown>;
type RegisterIpcHandle = (
    channel: InfoInvokeChannel,
    handler: InfoIpcHandler
) => void;
type AppInfoProvider = {
    getAppPath: Mock<() => string>;
    getVersion: Mock<() => string>;
};
type FileReader = {
    readFileSync: Mock<(filePath: string) => Buffer>;
};
type PathJoiner = {
    join: Mock<(...paths: string[]) => string>;
};
type LogWithContext = (
    level: "error" | "info" | "warn",
    message: string,
    context?: Record<string, unknown>
) => void;
type Constants = {
    DEFAULT_THEME: string;
    SETTINGS_CONFIG_NAME: string;
};
type ConfConstructor = new (options: { name: string }) => {
    get: (key: string, fallback: unknown) => unknown;
};
type RegisterInfoHandlers = (options: {
    appRef: () => AppInfoProvider;
    confModule?: { Conf: ConfConstructor };
    CONSTANTS: Constants;
    fs: FileReader;
    logWithContext?: LogWithContext;
    path: PathJoiner;
    registerIpcHandle: RegisterIpcHandle;
}) => void;
type RegisterInfoHandlersModule = {
    registerInfoHandlers: RegisterInfoHandlers;
};

describe("registerInfoHandlers", () => {
    let registerInfoHandlers: RegisterInfoHandlers;
    let registerIpcHandle: Mock<RegisterIpcHandle>;
    let appRef: Mock<() => AppInfoProvider>;
    let fs: FileReader;
    let path: PathJoiner;
    let logWithContext: Mock<LogWithContext>;
    let mockConfGet: Mock<(key: string, fallback: unknown) => unknown>;
    const CONSTANTS = {
        DEFAULT_THEME: "light",
        SETTINGS_CONFIG_NAME: "ffv-settings",
    } satisfies Constants;

    beforeEach(async () => {
        vi.resetModules();

        mockConfGet = vi.fn<(key: string, fallback: unknown) => unknown>(
            (key, fallback) => {
                const store: Record<string, unknown> = {
                    selectedMapTab: "map",
                    theme: "dark",
                };
                return key in store ? store[key] : fallback;
            }
        );

        ({ registerInfoHandlers } =
            (await import("../../../../electron-app/main/ipc/registerInfoHandlers.js")) as RegisterInfoHandlersModule);
        registerIpcHandle = vi.fn<RegisterIpcHandle>();
        appRef = vi.fn<() => AppInfoProvider>().mockReturnValue({
            getAppPath: vi.fn<() => string>().mockReturnValue("/base"),
            getVersion: vi.fn<() => string>().mockReturnValue("1.2.3"),
        });
        fs = {
            readFileSync: vi.fn<(filePath: string) => Buffer>(),
        };
        path = {
            join: vi.fn<(...args: string[]) => string>((...args) =>
                args.join("/")
            ),
        };
        logWithContext = vi.fn<LogWithContext>();
    });

    function getHandlers(): Partial<Record<InfoInvokeChannel, InfoIpcHandler>> {
        class ConfMock {
            public get(key: string, fallback: unknown): unknown {
                return mockConfGet(key, fallback);
            }
        }

        const handlers: Partial<Record<InfoInvokeChannel, InfoIpcHandler>> = {};
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
    }

    function getHandler(
        handlers: Partial<Record<InfoInvokeChannel, InfoIpcHandler>>,
        channel: InfoInvokeChannel
    ): InfoIpcHandler {
        const handler = handlers[channel];

        if (typeof handler !== "function") {
            throw new TypeError(`${channel} handler was not registered`);
        }

        return handler;
    }

    it("no-ops when registerIpcHandle is missing", () => {
        expect.assertions(1);

        const registerResult = registerInfoHandlers({
            registerIpcHandle: null as unknown as RegisterIpcHandle,
            appRef,
            fs,
            path,
            CONSTANTS,
            logWithContext,
        });

        expect({
            appRefCalls: appRef.mock.calls.length,
            logCalls: logWithContext.mock.calls,
            registerIpcCalls: registerIpcHandle.mock.calls,
            registerResult,
        }).toStrictEqual({
            appRefCalls: 0,
            logCalls: [],
            registerIpcCalls: [],
            registerResult: undefined,
        });
    });

    it("provides app/platform metadata and map/theme defaults", async () => {
        expect.assertions(10);

        const handlers = getHandlers();
        const licenseJson = { license: "Unlicense" };
        fs.readFileSync.mockReturnValue(
            Buffer.from(JSON.stringify(licenseJson))
        );

        await expect(getHandler(handlers, "getAppVersion")()).resolves.toBe(
            "1.2.3"
        );
        await expect(getHandler(handlers, "getChromeVersion")()).resolves.toBe(
            process.versions.chrome
        );
        await expect(
            getHandler(handlers, "getElectronVersion")()
        ).resolves.toBe(process.versions.electron);
        await expect(getHandler(handlers, "getLicenseInfo")()).resolves.toBe(
            "Unlicense"
        );
        await expect(getHandler(handlers, "getNodeVersion")()).resolves.toBe(
            process.versions.node
        );
        await expect(
            getHandler(handlers, "getPlatformInfo")()
        ).resolves.toStrictEqual({
            arch: process.arch,
            platform: process.platform,
        });
        await expect(getHandler(handlers, "map-tab:get")()).resolves.toBe(
            "map"
        );
        await expect(getHandler(handlers, "theme:get")()).resolves.toBe("dark");

        expect(path.join).toHaveBeenCalledWith("/base", "package.json");
        expect(logWithContext).not.toHaveBeenCalled();
    });

    it("returns 'Unknown' and logs when license read fails", async () => {
        expect.assertions(2);

        const handlers = getHandlers();
        fs.readFileSync.mockImplementation(() => {
            throw new Error("fs failure");
        });

        await expect(getHandler(handlers, "getLicenseInfo")()).resolves.toBe(
            "Unknown"
        );

        expect(logWithContext).toHaveBeenCalledWith(
            "error",
            "Failed to read license from package.json:",
            {
                error: "fs failure",
            }
        );
    });

    it("normalizes corrupted persisted theme/map-tab values", async () => {
        expect.assertions(2);

        mockConfGet = vi.fn<(key: string, fallback: unknown) => unknown>(
            (key, fallback) => {
                if (key === "selectedMapTab") {
                    return "<img src=x onerror=alert(1)>";
                }
                if (key === "theme") {
                    return "neon";
                }
                return fallback;
            }
        );

        const handlers = getHandlers();
        await expect(getHandler(handlers, "map-tab:get")()).resolves.toBe(
            "map"
        );
        await expect(getHandler(handlers, "theme:get")()).resolves.toBe(
            CONSTANTS.DEFAULT_THEME
        );
    });

    it("falls back and logs when persisted settings cannot be read", async () => {
        expect.assertions(3);

        mockConfGet = vi.fn<(key: string, fallback: unknown) => unknown>(() => {
            throw new Error("settings locked");
        });

        const handlers = getHandlers();

        await expect(getHandler(handlers, "map-tab:get")()).resolves.toBe(
            "map"
        );
        await expect(getHandler(handlers, "theme:get")()).resolves.toBe(
            CONSTANTS.DEFAULT_THEME
        );
        expect(logWithContext.mock.calls).toStrictEqual([
            [
                "warn",
                "Failed to read persisted setting: selectedMapTab",
                { error: "settings locked" },
            ],
            [
                "warn",
                "Failed to read persisted setting: theme",
                { error: "settings locked" },
            ],
        ]);
    });
});
