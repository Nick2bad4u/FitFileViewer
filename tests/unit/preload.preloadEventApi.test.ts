import { describe, expect, it, vi } from "vitest";

import type {
    GenericSendChannel,
    IpcRequestPayload,
    IpcResponsePayload,
    UpdateEventName,
} from "../../electron-app/shared/ipc";
import { createPreloadEventApi } from "../../electron-app/preload/preloadEventApi.js";

interface IpcRendererMock {
    on: ReturnType<
        typeof vi.fn<
            (
                channel: string,
                listener: (event: object, ...args: IpcResponsePayload[]) => void
            ) => void
        >
    >;
    send: ReturnType<
        typeof vi.fn<(channel: string, ...args: IpcRequestPayload[]) => void>
    >;
}

function createIpcMock(): IpcRendererMock {
    return {
        on: vi.fn<
            (
                channel: string,
                listener: (event: object, ...args: IpcResponsePayload[]) => void
            ) => void
        >(),
        send: vi.fn<(channel: string, ...args: IpcRequestPayload[]) => void>(),
    };
}

function createApi({
    shouldEnforceGenericIpcAllowlist = true,
}: {
    shouldEnforceGenericIpcAllowlist?: boolean;
} = {}) {
    const ipcMock = createIpcMock();
    const preloadLog =
        vi.fn<
            (
                level: "error" | "info" | "warn",
                message: string,
                ...details: unknown[]
            ) => void
        >();
    const removeIpcListener =
        vi.fn<
            (
                channel: string,
                handler: (event: object, ...args: IpcResponsePayload[]) => void
            ) => void
        >();

    return {
        api: createPreloadEventApi({
            fitFileLoadedChannel: "fit-file-loaded",
            ipcRenderer: ipcMock,
            isAllowedUpdateEventName: (
                eventName: unknown
            ): eventName is UpdateEventName => eventName === "update-checking",
            preloadLog,
            removeIpcListener,
            shouldEnforceGenericIpcAllowlist,
            validateCallback: (
                callback: unknown
            ): callback is (...args: unknown[]) => unknown =>
                typeof callback === "function",
            validateChannelName: (value: unknown): value is string =>
                typeof value === "string" && value.length > 0,
        }),
        ipcMock,
        preloadLog,
        removeIpcListener,
    };
}

describe("preload event API", () => {
    it("exposes only FIT notification and update event methods", () => {
        expect.assertions(1);

        const { api } = createApi();

        expect(Object.keys(api).sort()).toStrictEqual([
            "notifyFitFileLoaded",
            "onUpdateEvent",
        ]);
    });

    it("blocks non-allowlisted update events while enforcement is enabled", () => {
        expect.assertions(4);

        const { api, ipcMock, preloadLog } = createApi();

        const unsubscribe = api.onUpdateEvent("update-downloaded", vi.fn());

        expect(unsubscribe).toBeTypeOf("function");
        expect(unsubscribe()).toBeUndefined();
        expect(ipcMock.on).not.toHaveBeenCalled();
        expect(preloadLog.mock.calls).toStrictEqual([
            [
                "warn",
                "[preload.js] Blocked onUpdateEvent() subscription to non-allowlisted event: update-downloaded",
            ],
        ]);
    });

    it("normalizes FIT file load notifications", () => {
        expect.assertions(2);

        const { api, ipcMock, preloadLog } = createApi();
        const loggedEntries: Array<{
            details: unknown[];
            level: string;
            message: string;
        }> = [];
        const sentMessages: Array<[string, ...IpcRequestPayload[]]> = [];
        ipcMock.send.mockImplementation((channel, ...args) => {
            sentMessages.push([channel, ...args]);
        });
        preloadLog.mockImplementation((level, message, ...details) => {
            loggedEntries.push({ details, level, message });
        });

        api.notifyFitFileLoaded(" activity.fit ");
        api.notifyFitFileLoaded("");
        api.notifyFitFileLoaded(42 as never);
        api.notifyFitFileLoaded(null);

        expect(sentMessages).toStrictEqual([
            ["fit-file-loaded", " activity.fit "],
            ["fit-file-loaded", null],
            ["fit-file-loaded", null],
        ]);
        expect(loggedEntries).toStrictEqual([
            {
                details: [],
                level: "error",
                message:
                    "[preload.js] notifyFitFileLoaded: filePath must be a string or null",
            },
        ]);
    });

    it("wraps update event callbacks and removes listeners through the shared remover", () => {
        expect.assertions(7);

        const { api, ipcMock, preloadLog, removeIpcListener } = createApi();
        const callback = vi.fn<(...args: IpcResponsePayload[]) => void>();
        const unsubscribe = api.onUpdateEvent(
            "update-checking",
            callback
        ) as () => void;
        const [registeredChannel, listener] = ipcMock.on.mock.calls[0] as [
            string,
            (event: object, ...args: IpcResponsePayload[]) => void,
        ];
        const event = { id: "evt" };

        expect(ipcMock.on).toHaveBeenCalledOnce();
        expect(registeredChannel).toBe("update-checking");
        expect(listener).not.toBe(callback);

        listener(event, "payload");
        unsubscribe();

        expect(callback).toHaveBeenCalledWith("payload");
        expect(callback).not.toHaveBeenCalledWith(event, "payload");
        expect(removeIpcListener).toHaveBeenCalledWith(
            "update-checking",
            listener
        );
        expect(preloadLog).not.toHaveBeenCalled();
    });

    it("returns a noop unsubscribe when update IPC is unavailable", () => {
        expect.assertions(3);

        const preloadLog =
            vi.fn<
                (
                    level: "error" | "info" | "warn",
                    message: string,
                    ...details: unknown[]
                ) => void
            >();
        const api = createPreloadEventApi({
            fitFileLoadedChannel: "fit-file-loaded",
            ipcRenderer: null,
            isAllowedUpdateEventName: (
                eventName: unknown
            ): eventName is UpdateEventName => eventName === "update-checking",
            preloadLog,
            removeIpcListener: vi.fn(),
            shouldEnforceGenericIpcAllowlist: false,
            validateCallback: (
                callback: unknown
            ): callback is (...args: unknown[]) => unknown =>
                typeof callback === "function",
            validateChannelName: (value: unknown): value is string =>
                typeof value === "string" && value.length > 0,
        });

        const unsubscribe = api.onUpdateEvent("update-checking", vi.fn());

        expect(unsubscribe).toBeTypeOf("function");
        expect(unsubscribe()).toBeUndefined();
        expect(
            preloadLog.mock.calls.map(
                ([
                    level,
                    message,
                    error,
                ]) => ({
                    errorMessage:
                        error instanceof Error ? error.message : undefined,
                    level,
                    message,
                })
            )
        ).toStrictEqual([
            {
                errorMessage: "ipcRenderer.on unavailable",
                level: "error",
                message:
                    "[preload.js] Error setting up onUpdateEvent(update-checking):",
            },
        ]);
    });
});
