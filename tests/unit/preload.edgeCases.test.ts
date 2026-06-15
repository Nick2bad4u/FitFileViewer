import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type IpcListener = (event: unknown, ...args: unknown[]) => void;
type RecentFileCallback = (filePath: string) => void;
type UpdateEventCallback = () => void;

interface IpcRendererMock {
    invoke: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<unknown>>>;
    on: ReturnType<
        typeof vi.fn<(channel: string, listener: IpcListener) => void>
    >;
    send: ReturnType<typeof vi.fn<(...args: unknown[]) => void>>;
}

interface ContextBridgeMock {
    exposeInMainWorld: ReturnType<
        typeof vi.fn<(name: string, api: unknown) => void>
    >;
}

interface AdditionalPreloadElectronApi {
    injectMenu: (theme: unknown, fitFilePath: unknown) => Promise<boolean>;
    onOpenRecentFile: (callback: (filePath: string) => void) => void;
    onUpdateEvent: (eventName: unknown, callback: unknown) => void;
}

const exposedGlobalValues = new Map<string, unknown>();

function getGlobalValue(name: string): unknown {
    return exposedGlobalValues.get(name);
}

function setGlobalValue(name: string, value: unknown): void {
    exposedGlobalValues.set(name, value);
}

function getExposedElectronAPI(): AdditionalPreloadElectronApi {
    return getGlobalValue("electronAPI") as AdditionalPreloadElectronApi;
}

function getRegisteredListener(
    call: readonly [string, IpcListener],
    label: string
): IpcListener {
    const listener = call[1];
    if (typeof listener !== "function") {
        throw new TypeError(`Expected ${label} listener`);
    }
    return listener;
}

function getRequiredMockCall<T extends unknown[]>(
    call: T | undefined,
    label: string
): T {
    if (!call) {
        throw new TypeError(`Expected ${label} call`);
    }

    return call;
}

function getRequiredIpcListenerCall(
    ipcRenderer: IpcRendererMock,
    channelName: string,
    predicate: (call: readonly [string, IpcListener]) => boolean = ([
        channel,
    ]) => channel === channelName
): [string, IpcListener] {
    const call = ipcRenderer.on.mock.calls.find((entry) =>
        predicate(entry as [string, IpcListener])
    );

    if (!call) {
        throw new TypeError(`Expected ipcRenderer.on call for ${channelName}`);
    }

    return call as [string, IpcListener];
}

describe("preload edge cases", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    // eslint-disable-next-line case-police/string-check -- The preload API exposes this lower-camel global.
    const devToolsGlobalName = "devTools";

    async function importPreloadWithMock(electronBridge: unknown) {
        const { startPreloadEntrypoint } =
            await import("../../electron-app/preload/preloadEntrypoint.js");

        startPreloadEntrypoint({
            consoleRef: console,
            electronBridgeOverride: electronBridge as never,
            globalScope: globalThis,
            processRef: process,
        });
    }

    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        exposedGlobalValues.clear();
        process.env.NODE_ENV = originalNodeEnv;
        vi.resetModules();
    });

    it("does not expose when validateAPI fails and logs errors", async () => {
        expect.assertions(3);

        process.env.NODE_ENV = "development";

        const ipcRenderer: IpcRendererMock = {
            invoke: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
            send: vi.fn<(...args: unknown[]) => void>(),
            on: vi.fn<(channel: string, listener: IpcListener) => void>(),
        };

        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const consoleLogSpy = vi
            .spyOn(console, "log")
            .mockImplementation(() => {});

        await importPreloadWithMock({ contextBridge: null, ipcRenderer });

        expect(
            consoleErrorSpy.mock.calls.map(([message, detail]) => ({
                errorMessage:
                    detail instanceof Error ? detail.message : undefined,
                message,
            }))
        ).toStrictEqual([
            {
                errorMessage: undefined,
                message:
                    "[preload.js] API validation failed - not exposing to main world",
            },
            {
                errorMessage: "contextBridge unavailable",
                message: "[preload.js] Failed to expose development tools:",
            },
        ]);
        const failedDevToolsCall = getRequiredMockCall(
            consoleErrorSpy.mock.calls.at(1),
            "development tools failure log"
        );
        expect(failedDevToolsCall[1]).toBeInstanceOf(Error);

        // And no exposeInMainWorld should have been called (since it's missing entirely)
        expect(exposedGlobalValues.has("electronAPI")).toBe(false);

        consoleErrorSpy.mockRestore();
        consoleLogSpy.mockRestore();
    });

    it("event handlers: transform works and callback errors are caught", async () => {
        expect.assertions(7);

        const ipcRenderer: IpcRendererMock = {
            invoke: vi
                .fn<(...args: unknown[]) => Promise<unknown>>()
                .mockResolvedValue("ok"),
            send: vi.fn<(...args: unknown[]) => void>(),
            on: vi.fn<(channel: string, listener: IpcListener) => void>(),
        };
        const contextBridge: ContextBridgeMock = {
            exposeInMainWorld: vi
                .fn<(name: string, api: unknown) => void>()
                .mockImplementation((name, api) => {
                    setGlobalValue(name, api);
                }),
        };
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        await importPreloadWithMock({ ipcRenderer, contextBridge });

        const api = getExposedElectronAPI();
        expect(api.onOpenRecentFile).toBeTypeOf("function");

        // Register onOpenRecentFile and capture wrapper
        const cb = vi.fn<RecentFileCallback>();
        api.onOpenRecentFile(cb);
        const call = getRequiredIpcListenerCall(
            ipcRenderer,
            "open-recent-file"
        );
        expect(call[0]).toBe("open-recent-file");
        expect(call[1]).toBeTypeOf("function");
        const wrapper = getRegisteredListener(call, "open-recent-file");
        // Simulate event dispatch
        wrapper({}, "C:/test.fit");
        expect(cb).toHaveBeenCalledWith("C:/test.fit");

        // Now cause the callback to throw and ensure it's caught and logged
        const callbackError = new Error("boom");
        const errCb = vi.fn<RecentFileCallback>(() => {
            throw callbackError;
        });
        api.onOpenRecentFile(errCb);
        const call2 = getRequiredIpcListenerCall(
            ipcRenderer,
            "open-recent-file",
            ([channel, listener]) =>
                channel === "open-recent-file" && listener !== wrapper
        );
        expect(call2[0]).toBe("open-recent-file");
        expect(call2[1]).toBeTypeOf("function");
        const wrapper2 = getRegisteredListener(
            call2,
            "second open-recent-file"
        );
        wrapper2({}, "C:/test2.fit");
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "[preload.js] Error in onOpenRecentFile callback:",
            callbackError
        );

        consoleErrorSpy.mockRestore();
    });

    it("injectMenu returns false on invalid parameters without logging", async () => {
        expect.assertions(2);

        const ipcRenderer: IpcRendererMock = {
            invoke: vi
                .fn<(...args: unknown[]) => Promise<unknown>>()
                .mockResolvedValue(true),
            send: vi.fn<(...args: unknown[]) => void>(),
            on: vi.fn<(channel: string, listener: IpcListener) => void>(),
        };
        const contextBridge: ContextBridgeMock = {
            exposeInMainWorld: vi
                .fn<(name: string, api: unknown) => void>()
                .mockImplementation((name, api) => {
                    setGlobalValue(name, api);
                }),
        };
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        await importPreloadWithMock({ ipcRenderer, contextBridge });

        const api = getExposedElectronAPI();
        expect(api.injectMenu).toBeTypeOf("function");

        // Invalid optional developer-menu payloads should fail closed before IPC.
        const res = await api.injectMenu(undefined, 123);
        expect({
            result: res,
            validationErrors: consoleErrorSpy.mock.calls.map(
                ([message]) => message
            ),
        }).toStrictEqual({
            result: false,
            validationErrors: [],
        });

        consoleErrorSpy.mockRestore();
    });

    it("onUpdateEvent registers only when eventName and callback are valid", async () => {
        expect.assertions(1);

        const ipcRenderer: IpcRendererMock = {
            invoke: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
            send: vi.fn<(...args: unknown[]) => void>(),
            on: vi.fn<(channel: string, listener: IpcListener) => void>(),
        };
        const contextBridge: ContextBridgeMock = {
            exposeInMainWorld: vi
                .fn<(name: string, api: unknown) => void>()
                .mockImplementation((name, api) => {
                    setGlobalValue(name, api);
                }),
        };

        await importPreloadWithMock({ ipcRenderer, contextBridge });

        const api = getExposedElectronAPI();
        const before = ipcRenderer.on.mock.calls.length;
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        // Invalid eventName should be ignored
        api.onUpdateEvent(null, vi.fn<UpdateEventCallback>());
        // Invalid callback should be ignored
        api.onUpdateEvent("evt", null);
        // Valid pair should register
        api.onUpdateEvent("evt", vi.fn<UpdateEventCallback>());
        expect(
            ipcRenderer.on.mock.calls.slice(before).map(([channel]) => channel)
        ).toStrictEqual(["evt"]);

        consoleErrorSpy.mockRestore();
    });
});
