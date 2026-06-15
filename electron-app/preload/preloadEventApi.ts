type GenericSendChannel = import("../shared/ipc").GenericSendChannel;
type IpcRequestPayload = import("../shared/ipc").IpcRequestPayload;
type IpcResponsePayload = import("../shared/ipc").IpcResponsePayload;
type UpdateEventName = import("../shared/ipc").UpdateEventName;

type IpcListener = (event: object, ...args: IpcResponsePayload[]) => void;
type PreloadLog = (
    level: "error" | "info" | "warn",
    message: string,
    ...details: unknown[]
) => void;
type UnknownCallback = (...args: unknown[]) => unknown;

interface IpcRendererLike {
    on: (channel: string, listener: IpcListener) => void;
    send: (channel: string, ...args: IpcRequestPayload[]) => void;
}

interface PreloadEventApi {
    notifyFitFileLoaded: (filePath: null | string) => void;
    onUpdateEvent: (
        eventName: UpdateEventName,
        callback: (...args: IpcResponsePayload[]) => unknown
    ) => (() => void) | undefined;
}

interface PreloadEventApiOptions {
    fitFileLoadedChannel: GenericSendChannel;
    ipcRenderer: IpcRendererLike;
    isAllowedUpdateEventName: (
        eventName: unknown
    ) => eventName is UpdateEventName;
    preloadLog: PreloadLog;
    removeIpcListener: (channel: string, handler: IpcListener) => void;
    shouldEnforceGenericIpcAllowlist: boolean;
    validateCallback: (
        callback: unknown,
        methodName: string
    ) => callback is UnknownCallback;
    validateChannelName: (
        value: unknown,
        paramName: string,
        methodName: string
    ) => value is string;
}

export function createPreloadEventApi({
    fitFileLoadedChannel,
    ipcRenderer,
    isAllowedUpdateEventName,
    preloadLog,
    removeIpcListener,
    shouldEnforceGenericIpcAllowlist,
    validateCallback,
    validateChannelName,
}: PreloadEventApiOptions): PreloadEventApi {
    function notifyFitFileLoaded(filePath: null | string): void {
        if (filePath !== null && typeof filePath !== "string") {
            preloadLog(
                "error",
                "[preload.js] notifyFitFileLoaded: filePath must be a string or null"
            );
            return;
        }

        const normalizedPath =
            typeof filePath === "string" && filePath.trim().length > 0
                ? filePath
                : null;

        try {
            ipcRenderer.send(fitFileLoadedChannel, normalizedPath);
        } catch (error) {
            preloadLog(
                "error",
                "[preload.js] Error in notifyFitFileLoaded:",
                error
            );
        }
    }

    function onUpdateEvent(
        eventName: UpdateEventName,
        callback: (...args: IpcResponsePayload[]) => unknown
    ): (() => void) | undefined {
        const eventLabel = String(eventName);
        if (!validateCallback(callback, "onUpdateEvent")) {
            return undefined;
        }
        if (!validateChannelName(eventName, "eventName", "onUpdateEvent")) {
            return undefined;
        }

        if (
            shouldEnforceGenericIpcAllowlist &&
            !isAllowedUpdateEventName(eventName)
        ) {
            preloadLog(
                "warn",
                `[preload.js] Blocked onUpdateEvent() subscription to non-allowlisted event: ${eventLabel}`
            );
            return undefined;
        }

        try {
            const handler: IpcListener = (_event, ...args) => {
                try {
                    return callback(...args);
                } catch (error) {
                    preloadLog(
                        "error",
                        `[preload.js] Error in onUpdateEvent(${eventLabel}) callback:`,
                        error
                    );
                    return undefined;
                }
            };

            ipcRenderer.on(eventName, handler);

            return () => {
                try {
                    removeIpcListener(eventName, handler);
                    return undefined;
                } catch {
                    /* Ignore listener cleanup failures. */
                    return undefined;
                }
            };
        } catch (error) {
            preloadLog(
                "error",
                `[preload.js] Error setting up onUpdateEvent(${eventLabel}):`,
                error
            );
            return undefined;
        }
    }

    return {
        notifyFitFileLoaded,
        onUpdateEvent,
    };
}
