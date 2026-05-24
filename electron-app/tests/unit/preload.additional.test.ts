import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("preload.js - Additional edge coverage", () => {
    const originalNodeEnv = process.env.NODE_ENV;

    async function importPreloadWithMock(electronBridge: unknown) {
        Reflect.set(globalThis, "__electronHoistedMock", electronBridge);
        await import("../../preload.js");
    }

    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        Reflect.deleteProperty(globalThis, "__electronHoistedMock");
        Reflect.deleteProperty(globalThis, "electronAPI");
        Reflect.deleteProperty(globalThis, "devTools");
        process.env.NODE_ENV = originalNodeEnv;
        vi.resetModules();
    });

    it("does not expose when validateAPI fails and logs errors", async () => {
        process.env.NODE_ENV = "development";

        const ipcRenderer = {
            invoke: vi.fn(),
            send: vi.fn(),
            on: vi.fn(),
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
        expect(validationErrors.length).toBeGreaterThan(0);

        // Dev tools exposure should also fail and log an error due to missing contextBridge
        const devtoolsErrors = consoleErrorSpy.mock.calls.filter(
            (c) =>
                typeof c[0] === "string" &&
                c[0].includes("Failed to expose development tools")
        );
        expect(devtoolsErrors.length).toBeGreaterThan(0);

        // And no exposeInMainWorld should have been called (since it's missing entirely)
        expect((globalThis as any).electronAPI).toBeUndefined();

        consoleErrorSpy.mockRestore();
        consoleLogSpy.mockRestore();
    });

    it("event handlers: transform works and callback errors are caught", async () => {
        const ipcRenderer = {
            invoke: vi.fn().mockResolvedValue("ok"),
            send: vi.fn(),
            on: vi.fn(),
        };
        const contextBridge = {
            exposeInMainWorld: vi
                .fn()
                .mockImplementation((name: string, api: any) => {
                    (globalThis as any)[name] = api;
                }),
        };
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        await importPreloadWithMock({ ipcRenderer, contextBridge });

        const api = (globalThis as any).electronAPI;
        expect(typeof api.onOpenRecentFile).toBe("function");

        // Register onOpenRecentFile and capture wrapper
        const cb = vi.fn();
        api.onOpenRecentFile(cb);
        const call = ipcRenderer.on.mock.calls.find(
            (c: any[]) => c[0] === "open-recent-file"
        );
        expect(call?.[0]).toBe("open-recent-file");
        expect(typeof call?.[1]).toBe("function");
        const wrapper = (call as any)[1];
        // Simulate event dispatch
        wrapper({}, "C:/test.fit");
        expect(cb).toHaveBeenCalledWith("C:/test.fit");

        // Now cause the callback to throw and ensure it's caught and logged
        const errCb = vi.fn(() => {
            throw new Error("boom");
        });
        api.onOpenRecentFile(errCb);
        const call2 = ipcRenderer.on.mock.calls.find(
            (c: any[]) => c[0] === "open-recent-file" && c[1] !== wrapper
        );
        expect(call2?.[0]).toBe("open-recent-file");
        expect(typeof call2?.[1]).toBe("function");
        const wrapper2 = (call2 as any)[1];
        wrapper2({}, "C:/test2.fit");
        expect(consoleErrorSpy).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
    });

    it("injectMenu returns false on invalid parameters and logs error", async () => {
        const ipcRenderer = {
            invoke: vi.fn().mockResolvedValue(true),
            send: vi.fn(),
            on: vi.fn(),
        };
        const contextBridge = {
            exposeInMainWorld: vi
                .fn()
                .mockImplementation((name: string, api: any) => {
                    (globalThis as any)[name] = api;
                }),
        };
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        await importPreloadWithMock({ ipcRenderer, contextBridge });

        const api = (globalThis as any).electronAPI;
        expect(typeof api.injectMenu).toBe("function");

        // theme undefined (invalid) and fitFilePath number (invalid) should both be rejected by validation and return false
        const res = await api.injectMenu(undefined, 123 as any);
        expect(res).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
    });

    it("onUpdateEvent registers only when eventName and callback are valid", async () => {
        const ipcRenderer = { invoke: vi.fn(), send: vi.fn(), on: vi.fn() };
        const contextBridge = {
            exposeInMainWorld: vi
                .fn()
                .mockImplementation((name: string, api: any) => {
                    (globalThis as any)[name] = api;
                }),
        };

        await importPreloadWithMock({ ipcRenderer, contextBridge });

        const api = (globalThis as any).electronAPI;
        const before = ipcRenderer.on.mock.calls.length;
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        // Invalid eventName should be ignored
        api.onUpdateEvent(null as any, () => {});
        // Invalid callback should be ignored
        api.onUpdateEvent("evt", null as any);
        // Valid pair should register
        api.onUpdateEvent("evt", () => {});
        const after = ipcRenderer.on.mock.calls.length;
        expect(after - before).toBe(1);

        consoleErrorSpy.mockRestore();
    });
});
