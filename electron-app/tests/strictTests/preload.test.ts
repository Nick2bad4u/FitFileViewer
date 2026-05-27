import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type PreloadTestWindow = Window & Record<string, unknown>;
type IpcListener = (...args: unknown[]) => void;
type MockFunction = ReturnType<typeof vi.fn>;

interface IpcRendererMock {
    invoke: MockFunction;
    on: MockFunction;
    send: MockFunction;
}

interface PreloadDevTools {
    getPreloadInfo: () => {
        apiMethods: string[];
        constants: Record<string, unknown>;
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
        totalChannels: number;
        totalEvents: number;
    };
    injectMenu: (theme: unknown, fitFilePath: unknown) => Promise<boolean>;
    invoke: (channel: unknown, ...args: unknown[]) => Promise<unknown>;
    onIpc: (channel: unknown, callback: unknown) => void;
    onMenuOpenFile: (callback: IpcListener) => void;
    onOpenRecentFile: (callback: IpcListener) => void;
    onSetTheme: (callback: IpcListener) => void;
    onUpdateEvent: (eventName: unknown, callback: IpcListener) => void;
    send: (channel: unknown, ...args: unknown[]) => void;
    validateAPI: () => unknown;
}

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
    return (exposed["devTools"] ??
        (window as PreloadTestWindow).devTools) as PreloadDevTools;
}

// Utilities to manage module re-imports with different mocks/env
const importPreloadFresh = async () => {
    // Remove any exposed globals from prior runs
    delete (window as PreloadTestWindow).electronAPI;
    delete (window as PreloadTestWindow).devTools;
    return await import("../../preload.js");
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
        Reflect.deleteProperty(globalThis, "__electronHoistedMock");
        process.env.NODE_ENV = originalEnv;
    });

    it("exposes electronAPI when validateAPI passes and devTools not in test env", async () => {
        process.env.NODE_ENV = "test";
        vi.resetModules();
        const listeners = new Map<string, IpcListener[]>();
        const ipcRenderer: IpcRendererMock = {
            invoke: vi.fn(async () => "ok"),
            send: vi.fn(),
            on: vi.fn((channel: string, cb: IpcListener) => {
                const arr = listeners.get(channel) || [];
                arr.push(cb);
                listeners.set(channel, arr);
            }),
        };
        const exposed: Record<string, unknown> = {};
        Reflect.set(globalThis, "__electronHoistedMock", {
            contextBridge: {
                exposeInMainWorld: vi.fn((name: string, api: unknown) => {
                    exposeTestApi(exposed, name, api);
                }),
            },
            ipcRenderer,
        });

        await importPreloadFresh();
        const api = getExposedApi(exposed);

        // Basic API methods should exist
        expect(api).toEqual(
            expect.objectContaining({
                getChannelInfo: expect.any(Function),
                validateAPI: expect.any(Function),
            })
        );

        // getChannelInfo returns counts > 0
        const info = api.getChannelInfo();
        expect(info.totalChannels).toBeGreaterThan(0);
        expect(info.totalEvents).toBeGreaterThan(0);

        // Transform branches for event handlers
        const recentCb = vi.fn();
        api.onOpenRecentFile(recentCb);
        // Simulate event
        const recHandlers = listeners.get("open-recent-file");
        expect(recHandlers).toHaveLength(1);
        recHandlers?.[0]?.({}, "C:/file.fit");
        expect(recentCb).toHaveBeenCalledWith("C:/file.fit");

        const themeCb = vi.fn();
        api.onSetTheme(themeCb);
        const themeHandlers = listeners.get("set-theme");
        themeHandlers?.[0]?.({}, "dark");
        expect(themeCb).toHaveBeenCalledWith("dark");

        const menuCb = vi.fn();
        api.onMenuOpenFile(menuCb);
        const menuHandlers = listeners.get("menu-open-file");
        menuHandlers?.[0]?.({}, "arg1", 2);
        expect(menuCb).toHaveBeenCalledWith("arg1", 2);

        // createSafeInvoke success
        await expect(api.getAppVersion()).resolves.toBe("ok");

        // createSafeInvoke catch path
        ipcRenderer.invoke.mockRejectedValueOnce(new Error("boom"));
        await expect(api.getAppVersion()).rejects.toThrow("boom");
        expect(errors.join("\n")).toMatch(/Error in getAppVersion/);

        // createSafeSend catch path
        ipcRenderer.send.mockImplementationOnce(() => {
            throw new Error("send-fail");
        });
        expect(api.checkForUpdates()).toBeUndefined();
        expect(ipcRenderer.send).toHaveBeenCalledWith("menu-check-for-updates");
        expect(errors.join("\n")).toMatch(/Error in checkForUpdates/);

        // onUpdateEvent validation and success
        const updCb = vi.fn();
        api.onUpdateEvent(123, updCb);
        // invalid eventName -> no listener registration
        expect(ipcRenderer.on).toHaveBeenCalledTimes(3); // from previous handlers only
        api.onUpdateEvent("update-downloaded", updCb);
        const updHandlers = listeners.get("update-downloaded");
        updHandlers?.[0]?.({}, { v: 1 });
        expect(updCb).toHaveBeenCalledWith({ v: 1 });

        // onIpc invalid args
        const onIpcCb = vi.fn();
        api.onIpc(42, onIpcCb);
        api.onIpc("custom:event", "nope");
        // valid path
        api.onIpc("custom:event", onIpcCb);
        const customHandlers = listeners.get("custom:event");
        customHandlers?.[0]?.({ id: "evt" }, 1, 2, 3);
        expect(onIpcCb).toHaveBeenCalledWith({ id: "evt" }, 1, 2, 3);

        // send/invoke validation
        api.send(99);
        await expect(api.invoke(99)).rejects.toThrow(/Invalid channel/);

        // injectMenu validation and success
        await expect(api.injectMenu(5, null)).resolves.toBe(false);
        await expect(api.injectMenu("dark", 9)).resolves.toBe(false);
        ipcRenderer.invoke.mockResolvedValueOnce(true);
        await expect(api.injectMenu("dark", null)).resolves.toBe(true);
    });

    it("does not expose when validateAPI fails (else branch)", async () => {
        process.env.NODE_ENV = "test";
        vi.resetModules();
        Reflect.set(globalThis, "__electronHoistedMock", {
            // no contextBridge/ipcRenderer provided
        });
        await importPreloadFresh();
        expect((window as PreloadTestWindow).electronAPI).toBeUndefined();
        expect(errors.join("\n")).toMatch(
            /API validation failed - not exposing/
        );
    });

    it("catches errors thrown by exposeInMainWorld (catch branch)", async () => {
        process.env.NODE_ENV = "test";
        vi.resetModules();
        const ipcRenderer: IpcRendererMock = {
            invoke: vi.fn(),
            send: vi.fn(),
            on: vi.fn(),
        };
        Reflect.set(globalThis, "__electronHoistedMock", {
            contextBridge: {
                exposeInMainWorld: vi.fn(() => {
                    throw new Error("expose failed");
                }),
            },
            ipcRenderer,
        });
        await importPreloadFresh();
        const errStr = errors.join("\n");
        expect(errStr).toMatch(/Failed to expose electronAPI/);
    });

    it("exposes devTools in development and supports helpers", async () => {
        process.env.NODE_ENV = "development";
        vi.resetModules();
        const listeners = new Map<string, IpcListener[]>();
        const ipcRenderer: IpcRendererMock = {
            invoke: vi.fn(async () => "1.2.3"),
            send: vi.fn(),
            on: vi.fn((channel: string, cb: IpcListener) => {
                const arr = listeners.get(channel) || [];
                arr.push(cb);
                listeners.set(channel, arr);
            }),
        };
        const exposed: Record<string, unknown> = {};
        Reflect.set(globalThis, "__electronHoistedMock", {
            contextBridge: {
                exposeInMainWorld: vi.fn((name: string, api: unknown) => {
                    exposeTestApi(exposed, name, api);
                }),
            },
            ipcRenderer,
        });

        // Intercept process.once to capture cleanup callback
        let beforeExitCb: (() => void) | null = null;
        const onceSpy = vi
            .spyOn(process, "once")
            .mockImplementation((evt, cb) => {
                if (evt === "beforeExit") beforeExitCb = cb;
                return process;
            });

        await importPreloadFresh();
        const dev = getExposedDevTools(exposed);
        expect(dev).toEqual(
            expect.objectContaining({
                getPreloadInfo: expect.any(Function),
                logAPIState: expect.any(Function),
                testIPC: expect.any(Function),
            })
        );
        const info = dev.getPreloadInfo();
        expect(info).toEqual(
            expect.objectContaining({
                apiMethods: expect.arrayContaining(["getAppVersion"]),
                constants: expect.any(Object),
                timestamp: expect.stringMatching(
                    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
                ),
                version: "1.0.0",
            })
        );

        await expect(dev.testIPC()).resolves.toBe(true);
        dev.logAPIState();
        expect(logs.join("\n")).toMatch(/Current API State/);

        // Trigger beforeExit cleanup handler
        expect(onceSpy).toHaveBeenCalled();
        expect(typeof beforeExitCb).toBe("function");
        (beforeExitCb as unknown as () => void)();
        expect(logs.join("\n")).toMatch(/Process exiting, performing cleanup/);
    });
});
