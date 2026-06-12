import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type BeforeExitCallback = () => void;
type ExposeInMainWorld = (name: string, api: unknown) => void;
type IpcInvoke = (...args: unknown[]) => Promise<string>;
type IpcListener = (...args: unknown[]) => void;

interface ExposedElectronApi {
    getAppVersion: () => Promise<string>;
    validateAPI: () => boolean;
}

interface ExposedDevTools {
    getPreloadInfo: () => {
        apiMethods: string[];
        constants: {
            CHANNELS: Record<string, string>;
            EVENTS: Record<string, string>;
        };
        timestamp: string;
        version: string;
    };
    logAPIState: () => void;
    testIPC: () => Promise<boolean>;
}

interface ElectronEvalMock {
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

const devToolsApiName = ["dev", "Tools"].join("");

async function startPreloadWithElectronBridge(
    electronBridge: ElectronEvalMock
): Promise<void> {
    const { startPreloadEntrypoint } =
        await import("../../electron-app/preload/preloadEntrypoint.js");

    startPreloadEntrypoint({
        consoleRef: console,
        electronBridgeOverride: electronBridge,
        globalScope: globalThis,
        processRef: process,
    });
}

describe("preload.js - Script Evaluation Test", () => {
    let electronMock: ElectronEvalMock;
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
    let processOnceSpy: ReturnType<typeof vi.spyOn>;
    const originalNodeEnv = process.env.NODE_ENV;
    const onceCalls: Array<{ cb: BeforeExitCallback; event: string }> = [];

    beforeEach(async () => {
        // Reset everything completely
        vi.resetAllMocks();
        vi.resetModules();
        vi.clearAllMocks();
        onceCalls.length = 0;

        // Create electron mock
        electronMock = {
            ipcRenderer: {
                invoke: vi.fn<IpcInvoke>().mockResolvedValue("mock-result"),
                send: vi.fn<IpcListener>(),
                on: vi.fn<IpcListener>(),
                removeAllListeners: vi.fn<IpcListener>(),
            },
            contextBridge: {
                exposeInMainWorld: vi.fn<ExposeInMainWorld>(),
            },
        };

        consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        processOnceSpy = vi
            .spyOn(process, "once")
            .mockImplementation((event: string, cb: BeforeExitCallback) => {
                onceCalls.push({ cb, event });
                return process;
            });

        process.env.NODE_ENV = "development";
        await startPreloadWithElectronBridge(electronMock);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
        process.env.NODE_ENV = originalNodeEnv;
    });

    it("should execute the preload script and expose APIs", async () => {
        expect.assertions(9);
        // Check if contextBridge.exposeInMainWorld was called
        const exposeCalls =
            electronMock.contextBridge.exposeInMainWorld.mock.calls;
        const electronAPI = exposeCalls[0]?.[1] as ExposedElectronApi;
        const devTools = exposeCalls[1]?.[1] as ExposedDevTools;

        expect(exposeCalls.map((call: unknown[]) => call[0])).toStrictEqual([
            "electronAPI",
            devToolsApiName,
        ]);
        expect(
            Object.fromEntries(
                ["getAppVersion", "validateAPI"].map((methodName) => [
                    methodName,
                    Object.hasOwn(electronAPI, methodName),
                ])
            )
        ).toStrictEqual({
            getAppVersion: true,
            validateAPI: true,
        });
        expect(electronAPI.validateAPI()).toBe(true);
        expect(
            Object.fromEntries(
                [
                    "getPreloadInfo",
                    "logAPIState",
                    "testIPC",
                ].map((methodName) => [
                    methodName,
                    Object.hasOwn(devTools, methodName),
                ])
            )
        ).toStrictEqual({
            getPreloadInfo: true,
            logAPIState: true,
            testIPC: true,
        });
        const preloadInfo = devTools.getPreloadInfo();
        expect({
            apiMethods: preloadInfo.apiMethods,
            appVersionChannel: preloadInfo.constants.CHANNELS.APP_VERSION,
            menuOpenFileEvent: preloadInfo.constants.EVENTS.MENU_OPEN_FILE,
            timestampType: typeof preloadInfo.timestamp,
            version: preloadInfo.version,
        }).toStrictEqual({
            apiMethods: Object.keys(electronAPI),
            appVersionChannel: "getAppVersion",
            menuOpenFileEvent: "menu-open-file",
            timestampType: "string",
            version: "1.0.0",
        });
        devTools.logAPIState();
        const apiStateLog = consoleLogSpy.mock.calls.find(
            ([message]) => message === "[preload.js] Current API State:"
        );
        const apiStatePayload = apiStateLog?.[1] as
            | Record<string, unknown>
            | undefined;
        expect({
            electronAPI: apiStatePayload?.electronAPI,
            methodCount: apiStatePayload?.methodCount,
            message: apiStateLog?.[0],
        }).toStrictEqual({
            electronAPI: "object",
            methodCount: Object.keys(electronAPI).length,
            message: "[preload.js] Current API State:",
        });
        await expect(devTools.testIPC()).resolves.toBe(true);
        expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith(
            "getAppVersion"
        );
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("should register process beforeExit handler", () => {
        expect.assertions(3);
        const beforeExit = onceCalls.find(
            (call) => call.event === "beforeExit"
        );
        expect(processOnceSpy.mock.calls).toStrictEqual([
            ["beforeExit", beforeExit?.cb],
        ]);
        expect(beforeExit).toStrictEqual({
            cb: beforeExit?.cb,
            event: "beforeExit",
        });

        beforeExit!.cb();

        expect(consoleLogSpy).toHaveBeenCalledWith(
            "[preload.js] Process exiting, performing cleanup..."
        );
    });

    it("should log initialization messages", () => {
        expect.assertions(1);
        const logMessages = consoleLogSpy.mock.calls
            .map((call: unknown[]) => call[0])
            .filter(
                (message): message is string => typeof message === "string"
            );

        expect({
            hasInitializedLog: logMessages.some((message) =>
                message.includes("Preload script initialized successfully")
            ),
            hasPreloadLog: logMessages.some((message) =>
                message.includes("[preload.js]")
            ),
        }).toStrictEqual({
            hasInitializedLog: true,
            hasPreloadLog: true,
        });
    });
});
