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

function getGlobalValue(name: string): unknown {
    return Reflect.get(globalThis, name);
}

function setGlobalValue(name: string, value: unknown): void {
    Reflect.set(globalThis, name, value);
}

function getExposedElectronAPI(): AdditionalPreloadElectronApi {
    return getGlobalValue("electronAPI") as AdditionalPreloadElectronApi;
}

function getRegisteredListener(
    call: readonly [string, IpcListener] | undefined,
    label: string
): IpcListener {
    const listener = call?.[1];
    if (typeof listener !== "function") {
        throw new TypeError(`Expected ${label} listener`);
    }
    return listener;
}

describe("preload edge cases", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    // eslint-disable-next-line case-police/string-check -- The preload API exposes this lower-camel global.
    const devToolsGlobalName = "devTools";

    async function importPreloadWithMock(electronBridge: unknown) {
        Reflect.set(globalThis, "__electronHoistedMock", electronBridge);
        await import("../../electron-app/preload.js");
    }

    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        Reflect.deleteProperty(globalThis, "__electronHoistedMock");
        Reflect.deleteProperty(globalThis, "electronAPI");
        Reflect.deleteProperty(globalThis, devToolsGlobalName);
        process.env.NODE_ENV = originalNodeEnv;
        vi.resetModules();
    });

    it("does not expose when validateAPI fails and logs errors", async () => {
        expect.assertions(6);

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

        await importPreloadWithMock({ ipcRenderer });

        // Should have logged validation failure (no electronAPI exposure)
        const validationErrors = consoleErrorSpy.mock.calls.filter(
            (c) =>
                typeof c[0] === "string" &&
                c[0].includes("API validation failed - not exposing")
        );
        expect(validationErrors).toEqual([
            ["[preload.js] API validation failed - not exposing to main world"],
        ]);

        // Dev tools exposure should also fail and log an error due to missing contextBridge
        const devtoolsErrors = consoleErrorSpy.mock.calls.filter(
            (c) =>
                typeof c[0] === "string" &&
                c[0].includes("Failed to expose development tools")
        );
        expect(devtoolsErrors).toHaveLength(1);
        expect(devtoolsErrors[0]?.[0]).toBe(
            "[preload.js] Failed to expose development tools:"
        );
        expect(devtoolsErrors[0]?.[1]).toBeInstanceOf(Error);
        expect((devtoolsErrors[0]?.[1] as Error).message).toBe(
            "contextBridge unavailable"
        );

        // And no exposeInMainWorld should have been called (since it's missing entirely)
        expect(globalThis).not.toHaveProperty("electronAPI");

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
        const call = ipcRenderer.on.mock.calls.find(
            ([channel]) => channel === "open-recent-file"
        );
        expect(call?.[0]).toBe("open-recent-file");
        expect(call?.[1]).toBeTypeOf("function");
        const wrapper = getRegisteredListener(call, "open-recent-file");
        // Simulate event dispatch
        wrapper({}, "C:/test.fit");
        expect(cb).toHaveBeenCalledWith("C:/test.fit");

        // Now cause the callback to throw and ensure it's caught and logged
        const errCb = vi.fn<RecentFileCallback>(() => {
            throw new Error("boom");
        });
        api.onOpenRecentFile(errCb);
        const call2 = ipcRenderer.on.mock.calls.find(
            ([channel, listener]) =>
                channel === "open-recent-file" && listener !== wrapper
        );
        expect(call2?.[0]).toBe("open-recent-file");
        expect(call2?.[1]).toBeTypeOf("function");
        const wrapper2 = getRegisteredListener(
            call2,
            "second open-recent-file"
        );
        wrapper2({}, "C:/test2.fit");
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "[preload.js] Error in onOpenRecentFile callback:",
            expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
    });

    it("injectMenu returns false on invalid parameters and logs error", async () => {
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

        // theme undefined (invalid) and fitFilePath number (invalid) should both be rejected by validation and return false
        const res = await api.injectMenu(undefined, 123);
        expect({
            result: res,
            validationErrors: consoleErrorSpy.mock.calls.map(
                ([message]) => message
            ),
        }).toEqual({
            result: false,
            validationErrors: [
                "[preload.js] injectMenu: fitFilePath must be a string or null",
            ],
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
        ).toEqual(["evt"]);

        consoleErrorSpy.mockRestore();
    });
});
