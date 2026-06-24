type IpcResponsePayload = import("../shared/ipc").IpcResponsePayload;
type UpdateEventName = import("../shared/ipc").UpdateEventName;
type CreatePreloadEventApiOptions =
    import("./preloadModuleTypes").CreatePreloadEventApiOptions;
type IpcEventListener = import("./preloadModuleTypes").IpcEventListener;
type PreloadEventApi = import("../shared/preloadApi").ElectronPreloadEventApi;

export function createPreloadEventApi({
    fitFileLoadedChannel,
    ipcRenderer,
    isAllowedUpdateEventName,
    preloadLog,
    removeIpcListener,
    shouldEnforceGenericIpcAllowlist,
    validateCallback,
    validateChannelName,
}: CreatePreloadEventApiOptions): PreloadEventApi {
    function noopUnsubscribe(): void {
        return undefined;
    }

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
            const send = ipcRenderer?.send;
            if (typeof send !== "function") {
                throw new TypeError("ipcRenderer.send unavailable");
            }
            send(fitFileLoadedChannel, normalizedPath);
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
            return noopUnsubscribe;
        }

        try {
            const on = ipcRenderer?.on;
            if (typeof on !== "function") {
                throw new TypeError("ipcRenderer.on unavailable");
            }
            const handler: IpcEventListener = (_event, ...args) => {
                try {
                    return callback(...(args as IpcResponsePayload[]));
                } catch (error) {
                    preloadLog(
                        "error",
                        `[preload.js] Error in onUpdateEvent(${eventLabel}) callback:`,
                        error
                    );
                    return undefined;
                }
            };

            on(eventName, handler);

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
            return noopUnsubscribe;
        }
    }

    return {
        notifyFitFileLoaded,
        onUpdateEvent,
    };
}
