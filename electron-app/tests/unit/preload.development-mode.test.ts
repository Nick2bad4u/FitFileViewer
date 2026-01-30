import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";

describe("preload.js - Development mode coverage", () => {
    let preloadCode: string;
    let originalElectronAPI: any;
    let originalDevTools: any;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
        preloadCode = fs.readFileSync(
            path.resolve(__dirname, "../../preload.js"),
            "utf-8"
        );
        originalElectronAPI = (globalThis as any).electronAPI;
        originalDevTools = (globalThis as any).devTools;
        delete (globalThis as any).electronAPI;
        delete (globalThis as any).devTools;
    });

    afterEach(() => {
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
        const mockProcess = {
            env: { NODE_ENV: "development" },
            once: vi.fn((event: string, cb: Function) => {
                onceCalls.push({ event, cb });
            }),
        } as any;

        const mockRequire = vi.fn((mod: string) => {
            if (mod === "electron")
                return { ipcRenderer, contextBridge } as any;
            throw new Error(`Unknown module: ${mod}`);
        });

        const runner = new Function(
            "require",
            "console",
            "process",
            preloadCode
        );
        runner(mockRequire as any, console, mockProcess as any);

        // electronAPI should be exposed
        const api = (globalThis as any).electronAPI;
        expect(api).toBeDefined();
        expect(typeof api.getAppVersion).toBe("function");

        // devTools should be exposed in development
        const devTools = (globalThis as any).devTools;
        expect(devTools).toBeDefined();
        expect(typeof devTools.getPreloadInfo).toBe("function");
        expect(typeof devTools.logAPIState).toBe("function");
        expect(typeof devTools.testIPC).toBe("function");

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
        expect(beforeExit).toBeDefined();
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
