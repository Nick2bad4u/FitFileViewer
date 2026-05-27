import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type BeforeExitListener = () => void;

interface ElectronPreloadMock {
    contextBridge: {
        exposeInMainWorld: ReturnType<
            typeof vi.fn<(name: string, api: unknown) => void>
        >;
    };
    ipcRenderer: {
        invoke: ReturnType<typeof vi.fn<() => Promise<string>>>;
        on: ReturnType<typeof vi.fn>;
        removeAllListeners: ReturnType<typeof vi.fn>;
        send: ReturnType<typeof vi.fn>;
    };
}

interface PreloadMinimalProcess {
    env: { NODE_ENV: string };
    listeners: ReturnType<
        typeof vi.fn<(eventName: string) => BeforeExitListener[]>
    >;
    once: ReturnType<
        typeof vi.fn<
            (
                eventName: string,
                listener: BeforeExitListener
            ) => PreloadMinimalProcess
        >
    >;
    removeListener: ReturnType<
        typeof vi.fn<
            (
                eventName: string,
                listener: BeforeExitListener
            ) => PreloadMinimalProcess
        >
    >;
}

interface PreloadMinimalChannelInfo {
    channels: Record<string, string>;
    events: Record<string, string>;
    totalChannels: number;
    totalEvents: number;
}

interface PreloadMinimalElectronAPI {
    getChannelInfo: () => PreloadMinimalChannelInfo;
    openFile: () => Promise<string>;
    readFile: (filePath: string) => Promise<string>;
    validateAPI: () => boolean;
}

describe("preload.js - Basic API Validation", () => {
    let electronMock: ElectronPreloadMock;
    let exposedGlobals: Map<string, unknown>;
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
    let beforeExitListeners: BeforeExitListener[];
    let mockProcess: PreloadMinimalProcess;

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
        mockProcess = {
            env: { NODE_ENV: "development" },
            listeners: vi.fn((eventName: string) =>
                eventName === "beforeExit" ? beforeExitListeners : []
            ),
            once: vi.fn((eventName: string, listener: BeforeExitListener) => {
                if (eventName === "beforeExit") {
                    beforeExitListeners.push(listener);
                }
                return mockProcess;
            }),
            removeListener: vi.fn(
                (eventName: string, listener: BeforeExitListener) => {
                    if (eventName === "beforeExit") {
                        beforeExitListeners = beforeExitListeners.filter(
                            (currentListener) => currentListener !== listener
                        );
                    }
                    return mockProcess;
                }
            ),
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

    it("should expose a validated electron API", async () => {
        const electronApiExposure =
            electronMock.contextBridge.exposeInMainWorld.mock.calls.find(
                ([name]) => name === "electronAPI"
            );

        expect(electronApiExposure).toEqual([
            "electronAPI",
            expect.objectContaining({
                getChannelInfo: expect.any(Function),
                openFile: expect.any(Function),
                readFile: expect.any(Function),
                validateAPI: expect.any(Function),
            }),
        ]);

        const electronAPI =
                electronApiExposure?.[1] as PreloadMinimalElectronAPI,
            channelInfo = electronAPI.getChannelInfo();

        expect(exposedGlobals.get("electronAPI")).toBe(electronAPI);
        expect(electronAPI.validateAPI()).toBe(true);
        expect(channelInfo.channels).toMatchObject({
            APP_VERSION: "getAppVersion",
            DIALOG_OPEN_FILE: "dialog:openFile",
            FILE_READ: "file:read",
        });
        expect(channelInfo.events).toMatchObject({
            MENU_OPEN_FILE: "menu-open-file",
            THEME_CHANGED: "theme-changed",
        });
        expect(channelInfo.totalChannels).toBe(
            Object.keys(channelInfo.channels).length
        );
        expect(channelInfo.totalEvents).toBe(
            Object.keys(channelInfo.events).length
        );

        await expect(electronAPI.openFile()).resolves.toBe("mock-result");
        await expect(electronAPI.readFile("activity.fit")).resolves.toBe(
            "mock-result"
        );
        expect(electronMock.ipcRenderer.invoke).toHaveBeenNthCalledWith(
            1,
            "dialog:openFile"
        );
        expect(electronMock.ipcRenderer.invoke).toHaveBeenNthCalledWith(
            2,
            "file:read",
            "activity.fit"
        );
    });

    it("should expose development tools API when validation passes", () => {
        const electronAPI = exposedGlobals.get("electronAPI") as Record<
                string,
                unknown
            >,
            developmentToolsGlobalName = "devTools",
            devTools = exposedGlobals.get(developmentToolsGlobalName) as Record<
                string,
                unknown
            >,
            expectedApiMethods = Object.keys(electronAPI),
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
        expect(preloadInfo.apiMethods).toEqual(expectedApiMethods);
        expect(preloadInfo.apiMethods).toContain("validateAPI");
        expect(preloadInfo.apiMethods).toContain("getChannelInfo");
        expect(preloadInfo.apiMethods).toContain("openFile");
        expect(preloadInfo.apiMethods).toContain("readFile");
    });

    it("should register beforeExit handler", () => {
        // Check if process.once was called with beforeExit
        const currentProcess =
            globalThis.process as unknown as PreloadMinimalProcess;

        expect(currentProcess.once).toHaveBeenCalledWith(
            "beforeExit",
            expect.any(Function)
        );
        expect(beforeExitListeners).toHaveLength(1);
        expect(beforeExitListeners[0]).toBeTypeOf("function");
    });

    it("should log initialization message", () => {
        const logMessages = consoleLogSpy.mock.calls
            .map((call: unknown[]) => call[0])
            .filter(
                (message): message is string => typeof message === "string"
            );

        expect(logMessages).toEqual(
            expect.arrayContaining([
                expect.stringMatching(
                    /\[preload\.js\] (Preload script initialized|Successfully exposed)/u
                ),
            ])
        );
    });
});
