import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("preload.js - Basic API Validation", () => {
    let electronMock: any;
    let exposedGlobals: Map<string, unknown>;
    let consoleLogSpy: any;
    let consoleErrorSpy: any;
    let beforeExitListeners: Function[];

    beforeEach(async () => {
        // Reset everything completely
        vi.resetAllMocks();
        vi.resetModules();
        vi.clearAllMocks();

        exposedGlobals = new Map<string, unknown>();
        beforeExitListeners = [];

        // Create electron mock
        electronMock = {
            ipcRenderer: {
                invoke: vi.fn().mockResolvedValue("mock-result"),
                send: vi.fn(),
                on: vi.fn(),
                removeAllListeners: vi.fn(),
            },
            contextBridge: {
                exposeInMainWorld: vi.fn((name: string, api: unknown) => {
                    exposedGlobals.set(name, api);
                }),
            },
        };

        // Mock console methods
        consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        // Mock process object
        const mockProcess: any = {
            env: { NODE_ENV: "development" },
            listeners: vi.fn((eventName: string) =>
                eventName === "beforeExit" ? beforeExitListeners : []
            ),
            once: vi.fn((eventName: string, listener: Function) => {
                if (eventName === "beforeExit") {
                    beforeExitListeners.push(listener);
                }
                return mockProcess;
            }),
            removeListener: vi.fn((eventName: string, listener: Function) => {
                if (eventName === "beforeExit") {
                    beforeExitListeners = beforeExitListeners.filter(
                        (currentListener) => currentListener !== listener
                    );
                }
                return mockProcess;
            }),
        };
        vi.stubGlobal("process", mockProcess);

        vi.stubGlobal("__electronHoistedMock", electronMock);
        vi.doMock("electron", () => electronMock);

        console.log("[TEST] About to import preload script...");

        await import("../../preload.js");

        console.log("[TEST] Preload script imported successfully");
        console.log(
            "[TEST] contextBridge.exposeInMainWorld was called",
            electronMock.contextBridge.exposeInMainWorld.mock.calls.length,
            "times"
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should expose a validated electron API", () => {
        const electronAPI = exposedGlobals.get("electronAPI") as Record<
            string,
            unknown
        >;

        expect(exposedGlobals.has("electronAPI")).toBe(true);
        expect(typeof electronAPI.validateAPI).toBe("function");
        expect(typeof electronAPI.getChannelInfo).toBe("function");
        expect(typeof electronAPI.openFile).toBe("function");
        expect(typeof electronAPI.readFile).toBe("function");
        expect((electronAPI.validateAPI as () => boolean)()).toBe(true);
        expect((electronAPI.validateAPI as () => boolean)()).not.toBe(false);
    });

    it("should expose development tools API when validation passes", () => {
        const developmentToolsGlobalName = "devTools",
            devTools = exposedGlobals.get(developmentToolsGlobalName) as Record<
                string,
                unknown
            >,
            preloadInfo = (
                devTools.getPreloadInfo as () => {
                    apiMethods: string[];
                    version: string;
                }
            )();

        expect([...exposedGlobals.keys()]).toEqual([
            "electronAPI",
            developmentToolsGlobalName,
        ]);
        expect(typeof devTools.getPreloadInfo).toBe("function");
        expect(preloadInfo.version).toBe("1.0.0");
        expect(preloadInfo.apiMethods).toEqual(
            expect.arrayContaining([
                "validateAPI",
                "getChannelInfo",
                "openFile",
                "readFile",
            ])
        );
        expect(preloadInfo.apiMethods).not.toHaveLength(0);
    });

    it("should register beforeExit handler", () => {
        // Check if process.once was called with beforeExit
        const mockProcess = globalThis.process as any;

        expect(mockProcess.once).toHaveBeenCalledWith(
            "beforeExit",
            expect.any(Function)
        );
        expect(beforeExitListeners).toHaveLength(1);
        expect(beforeExitListeners[0]).toBeTypeOf("function");
    });

    it("should log initialization message", () => {
        // Check for any initialization logs
        const hasInitLog = consoleLogSpy.mock.calls.some(
            (call: any) =>
                call[0] &&
                (call[0].includes("[preload.js] Preload script initialized") ||
                    call[0].includes("[preload.js] Successfully exposed"))
        );

        expect(hasInitLog).toBe(true);
        expect(hasInitLog).not.toBe(false);
    });
});
