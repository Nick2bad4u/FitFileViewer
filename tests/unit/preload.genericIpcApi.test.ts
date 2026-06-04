import { createRequire } from "node:module";

import { describe, expect, it, vi } from "vitest";

import type {
    GenericInvokeChannel,
    GenericSendChannel,
    IpcRequestPayload,
    IpcResponsePayload,
    RendererIpcEventChannel,
    UpdateEventName,
} from "../../electron-app/shared/ipc";

interface IpcRendererMock {
    invoke: ReturnType<
        typeof vi.fn<
            (channel: string, ...args: IpcRequestPayload[]) => Promise<unknown>
        >
    >;
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

interface GenericIpcApiModule {
    createGenericIpcApi: (options: Record<string, unknown>) => {
        invoke: (
            channel: GenericInvokeChannel,
            ...args: IpcRequestPayload[]
        ) => Promise<unknown>;
        notifyFitFileLoaded: (filePath: null | string) => void;
        onIpc: (
            channel: RendererIpcEventChannel,
            callback: (...args: IpcResponsePayload[]) => unknown
        ) => (() => void) | undefined;
        onUpdateEvent: (
            eventName: UpdateEventName,
            callback: (...args: IpcResponsePayload[]) => unknown
        ) => (() => void) | undefined;
        send: (
            channel: GenericSendChannel,
            ...args: IpcRequestPayload[]
        ) => void;
    };
}

const requireFromTest = createRequire(import.meta.url);
const { createGenericIpcApi } = requireFromTest(
    "../../electron-app/preload/genericIpcApi.js"
) as GenericIpcApiModule;

function createIpcMock(): IpcRendererMock {
    return {
        invoke: vi.fn<
            (channel: string, ...args: IpcRequestPayload[]) => Promise<unknown>
        >(),
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
        api: createGenericIpcApi({
            fitFileLoadedChannel: "fit-file-loaded",
            ipcRenderer: ipcMock,
            isAllowedGenericInvokeChannel: (
                channel: unknown
            ): channel is GenericInvokeChannel => channel === "getAppVersion",
            isAllowedGenericSendChannel: (
                channel: unknown
            ): channel is GenericSendChannel => channel === "theme-changed",
            isAllowedRendererIpcEventChannel: (
                channel: unknown
            ): channel is RendererIpcEventChannel =>
                channel === "show-notification",
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

describe("generic preload IPC API", () => {
    it("invokes allowlisted channels and logs before rethrowing failures", async () => {
        expect.assertions(5);

        const { api, ipcMock, preloadLog } = createApi();
        ipcMock.invoke.mockResolvedValueOnce("29.9.0");
        const invokeError = new Error("invoke failed");
        ipcMock.invoke.mockRejectedValueOnce(invokeError);

        await expect(api.invoke("getAppVersion")).resolves.toBe("29.9.0");
        await expect(api.invoke("getAppVersion")).rejects.toThrow(
            "invoke failed"
        );

        expect(ipcMock.invoke).toHaveBeenCalledTimes(2);
        expect(preloadLog).toHaveBeenCalledWith(
            "error",
            "[preload.js] Error in invoke(getAppVersion):",
            invokeError
        );
        expect(
            preloadLog.mock.calls.filter(([level]) => level === "warn")
        ).toStrictEqual([]);
    });

    it("blocks non-allowlisted generic channels while enforcement is enabled", async () => {
        expect.assertions(4);

        const { api, ipcMock, preloadLog } = createApi();

        await expect(api.invoke("theme:get")).rejects.toThrow(
            "Channel not allowed for invoke"
        );

        api.onIpc("menu-about", vi.fn());
        api.onUpdateEvent("update-downloaded", vi.fn());

        api.send("fit-file-loaded", "activity.fit");

        expect(ipcMock.on).not.toHaveBeenCalled();
        expect(ipcMock.send).not.toHaveBeenCalled();
        expect(preloadLog.mock.calls).toStrictEqual([
            [
                "warn",
                "[preload.js] Blocked onIpc() subscription to non-allowlisted channel: menu-about",
            ],
            [
                "warn",
                "[preload.js] Blocked onUpdateEvent() subscription to non-allowlisted event: update-downloaded",
            ],
            [
                "warn",
                "[preload.js] Blocked send() to non-allowlisted channel: fit-file-loaded",
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

    it("wraps event callbacks and removes listeners through the shared remover", () => {
        expect.assertions(7);

        const { api, ipcMock, preloadLog, removeIpcListener } = createApi();
        const callback = vi.fn<(...args: IpcResponsePayload[]) => void>();
        const unsubscribe = api.onIpc(
            "show-notification",
            callback
        ) as () => void;
        const [registeredChannel, listener] = ipcMock.on.mock.calls[0] as [
            string,
            (event: object, ...args: IpcResponsePayload[]) => void,
        ];
        const event = { id: "evt" };

        expect(ipcMock.on).toHaveBeenCalledOnce();
        expect(registeredChannel).toBe("show-notification");
        expect(listener).not.toBe(callback);

        listener(event, "payload");
        unsubscribe();

        expect(callback).toHaveBeenCalledWith("payload");
        expect(callback).not.toHaveBeenCalledWith(event, "payload");
        expect(removeIpcListener).toHaveBeenCalledWith(
            "show-notification",
            listener
        );
        expect(preloadLog).not.toHaveBeenCalled();
    });
});
