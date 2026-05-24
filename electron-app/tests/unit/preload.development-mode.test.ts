import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("preload.js - Development mode coverage", () => {
    let originalElectronAPI: any;
    let originalDevTools: any;
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
        originalElectronAPI = (globalThis as any).electronAPI;
        originalDevTools = (globalThis as any).devTools;
        delete (globalThis as any).electronAPI;
        delete (globalThis as any).devTools;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
        Reflect.deleteProperty(globalThis, "__electronHoistedMock");
        process.env.NODE_ENV = originalNodeEnv;
        // restore globals if they existed
        if (originalElectronAPI)
            (globalThis as any).electronAPI = originalElectronAPI;
        if (originalDevTools) (globalThis as any).devTools = originalDevTools;
    });

    it("exposes api and dev tools, logs dev messages, and handles beforeExit in development", async () => {
        const ipcRenderer = {
            invoke: vi.fn().mockResolvedValue("2.3.4"),
            send: vi.fn(),
            on: vi.fn(),
        } as const;

        const contextBridge = {
            exposeInMainWorld: vi
                .fn()
                .mockImplementation((name: string, api: any) => {
                    (globalThis as any)[name] = api;
                }),
        };

        const logs: any[] = [];
        const errors: any[] = [];
        const consoleLogSpy = vi
            .spyOn(console, "log")
            .mockImplementation((...args: any[]) => {
                logs.push(args);
            });
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation((...args: any[]) => {
                errors.push(args);
            });

        const onceCalls: Array<{ event: string; cb: Function }> = [];
        const processOnceSpy = vi
            .spyOn(process, "once")
            .mockImplementation((event: string, cb: Function) => {
                onceCalls.push({ event, cb });
                return process;
            }) as any;

        process.env.NODE_ENV = "development";
        Reflect.set(globalThis, "__electronHoistedMock", {
            contextBridge,
            ipcRenderer,
        });
        await import("../../preload.js");

        // electronAPI should be exposed
        const api = (globalThis as any).electronAPI;
        expect(api).toEqual(
            expect.objectContaining({
                getAppVersion: expect.any(Function),
                injectMenu: expect.any(Function),
                invoke: expect.any(Function),
                validateAPI: expect.any(Function),
            })
        );

        // devTools should be exposed in development
        const devTools = (globalThis as any).devTools;
        expect(devTools).toEqual(
            expect.objectContaining({
                getPreloadInfo: expect.any(Function),
                logAPIState: expect.any(Function),
                testIPC: expect.any(Function),
            })
        );

        // getPreloadInfo returns structure with constants and apiMethods
        const info = devTools.getPreloadInfo();
        expect(info).toHaveProperty("apiMethods");
        expect(Array.isArray(info.apiMethods)).toBe(true);
        expect(info).toHaveProperty("constants");
        expect(info.constants).toHaveProperty("CHANNELS");

        // testIPC should call through to ipcRenderer.invoke via electronAPI.getAppVersion and return true
        const ok = await devTools.testIPC();
        expect(ok).toBe(true);
        expect(ipcRenderer.invoke).toHaveBeenCalled();

        // logAPIState should log current state
        devTools.logAPIState();
        expect(
            logs.some((args) => String(args[0]).includes("Current API State"))
        ).toBe(true);

        // Should have logged successful exposure and API structure messages
        expect(
            logs.some((args) =>
                String(args[0]).includes(
                    "Successfully exposed electronAPI to main world"
                )
            )
        ).toBe(true);
        expect(
            logs.some((args) => String(args[0]).includes("API Structure:"))
        ).toBe(true);
        // Development tools exposed and final init log
        expect(
            logs.some((args) =>
                String(args[0]).includes("Development tools exposed")
            )
        ).toBe(true);
        expect(
            logs.some((args) =>
                String(args[0]).includes(
                    "Preload script initialized successfully"
                )
            )
        ).toBe(true);

        // Simulate beforeExit to hit cleanup log
        const beforeExit = onceCalls.find((c) => c.event === "beforeExit");
        expect(processOnceSpy).toHaveBeenCalledWith(
            "beforeExit",
            expect.any(Function)
        );
        expect(beforeExit).toEqual({
            cb: expect.any(Function),
            event: "beforeExit",
        });
        beforeExit!.cb();
        expect(
            logs.some((args) =>
                String(args[0]).includes("Process exiting, performing cleanup")
            )
        ).toBe(true);

        // Ensure no unexpected errors were logged
        expect(errors.length).toBe(0);

        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });
});
