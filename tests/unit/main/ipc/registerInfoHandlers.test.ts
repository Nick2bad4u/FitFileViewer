// @vitest-environment node
import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setRuntimeProcess } from "../../../../electron-app/utils/runtime/processEnvironment.js";

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
    promises: {
        readFile: Mock<
            (filePath: string, encoding: BufferEncoding) => Promise<string>
        >;
    };
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

const originalProcess = globalThis.process;

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
        setRuntimeProcess({
            arch: "x64",
            cwd: () => "/runtime-cwd",
            platform: "test-platform",
            versions: {
                chrome: "120.0.0",
                electron: "30.0.0",
                node: "22.0.0",
            },
        });

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
            promises: {
                readFile:
                    vi.fn<
                        (
                            filePath: string,
                            encoding: BufferEncoding
                        ) => Promise<string>
                    >(),
            },
        };
        path = {
            join: vi.fn<(...args: string[]) => string>((...args) =>
                args.join("/")
            ),
        };
        logWithContext = vi.fn<LogWithContext>();
    });

    afterEach(() => {
        setRuntimeProcess(originalProcess);
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
        fs.promises.readFile.mockResolvedValue(JSON.stringify(licenseJson));

        await expect(getHandler(handlers, "getAppVersion")()).resolves.toBe(
            "1.2.3"
        );
        await expect(getHandler(handlers, "getChromeVersion")()).resolves.toBe(
            "120.0.0"
        );
        await expect(
            getHandler(handlers, "getElectronVersion")()
        ).resolves.toBe("30.0.0");
        await expect(getHandler(handlers, "getLicenseInfo")()).resolves.toBe(
            "Unlicense"
        );
        await expect(getHandler(handlers, "getNodeVersion")()).resolves.toBe(
            "22.0.0"
        );
        await expect(
            getHandler(handlers, "getPlatformInfo")()
        ).resolves.toStrictEqual({
            arch: "x64",
            platform: "test-platform",
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
        fs.promises.readFile.mockRejectedValue(new Error("fs failure"));

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
