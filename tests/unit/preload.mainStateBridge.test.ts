import { describe, expect, it, vi } from "vitest";

import type { MainStateChange } from "../../electron-app/shared/ipc";
import type { IpcEventListener } from "../../electron-app/preload/preloadModuleTypes";
import { createMainStateBridge } from "../../electron-app/preload/mainStateBridge.js";

interface IpcRendererMock {
    invoke: ReturnType<
        typeof vi.fn<(channel: string, ...args: unknown[]) => Promise<unknown>>
    >;
    on: ReturnType<
        typeof vi.fn<(channel: string, listener: IpcEventListener) => void>
    >;
}
type PreloadLogMock = ReturnType<
    typeof vi.fn<
        (
            level: "error" | "info" | "warn",
            message: string,
            ...details: unknown[]
        ) => void
    >
>;

type RemoveIpcListenerMock = ReturnType<
    typeof vi.fn<(channel: string, listener: IpcEventListener) => void>
>;

function createBridge() {
    const ipcRenderer: IpcRendererMock = {
        invoke: vi.fn<
            (channel: string, ...args: unknown[]) => Promise<unknown>
        >(),
        on: vi.fn<(channel: string, listener: IpcEventListener) => void>(),
    };
    const preloadLog: PreloadLogMock =
        vi.fn<
            (
                level: "error" | "info" | "warn",
                message: string,
                ...details: unknown[]
            ) => void
        >();
    const removeIpcListener: RemoveIpcListenerMock =
        vi.fn<(channel: string, listener: IpcEventListener) => void>();

    return {
        bridge: createMainStateBridge({
            ipcRenderer,
            preloadLog,
            removeIpcListener,
        }),
        ipcRenderer,
        preloadLog,
        removeIpcListener,
    };
}

function getMainStateDispatcher(ipcRenderer: IpcRendererMock) {
    const dispatcher = ipcRenderer.on.mock.calls.find(
        ([channel]) => channel === "main-state-change"
    )?.[1];

    if (typeof dispatcher !== "function") {
        throw new TypeError("Expected main-state-change dispatcher");
    }

    return dispatcher;
}

describe("preload main-state bridge", () => {
    it("dispatches accepted main-state subscriptions", async () => {
        expect.assertions(4);

        const { bridge, ipcRenderer } = createBridge();
        const callback = vi.fn<(change: MainStateChange) => void>();
        ipcRenderer.invoke.mockResolvedValueOnce(true);

        await expect(
            bridge.listenToMainState("loadedFitFilePath", callback)
        ).resolves.toBe(true);
        getMainStateDispatcher(ipcRenderer)(
            {},
            {
                path: "loadedFitFilePath",
                value: "ride.fit",
            }
        );

        expect(callback).toHaveBeenCalledWith({
            path: "loadedFitFilePath",
            value: "ride.fit",
        });
        expect(ipcRenderer.invoke).toHaveBeenCalledWith(
            "main-state:listen",
            "loadedFitFilePath"
        );
        expect(ipcRenderer.on).toHaveBeenCalledTimes(1);
    });

    it("ignores malformed main-state change payloads", async () => {
        expect.assertions(2);

        const { bridge, ipcRenderer } = createBridge();
        const callback = vi.fn<(change: MainStateChange) => void>();
        ipcRenderer.invoke.mockResolvedValueOnce(true);

        await expect(
            bridge.listenToMainState("loadedFitFilePath", callback)
        ).resolves.toBe(true);
        getMainStateDispatcher(ipcRenderer)(
            {},
            {
                path: "loadedFitFilePath",
            }
        );

        expect(callback).not.toHaveBeenCalled();
    });

    it("does not retain callbacks when main rejects a subscription", async () => {
        expect.assertions(4);

        const { bridge, ipcRenderer } = createBridge();
        const callback = vi.fn<(change: MainStateChange) => void>();
        ipcRenderer.invoke.mockResolvedValueOnce(false);

        await expect(
            bridge.listenToMainState("gyazoServerPort", callback)
        ).resolves.toBe(false);

        expect(callback).not.toHaveBeenCalled();
        expect(ipcRenderer.on).not.toHaveBeenCalled();
        await expect(
            bridge.unlistenFromMainState("gyazoServerPort", callback)
        ).resolves.toBe(false);
    });

    it("keeps the local subscription when main rejects unlisten", async () => {
        expect.assertions(5);

        const { bridge, ipcRenderer, removeIpcListener } = createBridge();
        const callback = vi.fn<(change: MainStateChange) => void>();
        ipcRenderer.invoke
            .mockResolvedValueOnce(true)
            .mockResolvedValueOnce(false);

        await expect(
            bridge.listenToMainState("loadedFitFilePath", callback)
        ).resolves.toBe(true);
        await expect(
            bridge.unlistenFromMainState("loadedFitFilePath", callback)
        ).resolves.toBe(false);

        getMainStateDispatcher(ipcRenderer)(
            {},
            {
                path: "loadedFitFilePath",
                value: "still-listening.fit",
            }
        );

        expect(callback).toHaveBeenCalledWith({
            path: "loadedFitFilePath",
            value: "still-listening.fit",
        });
        expect(removeIpcListener).not.toHaveBeenCalled();
        expect(ipcRenderer.invoke.mock.calls).toStrictEqual([
            ["main-state:listen", "loadedFitFilePath"],
            ["main-state:unlisten", "loadedFitFilePath"],
        ]);
    });
});
