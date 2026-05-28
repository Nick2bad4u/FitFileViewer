import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type BeforeExitCallback = () => void;

interface ElectronEvalMock {
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
                invoke: vi.fn().mockResolvedValue("mock-result"),
                send: vi.fn(),
                on: vi.fn(),
                removeAllListeners: vi.fn(),
            },
            contextBridge: {
                exposeInMainWorld: vi.fn(),
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

    it("should execute the preload script and expose APIs", () => {
        // Check if contextBridge.exposeInMainWorld was called
        const exposeCalls =
            electronMock.contextBridge.exposeInMainWorld.mock.calls;
        expect(exposeCalls.map((call: unknown[]) => call[0])).toEqual([
            "electronAPI",
            "devTools",
        ]);
        expect(exposeCalls[0]?.[1]).toEqual(
            expect.objectContaining({
                getAppVersion: expect.any(Function),
                invoke: expect.any(Function),
                validateAPI: expect.any(Function),
            })
        );
        expect(exposeCalls[1]?.[1]).toEqual(
            expect.objectContaining({
                getPreloadInfo: expect.any(Function),
                logAPIState: expect.any(Function),
                testIPC: expect.any(Function),
            })
        );
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("should register process beforeExit handler", () => {
        expect(processOnceSpy).toHaveBeenCalledWith(
            "beforeExit",
            expect.any(Function)
        );
        const beforeExit = onceCalls.find(
            (call) => call.event === "beforeExit"
        );
        expect(beforeExit).toEqual({
            cb: expect.any(Function),
            event: "beforeExit",
        });

        beforeExit!.cb();

        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining("Process exiting, performing cleanup...")
        );
    });

    it("should log initialization messages", () => {
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
