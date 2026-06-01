import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type BeforeExitCallback = () => void;
type ExposeInMainWorld = (name: string, api: unknown) => void;
type IpcInvoke = (...args: unknown[]) => Promise<string>;
type IpcListener = (...args: unknown[]) => void;

interface ExposedElectronApi {
    getAppVersion: () => Promise<string>;
    invoke: (...args: unknown[]) => Promise<string>;
    validateAPI: () => boolean;
}

interface ExposedDevTools {
    getPreloadInfo: () => {
        apiMethods: string[];
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
        Reflect.deleteProperty(globalThis, "__electronHoistedMock");

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
        Reflect.set(globalThis, "__electronHoistedMock", electronMock);
        await import("../../electron-app/preload.js");
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
        Reflect.deleteProperty(globalThis, "__electronHoistedMock");
        process.env.NODE_ENV = originalNodeEnv;
    });

    it("should execute the preload script and expose APIs", async () => {
        expect.assertions(9);
        // Check if contextBridge.exposeInMainWorld was called
        const exposeCalls =
            electronMock.contextBridge.exposeInMainWorld.mock.calls;
        const electronAPI = exposeCalls[0]?.[1] as ExposedElectronApi;
        const devTools = exposeCalls[1]?.[1] as ExposedDevTools;

        expect(exposeCalls.map((call: unknown[]) => call[0])).toEqual([
            "electronAPI",
            devToolsApiName,
        ]);
        expect(
            Object.fromEntries(
                [
                    "getAppVersion",
                    "invoke",
                    "validateAPI",
                ].map((methodName) => [
                    methodName,
                    Object.hasOwn(electronAPI, methodName),
                ])
            )
        ).toEqual({
            getAppVersion: true,
            invoke: true,
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
        ).toEqual({
            getPreloadInfo: true,
            logAPIState: true,
            testIPC: true,
        });
        expect(devTools.getPreloadInfo()).toMatchObject({
            apiMethods: Object.keys(electronAPI),
            version: "1.0.0",
        });
        devTools.logAPIState();
        expect(consoleLogSpy).toHaveBeenCalledWith(
            "[preload.js] Current API State:",
            expect.objectContaining({
                electronAPI: "object",
                methodCount: Object.keys(electronAPI).length,
            })
        );
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
        expect(processOnceSpy.mock.calls).toContainEqual([
            "beforeExit",
            beforeExit?.cb,
        ]);
        expect(beforeExit).toEqual({
            cb: beforeExit?.cb,
            event: "beforeExit",
        });

        beforeExit!.cb();

        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining("Process exiting, performing cleanup...")
        );
    });

    it("should log initialization messages", () => {
        expect.assertions(1);
        const logMessages = consoleLogSpy.mock.calls
            .map((call: unknown[]) => call[0])
            .filter(
                (message): message is string => typeof message === "string"
            );

        expect(logMessages).toEqual(
            expect.arrayContaining([
                expect.stringContaining("[preload.js]"),
                expect.stringContaining(
                    "Preload script initialized successfully"
                ),
            ])
        );
    });
});
