/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest";

interface MockContextBridge {
    exposeInMainWorld: Mock<(apiKey: string, api: unknown) => void>;
}

interface MockIpcRenderer {
    invoke: Mock<(channel: string, ...args: unknown[]) => Promise<unknown>>;
    on: Mock<(channel: string, listener: (...args: unknown[]) => void) => void>;
    send: Mock<(channel: string, ...args: unknown[]) => void>;
}

interface TestElectronApi {
    getChannelInfo: () => {
        channels: Record<string, string>;
        events: Record<string, string>;
        totalChannels: number;
        totalEvents: number;
    };
    invoke: (channel: unknown, ...args: unknown[]) => Promise<unknown>;
    openFile: () => Promise<unknown>;
    readFile: (filePath: string) => Promise<unknown>;
    send: (channel: unknown, ...args: unknown[]) => void;
    sendThemeChanged: (theme: string) => void;
}

interface TestDevTools {
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

function getExposedApi<T>(
    contextBridge: MockContextBridge,
    callIndex: number
): T {
    const exposedCall = contextBridge.exposeInMainWorld.mock.calls[callIndex];
    expect(exposedCall).toBeDefined();
    return exposedCall[1] as T;
}

describe("preload.js - import-based coverage", () => {
    let mockIpcRenderer: MockIpcRenderer;
    let mockContextBridge: MockContextBridge;
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
        vi.resetModules();
        mockIpcRenderer = {
            invoke: vi.fn().mockResolvedValue("ok"),
            send: vi.fn(),
            on: vi.fn(),
        };
        mockContextBridge = {
            exposeInMainWorld: vi.fn(),
        };

        Reflect.set(globalThis, "__electronHoistedMock", {
            ipcRenderer: mockIpcRenderer,
            contextBridge: mockContextBridge,
        });

        // Silence logs to keep output clean
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
        vi.restoreAllMocks();
        vi.resetModules();
        Reflect.deleteProperty(globalThis, "__electronHoistedMock");
    });

    it("imports preload and exercises API (NODE_ENV=test)", async () => {
        process.env.NODE_ENV = "test";
        await import("../../preload.js");
        expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
            "electronAPI",
            expect.objectContaining({
                getChannelInfo: expect.any(Function),
                invoke: expect.any(Function),
                openFile: expect.any(Function),
                readFile: expect.any(Function),
                send: expect.any(Function),
                sendThemeChanged: expect.any(Function),
            })
        );

        const api = getExposedApi<TestElectronApi>(mockContextBridge, 0);

        // Exercise a few API paths to accrue coverage
        await api.openFile();
        await api.readFile("foo.fit");
        api.sendThemeChanged("dark");
        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("dialog:openFile");
        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
            "file:read",
            "foo.fit"
        );
        expect(mockIpcRenderer.send).toHaveBeenCalledWith(
            "theme-changed",
            "dark"
        );

        // Validation branches: send with invalid channel, invoke with invalid channel
        const sendCallsBeforeInvalidChannel = mockIpcRenderer.send.mock.calls
            .length;
        api.send(123);
        expect(mockIpcRenderer.send).toHaveBeenCalledTimes(
            sendCallsBeforeInvalidChannel
        );
        await expect(api.invoke(123)).rejects.toThrow(
            "Invalid channel for invoke"
        );

        // getChannelInfo should return structure
        const info = api.getChannelInfo();
        expect(info.totalChannels).toBeGreaterThan(0);
        expect(info.totalEvents).toBeGreaterThan(0);
        expect(Object.keys(info.channels)).toHaveLength(info.totalChannels);
        expect(Object.keys(info.events)).toHaveLength(info.totalEvents);
    });

    it("imports preload in development mode without throwing", async () => {
        process.env.NODE_ENV = "development";
        await import("../../preload.js");
        expect(mockContextBridge.exposeInMainWorld).toHaveBeenNthCalledWith(
            1,
            "electronAPI",
            expect.objectContaining({
                openFile: expect.any(Function),
                validateAPI: expect.any(Function),
            })
        );
        expect(mockContextBridge.exposeInMainWorld).toHaveBeenNthCalledWith(
            2,
            "devTools",
            expect.objectContaining({
                getPreloadInfo: expect.any(Function),
                logAPIState: expect.any(Function),
                testIPC: expect.any(Function),
            })
        );

        const devTools = getExposedApi<TestDevTools>(mockContextBridge, 1);
        const preloadInfo = devTools.getPreloadInfo();
        expect(preloadInfo).toEqual(
            expect.objectContaining({
                apiMethods: expect.arrayContaining([
                    "getChannelInfo",
                    "openFile",
                    "validateAPI",
                ]),
                constants: expect.objectContaining({
                    CHANNELS: expect.objectContaining({
                        DIALOG_OPEN_FILE: "dialog:openFile",
                    }),
                    EVENTS: expect.objectContaining({
                        THEME_CHANGED: "theme-changed",
                    }),
                }),
                timestamp: expect.any(String),
                version: "1.0.0",
            })
        );
    });
});
