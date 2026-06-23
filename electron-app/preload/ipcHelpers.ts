type GenericInvokeChannel = import("../shared/ipc").GenericInvokeChannel;
type GenericSendChannel = import("../shared/ipc").GenericSendChannel;
type IpcRequestPayload = import("../shared/ipc").IpcRequestPayload;
type IpcResponsePayload = import("../shared/ipc").IpcResponsePayload;
type InvokeRequestArgs<Channel extends GenericInvokeChannel> =
    import("../shared/ipc").InvokeRequestArgs<Channel>;
type InvokeResponsePayloadForChannel<Channel extends GenericInvokeChannel> =
    import("../shared/ipc").InvokeResponsePayloadForChannel<Channel>;
type ValidatedDevtoolsInjectMenuPayload = {
    fitFilePath: null | string;
    theme: null | string;
};
type ValidateExternalUrl = import("./preloadModuleTypes").ValidateExternalUrl;
type ValidateFitBrowserRelativePath =
    import("./preloadModuleTypes").ValidateFitBrowserRelativePath;
type ValidateFitBrowserRootFolderPath =
    import("./preloadModuleTypes").ValidateFitBrowserRootFolderPath;
type ValidateFitFilePathInput =
    import("./preloadModuleTypes").ValidateFitFilePathInput;
type ValidateMainStateOperationIdInput =
    import("./preloadModuleTypes").ValidateMainStateOperationIdInput;
type ValidateMainStatePathInput =
    import("./preloadModuleTypes").ValidateMainStatePathInput;

type CreatePreloadIpcHelpersOptions =
    import("./preloadModuleTypes").CreatePreloadIpcHelpersOptions;
type IpcEventListener = import("./preloadModuleTypes").IpcEventListener;
type PreloadIpcHelpers = import("./preloadModuleTypes").PreloadIpcHelpers;

type ValidateDevtoolsInjectMenuPayload = (
    theme: unknown,
    fitFilePath: unknown
) => ValidatedDevtoolsInjectMenuPayload;

interface PreloadInvokeValidationPolicy {
    validateDevtoolsInjectMenuPayload: ValidateDevtoolsInjectMenuPayload;
    validateExternalUrl: ValidateExternalUrl;
    validateFitBrowserRelativePath: ValidateFitBrowserRelativePath;
    validateFitBrowserRootFolderPath: ValidateFitBrowserRootFolderPath;
    validateFitFilePathInput: ValidateFitFilePathInput;
    validateMainStateOperationIdInput: ValidateMainStateOperationIdInput;
    validateMainStatePathInput: ValidateMainStatePathInput;
}

function isMissingFileError(error: unknown): boolean {
    if (error && typeof error === "object" && "code" in error) {
        return (error as { code?: unknown }).code === "ENOENT";
    }

    const message = error instanceof Error ? error.message : String(error);
    return /\bENOENT\b/u.test(message);
}

function shouldSuppressInvokeErrorLog(
    methodName: string,
    error: unknown
): boolean {
    return methodName === "readFile" && isMissingFileError(error);
}

function noopUnsubscribe(): void {
    return undefined;
}

function createNoopUnsubscribe(): () => void {
    return noopUnsubscribe;
}

function createInvokeValidationError(
    channel: string,
    message: string
): TypeError {
    return new TypeError(`${channel}: ${message}`);
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function isSerializableMainStateValue(value: unknown): boolean {
    if (value === null || value === undefined) {
        return true;
    }

    if (
        [
            "boolean",
            "number",
            "string",
        ].includes(typeof value)
    ) {
        return true;
    }

    if (Array.isArray(value)) {
        return value.every(isSerializableMainStateValue);
    }

    if (typeof value !== "object") {
        return false;
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== null && prototype !== Object.prototype) {
        return false;
    }

    return Object.values(value as Record<string, unknown>).every(
        isSerializableMainStateValue
    );
}

function validateNoArgs(channel: string, args: readonly unknown[]): void {
    if (args.length > 0) {
        throw createInvokeValidationError(channel, "expected no arguments");
    }
}

function validateSingleStringArg(
    channel: string,
    args: readonly unknown[]
): void {
    if (args.length !== 1 || !isNonEmptyString(args[0])) {
        throw createInvokeValidationError(
            channel,
            "expected one non-empty string argument"
        );
    }
}

function validateInvokeArgs(
    channel: string,
    args: readonly unknown[],
    policy: PreloadInvokeValidationPolicy
): void {
    const {
        validateDevtoolsInjectMenuPayload,
        validateExternalUrl,
        validateFitBrowserRelativePath,
        validateFitBrowserRootFolderPath,
        validateFitFilePathInput,
        validateMainStateOperationIdInput,
        validateMainStatePathInput,
    } = policy;

    switch (channel) {
        case "browser:getFolder":
        case "browser:isEnabled":
        case "dialog:openFile":
        case "dialog:openFolder":
        case "dialog:openOverlayFiles":
        case "getAppVersion":
        case "getChromeVersion":
        case "getElectronVersion":
        case "getLicenseInfo":
        case "getNodeVersion":
        case "getPlatformInfo":
        case "gyazo:server:stop":
        case "map-tab:get":
        case "recentFiles:get":
        case "theme:get": {
            validateNoArgs(channel, args);
            return;
        }

        case "browser:listFolder": {
            if (args.length !== 1) {
                throw createInvokeValidationError(
                    channel,
                    "expected one relative folder path argument"
                );
            }
            validateFitBrowserRelativePath(args[0]);
            return;
        }

        case "browser:setEnabled": {
            if (args.length !== 1 || typeof args[0] !== "boolean") {
                throw createInvokeValidationError(
                    channel,
                    "expected one boolean argument"
                );
            }
            return;
        }

        case "browser:setFolder": {
            if (args.length !== 1) {
                throw createInvokeValidationError(
                    channel,
                    "expected one root folder path argument"
                );
            }
            validateFitBrowserRootFolderPath(args[0]);
            return;
        }

        case "clipboard:writePngDataUrl":
        case "clipboard:writeText": {
            validateSingleStringArg(channel, args);
            return;
        }

        case "devtools-inject-menu": {
            if (args.length > 2) {
                throw createInvokeValidationError(
                    channel,
                    "expected optional theme and FIT file path strings"
                );
            }
            validateDevtoolsInjectMenuPayload(args[0], args[1]);
            return;
        }

        case "file:read":
        case "recentFiles:add":
        case "recentFiles:approve": {
            if (args.length !== 1) {
                throw createInvokeValidationError(
                    channel,
                    "expected one absolute FIT file path argument"
                );
            }
            validateFitFilePathInput(args[0]);
            return;
        }

        case "fit:decode":
        case "fit:parse": {
            if (args.length !== 1 || !(args[0] instanceof ArrayBuffer)) {
                throw createInvokeValidationError(
                    channel,
                    "expected one ArrayBuffer argument"
                );
            }
            return;
        }

        case "gyazo:server:start": {
            if (
                args.length !== 1 ||
                typeof args[0] !== "number" ||
                !Number.isInteger(args[0]) ||
                args[0] < 1 ||
                args[0] > 65_535
            ) {
                throw createInvokeValidationError(
                    channel,
                    "expected one TCP port number"
                );
            }
            return;
        }

        case "main-state:errors": {
            if (
                args.length > 1 ||
                (args[0] !== undefined &&
                    (typeof args[0] !== "number" ||
                        !Number.isInteger(args[0]) ||
                        args[0] < 0))
            ) {
                throw createInvokeValidationError(
                    channel,
                    "expected an optional non-negative integer limit"
                );
            }
            return;
        }

        case "main-state:get": {
            if (args.length > 1) {
                throw createInvokeValidationError(
                    channel,
                    "expected an optional non-empty state path"
                );
            }
            validateMainStatePathInput(args[0], { allowUndefined: true });
            return;
        }

        case "main-state:listen":
        case "main-state:unlisten": {
            if (args.length !== 1) {
                throw createInvokeValidationError(
                    channel,
                    "expected one main-state path argument"
                );
            }
            validateMainStatePathInput(args[0]);
            return;
        }

        case "main-state:metrics":
        case "main-state:operations": {
            validateNoArgs(channel, args);
            return;
        }

        case "main-state:operation": {
            if (args.length !== 1) {
                throw createInvokeValidationError(
                    channel,
                    "expected one main-state operation id argument"
                );
            }
            validateMainStateOperationIdInput(args[0]);
            return;
        }

        case "main-state:set": {
            if (
                args.length < 2 ||
                args.length > 3 ||
                !isSerializableMainStateValue(args[1]) ||
                (args[2] !== undefined &&
                    !isSerializableMainStateValue(args[2]))
            ) {
                throw createInvokeValidationError(
                    channel,
                    "expected a state path, serializable value, and optional serializable options"
                );
            }
            validateMainStatePathInput(args[0]);
            return;
        }

        case "shell:openExternal": {
            if (args.length !== 1) {
                throw createInvokeValidationError(
                    channel,
                    "expected one external URL argument"
                );
            }
            validateExternalUrl(args[0]);
            return;
        }
    }

    throw createInvokeValidationError(
        channel,
        "is not an allowed invoke channel"
    );
}

export function createPreloadIpcHelpers({
    ipcRenderer,
    preloadLog,
    validateDevtoolsInjectMenuPayload,
    validateExternalUrl,
    validateFitBrowserRelativePath,
    validateFitBrowserRootFolderPath,
    validateFitFilePathInput,
    validateMainStateOperationIdInput,
    validateMainStatePathInput,
    validateCallback,
}: CreatePreloadIpcHelpersOptions): PreloadIpcHelpers {
    const validationPolicy = {
        validateDevtoolsInjectMenuPayload,
        validateExternalUrl,
        validateFitBrowserRelativePath,
        validateFitBrowserRootFolderPath,
        validateFitFilePathInput,
        validateMainStateOperationIdInput,
        validateMainStatePathInput,
    };

    function createSafeEventHandler<Callback>(
        channel: string,
        methodName: string,
        transform?: (...args: IpcResponsePayload[]) => unknown
    ): (callback: Callback) => () => void {
        return (callback) => {
            if (!validateCallback(callback, methodName)) {
                return createNoopUnsubscribe();
            }

            try {
                const on = ipcRenderer?.on;
                if (typeof on !== "function") {
                    throw new TypeError("ipcRenderer.on unavailable");
                }
                const handler: IpcEventListener = (_event, ...args) => {
                    try {
                        if (transform) {
                            return callback(
                                transform(...(args as IpcResponsePayload[]))
                            );
                        }

                        return callback(...args);
                    } catch (error) {
                        preloadLog(
                            "error",
                            `[preload.js] Error in ${methodName} callback:`,
                            error
                        );
                        return undefined;
                    }
                };

                on(channel, handler);

                return () => {
                    try {
                        removeIpcListener(channel, handler);
                        return undefined;
                    } catch {
                        /* Ignore listener cleanup failures. */
                        return undefined;
                    }
                };
            } catch (error) {
                preloadLog(
                    "error",
                    `[preload.js] Error setting up ${methodName} event handler:`,
                    error
                );
                return createNoopUnsubscribe();
            }
        };
    }

    function createSafeInvokeHandler<Channel extends GenericInvokeChannel>(
        channel: Channel,
        methodName: string
    ): (
        ...args: InvokeRequestArgs<Channel>
    ) => Promise<InvokeResponsePayloadForChannel<Channel>> {
        return async (...args) => {
            try {
                validateInvokeArgs(channel, args, validationPolicy);
                const invoke = ipcRenderer?.invoke;
                if (typeof invoke !== "function") {
                    throw new TypeError("ipcRenderer.invoke unavailable");
                }
                return (await invoke(
                    channel,
                    ...args
                )) as InvokeResponsePayloadForChannel<Channel>;
            } catch (error) {
                if (!shouldSuppressInvokeErrorLog(methodName, error)) {
                    preloadLog(
                        "error",
                        `[preload.js] Error in ${methodName}:`,
                        error
                    );
                }
                throw error;
            }
        };
    }

    function createSafeSendHandler(
        channel: GenericSendChannel,
        methodName: string
    ): (...args: IpcRequestPayload[]) => void {
        return (...args) => {
            try {
                const send = ipcRenderer?.send;
                if (typeof send !== "function") {
                    throw new TypeError("ipcRenderer.send unavailable");
                }
                send(channel, ...args);
            } catch (error) {
                preloadLog(
                    "error",
                    `[preload.js] Error in ${methodName}:`,
                    error
                );
            }
        };
    }

    function removeIpcListener(
        channel: string,
        handler: IpcEventListener
    ): void {
        if (typeof ipcRenderer?.removeListener === "function") {
            ipcRenderer.removeListener(channel, handler);
            return;
        }

        if (typeof ipcRenderer?.off === "function") {
            ipcRenderer.off(channel, handler);
            return;
        }

        if (typeof ipcRenderer?.removeAllListeners === "function") {
            ipcRenderer.removeAllListeners(channel);
        }
    }

    return {
        createNoopUnsubscribe,
        createSafeEventHandler,
        createSafeInvokeHandler,
        createSafeSendHandler,
        removeIpcListener,
    };
}
