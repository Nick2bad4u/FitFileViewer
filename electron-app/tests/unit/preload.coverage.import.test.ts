/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("preload.js - import-based coverage", () => {
    let mockIpcRenderer: any;
    let mockContextBridge: any;
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

        const api = mockContextBridge.exposeInMainWorld.mock.calls[0][1];

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
        api.send(123 as any);
        expect(mockIpcRenderer.send).toHaveBeenCalledTimes(
            sendCallsBeforeInvalidChannel
        );
        await expect(api.invoke(123 as any)).rejects.toThrow(
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

        const devTools = mockContextBridge.exposeInMainWorld.mock.calls[1][1];
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
