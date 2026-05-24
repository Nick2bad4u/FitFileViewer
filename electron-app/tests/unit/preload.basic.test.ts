/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("preload.basic", () => {
    let contextBridge: { exposeInMainWorld: ReturnType<typeof vi.fn> };
    let ipcRenderer: {
        invoke: ReturnType<typeof vi.fn>;
        on: ReturnType<typeof vi.fn>;
        send: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        vi.resetModules();
        ipcRenderer = {
            invoke: vi.fn().mockResolvedValue("mock-result"),
            on: vi.fn(),
            send: vi.fn(),
        };
        contextBridge = {
            exposeInMainWorld: vi.fn(),
        };
        Reflect.set(globalThis, "__electronHoistedMock", {
            contextBridge,
            ipcRenderer,
        });
        vi.spyOn(console, "log").mockImplementation(() => undefined);
        vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
        Reflect.deleteProperty(globalThis, "__electronHoistedMock");
    });

    it("exposes electronAPI and rejects invalid invoke channels before IPC", async () => {
        await import("../../preload.js");

        expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith(
            "electronAPI",
            expect.objectContaining({
                invoke: expect.any(Function),
                openFile: expect.any(Function),
                validateAPI: expect.any(Function),
            })
        );

        const api = contextBridge.exposeInMainWorld.mock.calls[0]?.[1];
        expect(api.validateAPI()).toBe(true);

        await expect(api.invoke(null)).rejects.toThrow(
            "Invalid channel for invoke"
        );
        expect(ipcRenderer.invoke).not.toHaveBeenCalled();
    });
});
