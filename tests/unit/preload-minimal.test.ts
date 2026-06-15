import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type BeforeExitListener = () => void;
type ExposeInMainWorld = (name: string, api: unknown) => void;
type IpcInvoke = (...args: unknown[]) => Promise<string>;
type IpcListener = (...args: unknown[]) => void;
type ProcessListeners = (eventName: string) => BeforeExitListener[];
type ProcessListenerMutation = (
    eventName: string,
    listener: BeforeExitListener
) => PreloadMinimalProcess;

interface ElectronPreloadMock {
    contextBridge: {
        exposeInMainWorld: ReturnType<typeof vi.fn<ExposeInMainWorld>>;
    };
    ipcRenderer: {
        invoke: ReturnType<typeof vi.fn<IpcInvoke>>;
        on: ReturnType<typeof vi.fn<IpcListener>>;
        removeAllListeners: ReturnType<typeof vi.fn<IpcListener>>;
        send: ReturnType<typeof vi.fn<IpcListener>>;
    };
}

interface PreloadMinimalProcess {
    env: { NODE_ENV: string };
    listeners: ReturnType<typeof vi.fn<ProcessListeners>>;
    once: ReturnType<typeof vi.fn<ProcessListenerMutation>>;
    removeListener: ReturnType<typeof vi.fn<ProcessListenerMutation>>;
}

const developmentToolsGlobalName = ["dev", "Tools"].join("");

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

async function startPreloadWithElectronBridge(
    electronBridge: ElectronPreloadMock,
    processRef: NodeJS.Process
): Promise<void> {
    const { startPreloadEntrypoint } =
        await import("../../electron-app/preload/preloadEntrypoint.js");

    startPreloadEntrypoint({
        consoleRef: console,
        electronBridgeOverride: electronBridge,
        globalScope: globalThis,
        processRef,
    });
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
                invoke: vi.fn<IpcInvoke>().mockResolvedValue("mock-result"),
                send: vi.fn<IpcListener>(),
                on: vi.fn<IpcListener>(),
                removeAllListeners: vi.fn<IpcListener>(),
            },
            contextBridge: {
                exposeInMainWorld: vi.fn<ExposeInMainWorld>((name, api) => {
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
            listeners: vi.fn<ProcessListeners>((eventName) =>
                eventName === "beforeExit" ? beforeExitListeners : []
            ),
            once: vi.fn<ProcessListenerMutation>((eventName, listener) => {
                if (eventName === "beforeExit") {
                    beforeExitListeners.push(listener);
                }
                return mockProcess;
            }),
            removeListener: vi.fn<ProcessListenerMutation>(
                (eventName, listener) => {
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

        vi.doMock(import("electron"), () => electronMock);

        await startPreloadWithElectronBridge(
            electronMock,
            mockProcess as unknown as NodeJS.Process
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should expose a validated electron API", async () => {
        expect.assertions(12);
        const electronApiExposure =
            electronMock.contextBridge.exposeInMainWorld.mock.calls.find(
                ([name]) => name === "electronAPI"
            );

        expect(electronApiExposure).toStrictEqual([
            "electronAPI",
            exposedGlobals.get("electronAPI"),
        ]);

        const electronAPI =
                electronApiExposure?.[1] as PreloadMinimalElectronAPI,
            channelInfo = electronAPI.getChannelInfo();

        expect(
            Object.fromEntries(
                [
                    "getChannelInfo",
                    "openFile",
                    "readFile",
                    "validateAPI",
                ].map((methodName) => [
                    methodName,
                    Object.hasOwn(electronAPI, methodName),
                ])
            )
        ).toStrictEqual({
            getChannelInfo: true,
            openFile: true,
            readFile: true,
            validateAPI: true,
        });
        expect({
            exposedElectronAPI: exposedGlobals.get("electronAPI"),
            validationResult: electronAPI.validateAPI(),
        }).toStrictEqual({
            exposedElectronAPI: electronAPI,
            validationResult: true,
        });
        expect(channelInfo.channels).not.toHaveProperty("NOT_A_CHANNEL");
        expect({
            APP_VERSION: channelInfo.channels.APP_VERSION,
            DIALOG_OPEN_FILE: channelInfo.channels.DIALOG_OPEN_FILE,
            FILE_READ: channelInfo.channels.FILE_READ,
        }).toStrictEqual({
            APP_VERSION: "getAppVersion",
            DIALOG_OPEN_FILE: "dialog:openFile",
            FILE_READ: "file:read",
        });
        expect({
            MENU_OPEN_FILE: channelInfo.events.MENU_OPEN_FILE,
            THEME_CHANGED: channelInfo.events.THEME_CHANGED,
        }).toStrictEqual({
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
        await expect(
            electronAPI.readFile("C:/rides/activity.fit")
        ).resolves.toBe("mock-result");
        expect(electronMock.ipcRenderer.invoke).toHaveBeenNthCalledWith(
            1,
            "dialog:openFile"
        );
        expect(electronMock.ipcRenderer.invoke).toHaveBeenNthCalledWith(
            2,
            "file:read",
            "C:/rides/activity.fit"
        );
    });

    it("should expose development tools API when validation passes", () => {
        expect.assertions(4);
        const electronAPI = exposedGlobals.get("electronAPI") as Record<
                string,
                unknown
            >,
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

        expect([...exposedGlobals.keys()]).toStrictEqual([
            "electronAPI",
            developmentToolsGlobalName,
        ]);
        expect(preloadInfo).toMatchObject({
            apiMethods: expectedApiMethods,
            version: "1.0.0",
        });
        expect(preloadInfo.apiMethods).toEqual(
            expect.arrayContaining([
                "getChannelInfo",
                "openFile",
                "readFile",
                "validateAPI",
            ])
        );
        expect(preloadInfo.apiMethods).not.toContain("unsafeEval");
    });

    it("should register beforeExit handler", () => {
        expect.assertions(3);
        // Check if process.once was called with beforeExit
        const currentProcess =
            globalThis.process as unknown as PreloadMinimalProcess;

        expect(currentProcess.once.mock.calls[0]).toStrictEqual([
            "beforeExit",
            beforeExitListeners[0],
        ]);
        expect(beforeExitListeners).toHaveLength(1);
        const registeredBeforeExit = beforeExitListeners[0];
        registeredBeforeExit();
        expect(currentProcess.removeListener).toHaveBeenCalledWith(
            "beforeExit",
            registeredBeforeExit
        );
    });

    it("should log preload initialization messages without test diagnostics", () => {
        expect.assertions(1);
        const logMessages = consoleLogSpy.mock.calls
            .map((call: unknown[]) => call[0])
            .filter(
                (message): message is string => typeof message === "string"
            );
        const requiredLogMessages = [
            "[preload.js] Successfully exposed electronAPI to main world",
            "[preload.js] Preload script initialized successfully",
        ];

        expect({
            requiredLogMessagesPresent: Object.fromEntries(
                requiredLogMessages.map((message) => [
                    message,
                    logMessages.includes(message),
                ])
            ),
            testDiagnostics: logMessages.filter((message) =>
                message.startsWith("[TEST]")
            ),
        }).toStrictEqual({
            requiredLogMessagesPresent: {
                "[preload.js] Preload script initialized successfully": true,
                "[preload.js] Successfully exposed electronAPI to main world": true,
            },
            testDiagnostics: [],
        });
    });
});
