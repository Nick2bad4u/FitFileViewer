import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type PreloadTestWindow = Window & Record<string, unknown>;
type IpcListener = (...args: unknown[]) => void;
type IpcInvoke = (...args: unknown[]) => Promise<unknown>;
type IpcOn = (channel: string, callback: IpcListener) => void;
type IpcSend = (channel: string, ...args: unknown[]) => void;
type ContextBridgeExpose = (name: string, api: unknown) => void;

interface IpcRendererMock {
    invoke: ReturnType<typeof vi.fn<IpcInvoke>>;
    on: ReturnType<typeof vi.fn<IpcOn>>;
    send: ReturnType<typeof vi.fn<IpcSend>>;
}

interface PreloadElectronBridgeMock {
    contextBridge?: {
        exposeInMainWorld: ReturnType<typeof vi.fn<ContextBridgeExpose>>;
    };
    ipcRenderer?: IpcRendererMock;
}

interface PreloadDevTools {
    getPreloadInfo: () => {
        apiMethods: string[];
        constants: {
            CHANNELS: Record<string, string>;
            DEFAULT_VALUES: {
                FIT_FILE_PATH: null | string;
                THEME: null | string;
            };
            EVENTS: Record<string, string>;
        };
        timestamp: string;
        version: string;
    };
    logAPIState: () => void;
    testIPC: () => Promise<boolean>;
}

interface PreloadElectronApi {
    checkForUpdates: () => void;
    getAppVersion: () => Promise<unknown>;
    getChannelInfo: () => {
        channels: Record<string, string>;
        events: Record<string, string>;
        totalChannels: number;
        totalEvents: number;
    };
    injectMenu: (theme: unknown, fitFilePath: unknown) => Promise<boolean>;
    onMenuOpenFile: (callback: IpcListener) => void;
    onOpenRecentFile: (callback: IpcListener) => void;
    onSetTheme: (callback: IpcListener) => void;
    onUpdateEvent: (eventName: unknown, callback: IpcListener) => void;
    validateAPI: () => unknown;
}

const DEV_TOOLS_GLOBAL = ["dev", "Tools"].join("");

function exposeTestApi(
    exposed: Record<string, unknown>,
    name: string,
    api: unknown
): void {
    exposed[name] = api;
    (window as PreloadTestWindow)[name] = api;
}

function getExposedApi(exposed: Record<string, unknown>): PreloadElectronApi {
    return (exposed["electronAPI"] ??
        (window as PreloadTestWindow).electronAPI) as PreloadElectronApi;
}

function getExposedDevTools(exposed: Record<string, unknown>): PreloadDevTools {
    return (exposed[DEV_TOOLS_GLOBAL] ??
        (window as PreloadTestWindow)[DEV_TOOLS_GLOBAL]) as PreloadDevTools;
}

function createIpcMock(
    listeners = new Map<string, IpcListener[]>(),
    invokeImpl: IpcInvoke = async () => "ok"
): IpcRendererMock {
    return {
        invoke: vi.fn<IpcInvoke>(invokeImpl),
        on: vi.fn<IpcOn>((channel, callback) => {
            const channelListeners = listeners.get(channel) ?? [];
            channelListeners.push(callback);
            listeners.set(channel, channelListeners);
        }),
        send: vi.fn<IpcSend>(),
    };
}

function installPreloadMock(
    ipcBridge: IpcRendererMock,
    exposed: Record<string, unknown>,
    exposeInMainWorld: ReturnType<
        typeof vi.fn<ContextBridgeExpose>
    > = vi.fn<ContextBridgeExpose>((name, api) => {
        exposeTestApi(exposed, name, api);
    })
): PreloadElectronBridgeMock {
    return {
        contextBridge: {
            exposeInMainWorld,
        },
        ipcRenderer: ipcBridge,
    };
}

async function setupPreloadTest({
    env = "test",
    invokeImpl,
}: {
    env?: "development" | "test";
    invokeImpl?: IpcInvoke;
} = {}): Promise<{
    api: PreloadElectronApi;
    exposed: Record<string, unknown>;
    ipcBridge: IpcRendererMock;
    listeners: Map<string, IpcListener[]>;
}> {
    process.env.NODE_ENV = env;
    vi.resetModules();
    const listeners = new Map<string, IpcListener[]>(),
        exposed: Record<string, unknown> = {},
        ipcBridge = createIpcMock(listeners, invokeImpl);
    const electronBridge = installPreloadMock(ipcBridge, exposed);

    await importPreloadFresh(electronBridge);
    return {
        api: getExposedApi(exposed),
        exposed,
        ipcBridge,
        listeners,
    };
}

// Utilities to manage module re-imports with different mocks/env
const importPreloadFresh = async (
    electronBridgeOverride: PreloadElectronBridgeMock
): Promise<unknown> => {
    // Remove any exposed globals from prior runs
    delete (window as PreloadTestWindow).electronAPI;
    delete (window as PreloadTestWindow)[DEV_TOOLS_GLOBAL];
    const { startPreloadEntrypoint } =
        await import("../../electron-app/preload/preloadEntrypoint.js");

    return startPreloadEntrypoint({
        consoleRef: console,
        electronBridgeOverride,
        processRef: process,
    });
};

describe("preload.js electronAPI exposure and behavior", () => {
    const originalEnv = process.env.NODE_ENV;
    let logs: string[] = [];
    let errors: string[] = [];

    beforeEach(() => {
        logs = [];
        errors = [];
        vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
            logs.push(args.join(" "));
        });
        vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
            errors.push(args.join(" "));
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        process.env.NODE_ENV = originalEnv;
    });

    it("exposes electronAPI catalog without DevTools in test env", async () => {
        expect.assertions(6);

        const { api } = await setupPreloadTest();

        // Basic API methods should exist
        expect({
            getChannelInfo: typeof api.getChannelInfo,
            validateAPI: typeof api.validateAPI,
        }).toStrictEqual({
            getChannelInfo: "function",
            validateAPI: "function",
        });
        expect(window).not.toHaveProperty(DEV_TOOLS_GLOBAL);

        // getChannelInfo returns the preload catalog used by the exposed API.
        const info = api.getChannelInfo();
        expect(info.totalChannels).toBe(Object.keys(info.channels).length);
        expect(info.totalEvents).toBe(Object.keys(info.events).length);
        expect({
            APP_VERSION: info.channels.APP_VERSION,
            DEVTOOLS_INJECT_MENU: info.channels.DEVTOOLS_INJECT_MENU,
            FILE_READ: info.channels.FILE_READ,
            FIT_DECODE: info.channels.FIT_DECODE,
            THEME_GET: info.channels.THEME_GET,
        }).toStrictEqual({
            APP_VERSION: "getAppVersion",
            DEVTOOLS_INJECT_MENU: "devtools-inject-menu",
            FILE_READ: "file:read",
            FIT_DECODE: "fit:decode",
            THEME_GET: "theme:get",
        });
        expect({
            MENU_CHECK_FOR_UPDATES: info.events.MENU_CHECK_FOR_UPDATES,
            MENU_OPEN_FILE: info.events.MENU_OPEN_FILE,
            OPEN_RECENT_FILE: info.events.OPEN_RECENT_FILE,
            SET_THEME: info.events.SET_THEME,
        }).toStrictEqual({
            MENU_CHECK_FOR_UPDATES: "menu-check-for-updates",
            MENU_OPEN_FILE: "menu-open-file",
            OPEN_RECENT_FILE: "open-recent-file",
            SET_THEME: "set-theme",
        });
    });

    it("transforms preload event payloads before invoking callbacks", async () => {
        expect.assertions(6);

        const { api, listeners } = await setupPreloadTest();

        // Transform branches for event handlers
        const recentCb = vi.fn<IpcListener>();
        api.onOpenRecentFile(recentCb);
        // Simulate event
        const recHandlers = listeners.get("open-recent-file");
        expect(recHandlers).toHaveLength(1);
        recHandlers?.[0]?.({}, "C:/file.fit");
        expect(recentCb).toHaveBeenCalledWith("C:/file.fit");

        const themeCb = vi.fn<IpcListener>();
        api.onSetTheme(themeCb);
        const themeHandlers = listeners.get("set-theme");
        expect(themeHandlers).toHaveLength(1);
        themeHandlers?.[0]?.({}, "dark");
        expect(themeCb).toHaveBeenCalledWith("dark");

        const menuCb = vi.fn<IpcListener>();
        api.onMenuOpenFile(menuCb);
        const menuHandlers = listeners.get("menu-open-file");
        expect(menuHandlers).toHaveLength(1);
        menuHandlers?.[0]?.({}, "arg1", 2);
        expect(menuCb).toHaveBeenCalledWith("arg1", 2);
    });

    it("surfaces preload invoke and send failures", async () => {
        expect.assertions(5);

        const { api, ipcBridge } = await setupPreloadTest();

        // createSafeInvoke success
        await expect(api.getAppVersion()).resolves.toBe("ok");

        // createSafeInvoke catch path
        ipcBridge.invoke.mockRejectedValueOnce(new Error("boom"));
        await expect(api.getAppVersion()).rejects.toThrow("boom");
        expect(errors.join("\n")).toMatch(/Error in getAppVersion/);

        // createSafeSend catch path
        ipcBridge.send.mockImplementationOnce(() => {
            throw new Error("send-fail");
        });
        api.checkForUpdates();
        expect(ipcBridge.send).toHaveBeenCalledWith("menu-check-for-updates");
        expect(errors.join("\n")).toMatch(/Error in checkForUpdates/);
    });

    it("validates dynamic update subscriptions", async () => {
        expect.assertions(4);

        const { api, ipcBridge, listeners } = await setupPreloadTest();

        // onUpdateEvent validation and success
        const updCb = vi.fn<IpcListener>();
        api.onUpdateEvent(123, updCb);
        // invalid eventName -> no listener registration
        expect(ipcBridge.on).not.toHaveBeenCalled();
        api.onUpdateEvent("update-downloaded", updCb);
        const updHandlers = listeners.get("update-downloaded");
        expect(updHandlers).toHaveLength(1);
        updHandlers?.[0]?.({}, { v: 1 });
        expect(updCb).toHaveBeenCalledWith({ v: 1 });

        expect(listeners.has("custom:event")).toBe(false);
    });

    it("validates menu injection inputs", async () => {
        expect.assertions(3);

        const { api, ipcBridge } = await setupPreloadTest();

        await expect(api.injectMenu(5, null)).resolves.toStrictEqual(false);
        await expect(api.injectMenu("dark", 9)).resolves.toStrictEqual(false);
        ipcBridge.invoke.mockResolvedValueOnce(true);
        await expect(api.injectMenu("dark", null)).resolves.toStrictEqual(true);
    });

    it("does not expose when validateAPI fails (else branch)", async () => {
        expect.assertions(2);

        process.env.NODE_ENV = "test";
        vi.resetModules();
        await importPreloadFresh({
            contextBridge: null,
            ipcRenderer: null,
        });
        expect(window).not.toHaveProperty("electronAPI");
        expect(errors.join("\n")).toMatch(
            /API validation failed - not exposing/
        );
    });

    it("catches errors thrown by exposeInMainWorld (catch branch)", async () => {
        expect.assertions(1);

        process.env.NODE_ENV = "test";
        vi.resetModules();
        const ipcBridge = createIpcMock(),
            exposed: Record<string, unknown> = {};
        const electronBridge = installPreloadMock(
            ipcBridge,
            exposed,
            vi.fn<ContextBridgeExpose>(() => {
                throw new Error("expose failed");
            })
        );

        await importPreloadFresh(electronBridge);
        const errStr = errors.join("\n");
        expect(errStr).toMatch(/Failed to expose electronAPI/);
    });

    it("exposes DevTools in development and supports helpers", async () => {
        expect.assertions(14);

        process.env.NODE_ENV = "development";
        vi.resetModules();
        const listeners = new Map<string, IpcListener[]>(),
            ipcBridge = createIpcMock(listeners, async () => "1.2.3"),
            exposed: Record<string, unknown> = {};
        const electronBridge = installPreloadMock(ipcBridge, exposed);

        // Intercept process.once to capture cleanup callback
        let beforeExitCb: (() => void) | null = null;
        const onceSpy = vi
            .spyOn(process, "once")
            .mockImplementation(
                (eventName, listener: (...args: unknown[]) => void) => {
                    if (eventName === "beforeExit") {
                        beforeExitCb = () => {
                            listener(0);
                        };
                    }
                    return process;
                }
            );

        await importPreloadFresh(electronBridge);
        const dev = getExposedDevTools(exposed);
        expect({
            getPreloadInfo: typeof dev.getPreloadInfo,
            logAPIState: typeof dev.logAPIState,
            testIPC: typeof dev.testIPC,
        }).toStrictEqual({
            getPreloadInfo: "function",
            logAPIState: "function",
            testIPC: "function",
        });
        const info = dev.getPreloadInfo();
        expect(info.apiMethods).toContain("getAppVersion");
        expect(info.apiMethods).toContain("getChannelInfo");
        expect(info.apiMethods).toContain("injectMenu");
        expect({
            APP_VERSION: info.constants.CHANNELS.APP_VERSION,
            DEVTOOLS_INJECT_MENU: info.constants.CHANNELS.DEVTOOLS_INJECT_MENU,
            FIT_PARSE: info.constants.CHANNELS.FIT_PARSE,
        }).toStrictEqual({
            APP_VERSION: "getAppVersion",
            DEVTOOLS_INJECT_MENU: "devtools-inject-menu",
            FIT_PARSE: "fit:parse",
        });
        expect({
            INSTALL_UPDATE: info.constants.EVENTS.INSTALL_UPDATE,
            OPEN_RECENT_FILE: info.constants.EVENTS.OPEN_RECENT_FILE,
            THEME_CHANGED: info.constants.EVENTS.THEME_CHANGED,
        }).toStrictEqual({
            INSTALL_UPDATE: "install-update",
            OPEN_RECENT_FILE: "open-recent-file",
            THEME_CHANGED: "theme-changed",
        });
        expect(info.constants.DEFAULT_VALUES).toEqual({
            FIT_FILE_PATH: null,
            THEME: null,
        });
        expect(info.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        expect(info.version).toBe("1.0.0");

        await expect(dev.testIPC()).resolves.toStrictEqual(true);
        dev.logAPIState();
        expect(logs.join("\n")).toMatch(/Current API State/);

        // Trigger beforeExit cleanup handler
        const [registeredEventName, registeredListener] =
            onceSpy.mock.calls.find(
                ([eventName]) => eventName === "beforeExit"
            ) ?? [];
        expect({
            registeredEventName,
            registeredListenerType: typeof registeredListener,
        }).toStrictEqual({
            registeredEventName: "beforeExit",
            registeredListenerType: "function",
        });
        expect(beforeExitCb).toBeTypeOf("function");
        (beforeExitCb as () => void)();
        expect(logs.join("\n")).toMatch(/Process exiting, performing cleanup/);
    });
});
