"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) =>
    function __require() {
        return (
            mod ||
                (0, cb[__getOwnPropNames(cb)[0]])(
                    (mod = { exports: {} }).exports,
                    mod
                ),
            mod.exports
        );
    };

// preload/apiDiagnostics.js
var require_apiDiagnostics = __commonJS({
    "preload/apiDiagnostics.js"(exports2, module2) {
        "use strict";
        {
            let createApiDiagnostics2 = function ({
                channels,
                contextBridge: contextBridge2,
                events,
                ipcRenderer: ipcRenderer2,
                isDevelopmentMode: isDevelopmentMode2,
                preloadLog: preloadLog2,
            }) {
                function getChannelInfo() {
                    return {
                        channels,
                        events,
                        totalChannels: Object.keys(channels).length,
                        totalEvents: Object.keys(events).length,
                    };
                }
                function validateAPI() {
                    try {
                        const hasContextBridge =
                            contextBridge2 !== null &&
                            contextBridge2 !== void 0 &&
                            typeof contextBridge2.exposeInMainWorld ===
                                "function";
                        const hasIpcRenderer =
                            ipcRenderer2 !== null &&
                            ipcRenderer2 !== void 0 &&
                            typeof ipcRenderer2.invoke === "function" &&
                            typeof ipcRenderer2.send === "function" &&
                            typeof ipcRenderer2.on === "function";
                        if (isDevelopmentMode2()) {
                            preloadLog2(
                                "info",
                                "[preload.js] API Validation:",
                                {
                                    channelCount: Object.keys(channels).length,
                                    eventCount: Object.keys(events).length,
                                    hasContextBridge,
                                    hasIpcRenderer,
                                }
                            );
                        }
                        return hasIpcRenderer && hasContextBridge;
                    } catch (error) {
                        preloadLog2(
                            "error",
                            "[preload.js] API validation failed:",
                            error
                        );
                        return false;
                    }
                }
                return {
                    getChannelInfo,
                    validateAPI,
                };
            };
            module2.exports = {
                createApiDiagnostics: createApiDiagnostics2,
            };
        }
    },
});

// preload/beforeExitHandler.js
var require_beforeExitHandler = __commonJS({
    "preload/beforeExitHandler.js"(exports2, module2) {
        "use strict";
        {
            let getProcessRegistry = function (globalScope, preloadLog2) {
                    const existing = globalScope[BEFORE_EXIT_REGISTRY_KEY];
                    if (existing) {
                        return existing;
                    }
                    try {
                        const registry = /* @__PURE__ */ new WeakMap();
                        globalScope[BEFORE_EXIT_REGISTRY_KEY] = registry;
                        return registry;
                    } catch (error) {
                        preloadLog2(
                            "warn",
                            "[preload.js] Unable to initialize beforeExit registry:",
                            error
                        );
                        globalScope[BEFORE_EXIT_REGISTRY_KEY] = null;
                        return null;
                    }
                },
                getRegisteredBeforeExitWrapper = function (
                    processRef,
                    handleBeforeExit,
                    preloadLog2
                ) {
                    try {
                        const listeners = processRef.listeners("beforeExit");
                        for (const listener of listeners) {
                            if (
                                isTrackedBeforeExitListener(
                                    listener,
                                    handleBeforeExit
                                )
                            ) {
                                return listener;
                            }
                        }
                    } catch (error) {
                        preloadLog2(
                            "warn",
                            "[preload.js] Unable to capture beforeExit listener wrapper:",
                            error
                        );
                    }
                    return handleBeforeExit;
                },
                isTrackedBeforeExitListener = function (
                    listener,
                    handleBeforeExit
                ) {
                    if (typeof listener !== "function") {
                        return false;
                    }
                    const listenerRecord = listener;
                    return (
                        listener === handleBeforeExit ||
                        listenerRecord.listener === handleBeforeExit ||
                        listenerRecord[BEFORE_EXIT_LISTENER_SYMBOL] === true
                    );
                },
                markBeforeExitWrapper = function (storedWrapper) {
                    try {
                        Reflect.set(
                            storedWrapper,
                            BEFORE_EXIT_LISTENER_SYMBOL,
                            true
                        );
                    } catch {}
                },
                pruneTrackedBeforeExitListeners = function (
                    processRef,
                    handleBeforeExit,
                    preloadLog2
                ) {
                    try {
                        const currentListeners =
                            processRef.listeners("beforeExit");
                        for (const listener of currentListeners) {
                            if (
                                isTrackedBeforeExitListener(
                                    listener,
                                    handleBeforeExit
                                )
                            ) {
                                processRef.removeListener(
                                    "beforeExit",
                                    listener
                                );
                            }
                        }
                    } catch (error) {
                        preloadLog2(
                            "warn",
                            "[preload.js] Unable to prune stale beforeExit listeners:",
                            error
                        );
                    }
                },
                registerPreloadBeforeExitHandler2 = function ({
                    globalScope = globalThis,
                    isDevelopmentMode: isDevelopmentMode2,
                    preloadLog: preloadLog2,
                    processRef = process,
                }) {
                    const registry = getProcessRegistry(
                        globalScope,
                        preloadLog2
                    );
                    const handleBeforeExit = () => {
                        if (isDevelopmentMode2()) {
                            preloadLog2(
                                "info",
                                "[preload.js] Process exiting, performing cleanup..."
                            );
                        }
                        if (!registry) {
                            return;
                        }
                        const existingWrapper = registry.get(processRef);
                        registry.delete(processRef);
                        if (existingWrapper) {
                            removeBeforeExitListener(
                                processRef,
                                existingWrapper,
                                "[preload.js] Unable to remove beforeExit listener during cleanup:",
                                preloadLog2
                            );
                        }
                    };
                    removeRegisteredBeforeExitWrapper(
                        processRef,
                        registry,
                        preloadLog2
                    );
                    pruneTrackedBeforeExitListeners(
                        processRef,
                        handleBeforeExit,
                        preloadLog2
                    );
                    processRef.once("beforeExit", handleBeforeExit);
                    if (registry) {
                        const storedWrapper = getRegisteredBeforeExitWrapper(
                            processRef,
                            handleBeforeExit,
                            preloadLog2
                        );
                        markBeforeExitWrapper(storedWrapper);
                        registry.set(processRef, storedWrapper);
                    }
                },
                removeBeforeExitListener = function (
                    processRef,
                    listener,
                    failureMessage,
                    preloadLog2
                ) {
                    try {
                        processRef.removeListener("beforeExit", listener);
                    } catch (error) {
                        preloadLog2("warn", failureMessage, error);
                    }
                },
                removeRegisteredBeforeExitWrapper = function (
                    processRef,
                    registry,
                    preloadLog2
                ) {
                    const existingWrapper = registry?.get(processRef);
                    if (existingWrapper === void 0) {
                        return;
                    }
                    removeBeforeExitListener(
                        processRef,
                        existingWrapper,
                        "[preload.js] Unable to remove stale beforeExit listener:",
                        preloadLog2
                    );
                    registry?.delete(processRef);
                };
            const BEFORE_EXIT_LISTENER_SYMBOL = /* @__PURE__ */ Symbol.for(
                "ffv.preload.beforeExitListener"
            );
            const BEFORE_EXIT_REGISTRY_KEY =
                "__ffv_preload_beforeExitRegistry__";
            module2.exports = {
                registerPreloadBeforeExitHandler:
                    registerPreloadBeforeExitHandler2,
            };
        }
    },
});

// preload/clipboardBridge.js
var require_clipboardBridge = __commonJS({
    "preload/clipboardBridge.js"(exports2, module2) {
        "use strict";
        {
            let createClipboardBridge2 = function ({
                channels,
                ipcRenderer: ipcRenderer2,
                preloadLog: preloadLog2,
            }) {
                async function writeClipboardPngDataUrl(pngDataUrl) {
                    try {
                        const ok = await ipcRenderer2.invoke(
                            channels.CLIPBOARD_WRITE_PNG_DATA_URL,
                            pngDataUrl
                        );
                        return Boolean(ok);
                    } catch (error) {
                        preloadLog2(
                            "error",
                            "[preload.js] writeClipboardPngDataUrl failed:",
                            error
                        );
                        return false;
                    }
                }
                async function writeClipboardText(text) {
                    try {
                        const ok = await ipcRenderer2.invoke(
                            channels.CLIPBOARD_WRITE_TEXT,
                            text
                        );
                        return Boolean(ok);
                    } catch (error) {
                        preloadLog2(
                            "error",
                            "[preload.js] writeClipboardText failed:",
                            error
                        );
                        return false;
                    }
                }
                return {
                    writeClipboardPngDataUrl,
                    writeClipboardText,
                };
            };
            module2.exports = {
                createClipboardBridge: createClipboardBridge2,
            };
        }
    },
});

// preload/devtoolsMenuApi.js
var require_devtoolsMenuApi = __commonJS({
    "preload/devtoolsMenuApi.js"(exports2, module2) {
        "use strict";
        {
            let createDevtoolsMenuApi2 = function ({
                defaultFitFilePath,
                defaultTheme,
                devtoolsInjectMenuChannel,
                ipcRenderer: ipcRenderer2,
                preloadLog: preloadLog2,
                validateOptionalNonEmptyString: validateOptionalNonEmptyString2,
            }) {
                async function injectMenu(
                    theme = defaultTheme,
                    fitFilePath = defaultFitFilePath
                ) {
                    if (
                        !validateOptionalNonEmptyString2(
                            theme,
                            "theme",
                            "injectMenu"
                        )
                    ) {
                        return false;
                    }
                    if (
                        !validateOptionalNonEmptyString2(
                            fitFilePath,
                            "fitFilePath",
                            "injectMenu"
                        )
                    ) {
                        return false;
                    }
                    try {
                        return await ipcRenderer2.invoke(
                            devtoolsInjectMenuChannel,
                            theme,
                            fitFilePath
                        );
                    } catch (error) {
                        preloadLog2(
                            "error",
                            "[preload.js] Error in injectMenu:",
                            error
                        );
                        return false;
                    }
                }
                return {
                    injectMenu,
                };
            };
            module2.exports = {
                createDevtoolsMenuApi: createDevtoolsMenuApi2,
            };
        }
    },
});

// preload/validators.js
var require_validators = __commonJS({
    "preload/validators.js"(exports2, module2) {
        "use strict";
        {
            let createPreloadValidators2 = function (preloadLog2) {
                function validateCallback2(callback, methodName) {
                    if (typeof callback !== "function") {
                        preloadLog2(
                            "error",
                            `[preload.js] ${methodName}: callback must be a function`
                        );
                        return false;
                    }
                    return true;
                }
                function validateChannelName2(value, paramName, methodName) {
                    if (typeof value !== "string") {
                        preloadLog2(
                            "error",
                            `[preload.js] ${methodName}: ${paramName} must be a string`
                        );
                        return false;
                    }
                    if (value.trim().length === 0) {
                        preloadLog2(
                            "error",
                            `[preload.js] ${methodName}: ${paramName} must be a non-empty string`
                        );
                        return false;
                    }
                    return true;
                }
                function validateOptionalNonEmptyString2(
                    value,
                    paramName,
                    methodName
                ) {
                    if (value === void 0 || value === null) {
                        return true;
                    }
                    if (typeof value !== "string") {
                        preloadLog2(
                            "error",
                            `[preload.js] ${methodName}: ${paramName} must be a string or null`
                        );
                        return false;
                    }
                    if (value.trim().length === 0) {
                        preloadLog2(
                            "error",
                            `[preload.js] ${methodName}: ${paramName} must be a non-empty string or null`
                        );
                        return false;
                    }
                    return true;
                }
                function validateRequiredNonEmptyString2(
                    value,
                    paramName,
                    methodName
                ) {
                    if (typeof value !== "string") {
                        preloadLog2(
                            "error",
                            `[preload.js] ${methodName}: ${paramName} must be a string`
                        );
                        return false;
                    }
                    if (value.trim().length === 0) {
                        preloadLog2(
                            "error",
                            `[preload.js] ${methodName}: ${paramName} must be a non-empty string`
                        );
                        return false;
                    }
                    return true;
                }
                return {
                    validateCallback: validateCallback2,
                    validateChannelName: validateChannelName2,
                    validateOptionalNonEmptyString:
                        validateOptionalNonEmptyString2,
                    validateRequiredNonEmptyString:
                        validateRequiredNonEmptyString2,
                };
            };
            module2.exports = {
                createPreloadValidators: createPreloadValidators2,
            };
        }
    },
});

// preload/environment.js
var require_environment = __commonJS({
    "preload/environment.js"(exports2, module2) {
        "use strict";
        {
            let getProcessEnvValue = function (processRef, name) {
                    const env = processRef?.env;
                    if (!isPreloadObjectRecord(env)) {
                        return void 0;
                    }
                    const value = Reflect.get(env, name);
                    return typeof value === "string" ? value : void 0;
                },
                getProcessVersionValue = function (processRef, name) {
                    const versions = processRef?.versions;
                    if (!isPreloadObjectRecord(versions)) {
                        return void 0;
                    }
                    const value = Reflect.get(versions, name);
                    return typeof value === "string" ? value : void 0;
                },
                isPreloadDevelopmentMode2 = function (processRef = process) {
                    return (
                        getProcessEnvValue(processRef, "NODE_ENV") ===
                        "development"
                    );
                },
                isPreloadElectronRuntime = function (processRef = process) {
                    return (
                        getProcessVersionValue(processRef, "electron") !==
                        void 0
                    );
                },
                isPreloadObjectRecord = function (value) {
                    return typeof value === "object" && value !== null;
                },
                shouldEnforceGenericIpcAllowlist2 = function (
                    processRef = process
                ) {
                    return (
                        isPreloadElectronRuntime(processRef) &&
                        getProcessEnvValue(
                            processRef,
                            "FFV_ALLOW_GENERIC_IPC"
                        ) !== "true"
                    );
                };
            module2.exports = {
                isPreloadDevelopmentMode: isPreloadDevelopmentMode2,
                isPreloadElectronRuntime,
                shouldEnforceGenericIpcAllowlist:
                    shouldEnforceGenericIpcAllowlist2,
            };
        }
    },
});

// preload/genericIpcApi.js
var require_genericIpcApi = __commonJS({
    "preload/genericIpcApi.js"(exports2, module2) {
        "use strict";
        {
            let createGenericIpcApi2 = function ({
                fitFileLoadedChannel,
                ipcRenderer: ipcRenderer2,
                isAllowedGenericInvokeChannel: isAllowedGenericInvokeChannel2,
                isAllowedGenericSendChannel: isAllowedGenericSendChannel2,
                isAllowedRendererIpcEventChannel:
                    isAllowedRendererIpcEventChannel2,
                isAllowedUpdateEventName: isAllowedUpdateEventName2,
                preloadLog: preloadLog2,
                removeIpcListener: removeIpcListener2,
                shouldEnforceGenericIpcAllowlist:
                    shouldEnforceGenericIpcAllowlist2,
                validateCallback: validateCallback2,
                validateChannelName: validateChannelName2,
            }) {
                async function invoke(channel, ...args) {
                    if (!validateChannelName2(channel, "channel", "invoke")) {
                        throw new Error("Invalid channel for invoke");
                    }
                    if (
                        shouldEnforceGenericIpcAllowlist2 &&
                        !isAllowedGenericInvokeChannel2(channel)
                    ) {
                        throw new Error("Channel not allowed for invoke");
                    }
                    return await invokeChannel(channel, args);
                }
                function notifyFitFileLoaded(filePath) {
                    if (filePath !== null && typeof filePath !== "string") {
                        preloadLog2(
                            "error",
                            "[preload.js] notifyFitFileLoaded: filePath must be a string or null"
                        );
                        return;
                    }
                    const normalizedPath =
                        typeof filePath === "string" &&
                        filePath.trim().length > 0
                            ? filePath
                            : null;
                    try {
                        ipcRenderer2.send(fitFileLoadedChannel, normalizedPath);
                    } catch (error) {
                        preloadLog2(
                            "error",
                            "[preload.js] Error in notifyFitFileLoaded:",
                            error
                        );
                    }
                }
                function onIpc(channel, callback) {
                    if (!validateChannelName2(channel, "channel", "onIpc")) {
                        return void 0;
                    }
                    if (!validateCallback2(callback, "onIpc")) {
                        return void 0;
                    }
                    if (
                        shouldEnforceGenericIpcAllowlist2 &&
                        !isAllowedRendererIpcEventChannel2(channel)
                    ) {
                        preloadLog2(
                            "warn",
                            `[preload.js] Blocked onIpc() subscription to non-allowlisted channel: ${channel}`
                        );
                        return void 0;
                    }
                    try {
                        const wrapped = (event, ...args) => {
                            try {
                                callback(event, ...args);
                            } catch (error) {
                                preloadLog2(
                                    "error",
                                    `[preload.js] Error in onIpc(${channel}) callback:`,
                                    error
                                );
                            }
                        };
                        ipcRenderer2.on(channel, wrapped);
                        return () => {
                            try {
                                removeIpcListener2(channel, wrapped);
                            } catch (error) {
                                preloadLog2(
                                    "error",
                                    `[preload.js] Error removing onIpc(${channel}) listener:`,
                                    error
                                );
                            }
                        };
                    } catch (error) {
                        preloadLog2(
                            "error",
                            `[preload.js] Error setting up onIpc(${channel}):`,
                            error
                        );
                        return void 0;
                    }
                }
                function onUpdateEvent(eventName, callback) {
                    if (!validateCallback2(callback, "onUpdateEvent")) {
                        return void 0;
                    }
                    if (
                        !validateChannelName2(
                            eventName,
                            "eventName",
                            "onUpdateEvent"
                        )
                    ) {
                        return void 0;
                    }
                    if (
                        shouldEnforceGenericIpcAllowlist2 &&
                        !isAllowedUpdateEventName2(eventName)
                    ) {
                        preloadLog2(
                            "warn",
                            `[preload.js] Blocked onUpdateEvent() subscription to non-allowlisted event: ${eventName}`
                        );
                        return void 0;
                    }
                    try {
                        const handler = (_event, ...args) => {
                            try {
                                callback(...args);
                            } catch (error) {
                                preloadLog2(
                                    "error",
                                    `[preload.js] Error in onUpdateEvent(${eventName}) callback:`,
                                    error
                                );
                            }
                        };
                        ipcRenderer2.on(eventName, handler);
                        return () => {
                            try {
                                removeIpcListener2(eventName, handler);
                            } catch {}
                        };
                    } catch (error) {
                        preloadLog2(
                            "error",
                            `[preload.js] Error setting up onUpdateEvent(${eventName}):`,
                            error
                        );
                        return void 0;
                    }
                }
                function send(channel, ...args) {
                    if (!validateChannelName2(channel, "channel", "send")) {
                        return;
                    }
                    if (
                        shouldEnforceGenericIpcAllowlist2 &&
                        !isAllowedGenericSendChannel2(channel)
                    ) {
                        preloadLog2(
                            "warn",
                            `[preload.js] Blocked send() to non-allowlisted channel: ${String(channel)}`
                        );
                        return;
                    }
                    try {
                        ipcRenderer2.send(channel, ...args);
                    } catch (error) {
                        preloadLog2(
                            "error",
                            `[preload.js] Error in send(${channel}):`,
                            error
                        );
                    }
                }
                async function invokeChannel(channel, args) {
                    try {
                        return await ipcRenderer2.invoke(channel, ...args);
                    } catch (error) {
                        preloadLog2(
                            "error",
                            `[preload.js] Error in invoke(${channel}):`,
                            error
                        );
                        throw error;
                    }
                }
                return {
                    invoke,
                    notifyFitFileLoaded,
                    onIpc,
                    onUpdateEvent,
                    send,
                };
            };
            module2.exports = {
                createGenericIpcApi: createGenericIpcApi2,
            };
        }
    },
});

// preload/electronBridge.js
var require_electronBridge = __commonJS({
    "preload/electronBridge.js"(exports2, module2) {
        "use strict";
        {
            let getModuleLoadError = function (error) {
                    return error instanceof Error
                        ? error
                        : new Error("Module loading failed");
                },
                getOverride = function (globalScope) {
                    return Reflect.get(globalScope, "__electronHoistedMock");
                },
                isPreloadObjectRecord = function (value) {
                    return typeof value === "object" && value !== null;
                },
                loadElectronBridge = function (requireModule) {
                    const electronModule = requireModule(ELECTRON_MODULE_ID);
                    return unwrapElectronBridge(electronModule);
                },
                resolveBridgePart = function (override, loadBridge, pick) {
                    let lastError;
                    try {
                        const overridePart =
                            override === null ? void 0 : pick(override);
                        if (overridePart !== null && overridePart !== void 0) {
                            return overridePart;
                        }
                        const bridge = loadBridge();
                        return bridge === null ? void 0 : pick(bridge);
                    } catch (error) {
                        lastError = error;
                    }
                    if (override === null) {
                        throw getModuleLoadError(lastError);
                    }
                    return null;
                },
                resolvePreloadElectronBridge2 = function ({
                    globalScope = globalThis,
                    requireModule,
                }) {
                    const override = getOverride(globalScope) ?? null;
                    const loadBridge = () => loadElectronBridge(requireModule);
                    return {
                        contextBridge: resolveBridgePart(
                            override,
                            loadBridge,
                            (bridge) => bridge.contextBridge
                        ),
                        ipcRenderer: resolveBridgePart(
                            override,
                            loadBridge,
                            (bridge) => bridge.ipcRenderer
                        ),
                    };
                },
                unwrapElectronBridge = function (value) {
                    if (!isPreloadObjectRecord(value)) {
                        return null;
                    }
                    if ("contextBridge" in value || "ipcRenderer" in value) {
                        return value;
                    }
                    if ("default" in value) {
                        return unwrapElectronBridge(value["default"]);
                    }
                    return value;
                };
            const ELECTRON_MODULE_ID = ["electron"].join("");
            module2.exports = {
                resolvePreloadElectronBridge: resolvePreloadElectronBridge2,
            };
        }
    },
});

// preload/mainStateBridge.js
var require_mainStateBridge = __commonJS({
    "preload/mainStateBridge.js"(exports2, module2) {
        "use strict";
        {
            let createMainStateBridge2 = function ({
                ipcRenderer: ipcRenderer2,
                preloadLog: preloadLog2,
                removeIpcListener: removeIpcListener2,
            }) {
                const callbacksByPath = /* @__PURE__ */ new Map();
                let dispatcher;
                function ensureDispatcher() {
                    if (dispatcher) {
                        return;
                    }
                    dispatcher = (_event, change) => {
                        const path =
                            typeof change.path === "string" &&
                            change.path.length > 0
                                ? change.path
                                : void 0;
                        if (path === void 0) {
                            return;
                        }
                        const callbacks = callbacksByPath.get(path);
                        if (callbacks === void 0 || callbacks.size === 0) {
                            return;
                        }
                        for (const listener of callbacks) {
                            try {
                                listener(change);
                            } catch (error) {
                                preloadLog2(
                                    "error",
                                    "[preload.js] Error in main-state callback:",
                                    error
                                );
                            }
                        }
                    };
                    ipcRenderer2.on("main-state-change", dispatcher);
                }
                async function listenToMainState(path, callback) {
                    ensureDispatcher();
                    const existing = callbacksByPath.get(path);
                    const callbacks = existing ?? /* @__PURE__ */ new Set();
                    callbacks.add(callback);
                    if (!existing) {
                        callbacksByPath.set(path, callbacks);
                        await ipcRenderer2.invoke("main-state:listen", path);
                    }
                    return true;
                }
                async function unlistenFromMainState(path, callback) {
                    const callbacks = callbacksByPath.get(path);
                    if (!callbacks) {
                        return false;
                    }
                    callbacks.delete(callback);
                    if (callbacks.size === 0) {
                        callbacksByPath.delete(path);
                        await ipcRenderer2.invoke("main-state:unlisten", path);
                    }
                    if (callbacksByPath.size === 0 && dispatcher) {
                        removeIpcListener2("main-state-change", dispatcher);
                        dispatcher = void 0;
                    }
                    return true;
                }
                return {
                    listenToMainState,
                    unlistenFromMainState,
                };
            };
            module2.exports = {
                createMainStateBridge: createMainStateBridge2,
            };
        }
    },
});

// preload/ipcHelpers.js
var require_ipcHelpers = __commonJS({
    "preload/ipcHelpers.js"(exports2, module2) {
        "use strict";
        {
            let createPreloadIpcHelpers2 = function ({
                ipcRenderer: ipcRenderer2,
                preloadLog: preloadLog2,
                validateCallback: validateCallback2,
            }) {
                function createNoopUnsubscribe() {
                    return noopUnsubscribe;
                }
                function createSafeEventHandler2(
                    channel,
                    methodName,
                    transform
                ) {
                    return (callback) => {
                        if (!validateCallback2(callback, methodName)) {
                            return createNoopUnsubscribe();
                        }
                        try {
                            const handler = (_event, ...args) => {
                                try {
                                    if (transform) {
                                        callback(transform(...args));
                                        return;
                                    }
                                    callback(...args);
                                } catch (error) {
                                    preloadLog2(
                                        "error",
                                        `[preload.js] Error in ${methodName} callback:`,
                                        error
                                    );
                                }
                            };
                            ipcRenderer2.on(channel, handler);
                            return () => {
                                try {
                                    removeIpcListener2(channel, handler);
                                } catch {}
                            };
                        } catch (error) {
                            preloadLog2(
                                "error",
                                `[preload.js] Error setting up ${methodName} event handler:`,
                                error
                            );
                            return createNoopUnsubscribe();
                        }
                    };
                }
                function createSafeInvokeHandler2(channel, methodName) {
                    return async (...args) => {
                        try {
                            return await ipcRenderer2.invoke(channel, ...args);
                        } catch (error) {
                            preloadLog2(
                                "error",
                                `[preload.js] Error in ${methodName}:`,
                                error
                            );
                            throw error;
                        }
                    };
                }
                function createSafeSendHandler2(channel, methodName) {
                    return (...args) => {
                        try {
                            ipcRenderer2.send(channel, ...args);
                        } catch (error) {
                            preloadLog2(
                                "error",
                                `[preload.js] Error in ${methodName}:`,
                                error
                            );
                        }
                    };
                }
                function noopUnsubscribe() {
                    return void 0;
                }
                function removeIpcListener2(channel, handler) {
                    if (typeof ipcRenderer2.removeListener === "function") {
                        ipcRenderer2.removeListener(channel, handler);
                        return;
                    }
                    if (typeof ipcRenderer2.off === "function") {
                        ipcRenderer2.off(channel, handler);
                        return;
                    }
                    if (typeof ipcRenderer2.removeAllListeners === "function") {
                        ipcRenderer2.removeAllListeners(channel);
                    }
                }
                return {
                    createNoopUnsubscribe,
                    createSafeEventHandler: createSafeEventHandler2,
                    createSafeInvokeHandler: createSafeInvokeHandler2,
                    createSafeSendHandler: createSafeSendHandler2,
                    removeIpcListener: removeIpcListener2,
                };
            };
            module2.exports = {
                createPreloadIpcHelpers: createPreloadIpcHelpers2,
            };
        }
    },
});

// preload/logger.js
var require_logger = __commonJS({
    "preload/logger.js"(exports2, module2) {
        "use strict";
        {
            let createPreloadLogger2 = function (consoleRef = console) {
                    return (level, message, ...details) => {
                        if (!isPreloadObjectRecord(consoleRef)) {
                            return;
                        }
                        const methodName = level === "info" ? "log" : level;
                        const method = Reflect.get(consoleRef, methodName);
                        if (typeof method !== "function") {
                            return;
                        }
                        method.call(consoleRef, message, ...details);
                    };
                },
                isPreloadObjectRecord = function (value) {
                    return typeof value === "object" && value !== null;
                };
            module2.exports = {
                createPreloadLogger: createPreloadLogger2,
            };
        }
    },
});

// preload/mainStateApi.js
var require_mainStateApi = __commonJS({
    "preload/mainStateApi.js"(exports2, module2) {
        "use strict";
        {
            let createMainStateApi2 = function ({
                ipcRenderer: ipcRenderer2,
                mainStateBridge: mainStateBridge2,
                preloadLog: preloadLog2,
                validateCallback: validateCallback2,
                validateRequiredNonEmptyString: validateRequiredNonEmptyString2,
            }) {
                async function getErrors(limit = 50) {
                    try {
                        return await ipcRenderer2.invoke(
                            "main-state:errors",
                            limit
                        );
                    } catch (error) {
                        preloadLog2(
                            "error",
                            "[preload.js] Error in getErrors:",
                            error
                        );
                        throw error;
                    }
                }
                async function getMainState(path) {
                    try {
                        return await ipcRenderer2.invoke(
                            "main-state:get",
                            path
                        );
                    } catch (error) {
                        preloadLog2(
                            "error",
                            `[preload.js] Error in getMainState(${path ?? "all"}):`,
                            error
                        );
                        throw error;
                    }
                }
                async function getMetrics() {
                    try {
                        return await ipcRenderer2.invoke("main-state:metrics");
                    } catch (error) {
                        preloadLog2(
                            "error",
                            "[preload.js] Error in getMetrics:",
                            error
                        );
                        throw error;
                    }
                }
                async function getOperation(operationId) {
                    if (
                        !validateRequiredNonEmptyString2(
                            operationId,
                            "operationId",
                            "getOperation"
                        )
                    ) {
                        return null;
                    }
                    try {
                        return await ipcRenderer2.invoke(
                            "main-state:operation",
                            operationId
                        );
                    } catch (error) {
                        preloadLog2(
                            "error",
                            `[preload.js] Error in getOperation(${operationId}):`,
                            error
                        );
                        throw error;
                    }
                }
                async function getOperations() {
                    try {
                        return await ipcRenderer2.invoke(
                            "main-state:operations"
                        );
                    } catch (error) {
                        preloadLog2(
                            "error",
                            "[preload.js] Error in getOperations:",
                            error
                        );
                        throw error;
                    }
                }
                async function listenToMainState(path, callback) {
                    if (
                        !validateRequiredNonEmptyString2(
                            path,
                            "path",
                            "listenToMainState"
                        )
                    ) {
                        return false;
                    }
                    if (!validateCallback2(callback, "listenToMainState")) {
                        return false;
                    }
                    try {
                        return await mainStateBridge2.listenToMainState(
                            path,
                            callback
                        );
                    } catch (error) {
                        preloadLog2(
                            "error",
                            `[preload.js] Error in listenToMainState(${path}):`,
                            error
                        );
                        throw error;
                    }
                }
                async function setMainState(path, value, options = {}) {
                    if (
                        !validateRequiredNonEmptyString2(
                            path,
                            "path",
                            "setMainState"
                        )
                    ) {
                        return false;
                    }
                    try {
                        return await ipcRenderer2.invoke(
                            "main-state:set",
                            path,
                            value,
                            options
                        );
                    } catch (error) {
                        preloadLog2(
                            "error",
                            `[preload.js] Error in setMainState(${path}):`,
                            error
                        );
                        throw error;
                    }
                }
                async function subscribeToMainState(path, callback) {
                    const ok = await listenToMainState(path, callback);
                    if (!ok) {
                        return () => Promise.resolve(false);
                    }
                    return () => unlistenFromMainState(path, callback);
                }
                async function unlistenFromMainState(path, callback) {
                    if (
                        !validateRequiredNonEmptyString2(
                            path,
                            "path",
                            "unlistenFromMainState"
                        )
                    ) {
                        return false;
                    }
                    if (!validateCallback2(callback, "unlistenFromMainState")) {
                        return false;
                    }
                    try {
                        return await mainStateBridge2.unlistenFromMainState(
                            path,
                            callback
                        );
                    } catch (error) {
                        preloadLog2(
                            "error",
                            `[preload.js] Error in unlistenFromMainState(${path}):`,
                            error
                        );
                        throw error;
                    }
                }
                return {
                    getErrors,
                    getMainState,
                    getMetrics,
                    getOperation,
                    getOperations,
                    listenToMainState,
                    setMainState,
                    subscribeToMainState,
                    unlistenFromMainState,
                };
            };
            module2.exports = {
                createMainStateApi: createMainStateApi2,
            };
        }
    },
});

// preload/ipcBridgeCatalog.js
var require_ipcBridgeCatalog = __commonJS({
    "preload/ipcBridgeCatalog.js"(exports2, module2) {
        "use strict";
        {
            let isStringSetMember = function (allowedValues, value) {
                    return (
                        typeof value === "string" && allowedValues.has(value)
                    );
                },
                isAllowedGenericInvokeChannel2 = function (channel) {
                    return isStringSetMember(
                        ALLOWED_GENERIC_INVOKE_CHANNELS,
                        channel
                    );
                },
                isAllowedGenericSendChannel2 = function (channel) {
                    return isStringSetMember(
                        ALLOWED_GENERIC_SEND_CHANNELS,
                        channel
                    );
                },
                isAllowedRendererIpcEventChannel2 = function (channel) {
                    return isStringSetMember(
                        ALLOWED_GENERIC_ON_IPC_CHANNELS,
                        channel
                    );
                },
                isAllowedUpdateEventName2 = function (eventName) {
                    return isStringSetMember(
                        ALLOWED_UPDATE_EVENT_NAMES,
                        eventName
                    );
                };
            const PRELOAD_CHANNELS2 = {
                APP_VERSION: "getAppVersion",
                CHROME_VERSION: "getChromeVersion",
                CLIPBOARD_WRITE_PNG_DATA_URL: "clipboard:writePngDataUrl",
                CLIPBOARD_WRITE_TEXT: "clipboard:writeText",
                DEVTOOLS_INJECT_MENU: "devtools-inject-menu",
                DIALOG_OPEN_FILE: "dialog:openFile",
                DIALOG_OPEN_FOLDER: "dialog:openFolder",
                DIALOG_OPEN_OVERLAY_FILES: "dialog:openOverlayFiles",
                ELECTRON_VERSION: "getElectronVersion",
                FILE_READ: "file:read",
                FIT_BROWSER_GET_FOLDER: "browser:getFolder",
                FIT_BROWSER_IS_ENABLED: "browser:isEnabled",
                FIT_BROWSER_LIST_FOLDER: "browser:listFolder",
                FIT_BROWSER_SET_ENABLED: "browser:setEnabled",
                FIT_BROWSER_SET_FOLDER: "browser:setFolder",
                FIT_DECODE: "fit:decode",
                FIT_PARSE: "fit:parse",
                GYAZO_SERVER_START: "gyazo:server:start",
                GYAZO_SERVER_STOP: "gyazo:server:stop",
                LICENSE_INFO: "getLicenseInfo",
                NODE_VERSION: "getNodeVersion",
                PLATFORM_INFO: "getPlatformInfo",
                RECENT_FILES_ADD: "recentFiles:add",
                RECENT_FILES_APPROVE: "recentFiles:approve",
                RECENT_FILES_GET: "recentFiles:get",
                SHELL_OPEN_EXTERNAL: "shell:openExternal",
                THEME_GET: "theme:get",
            };
            const PRELOAD_EVENTS2 = {
                FIT_FILE_LOADED: "fit-file-loaded",
                INSTALL_UPDATE: "install-update",
                MENU_CHECK_FOR_UPDATES: "menu-check-for-updates",
                MENU_OPEN_FILE: "menu-open-file",
                MENU_OPEN_OVERLAY: "menu-open-overlay",
                OPEN_RECENT_FILE: "open-recent-file",
                OPEN_SUMMARY_COLUMN_SELECTOR: "open-summary-column-selector",
                SET_FULLSCREEN: "set-fullscreen",
                SET_THEME: "set-theme",
                THEME_CHANGED: "theme-changed",
            };
            const ADDITIONAL_GENERIC_INVOKE_CHANNELS = [
                "main-state:errors",
                "main-state:get",
                "main-state:listen",
                "main-state:metrics",
                "main-state:operation",
                "main-state:operations",
                "main-state:set",
                "main-state:unlisten",
            ];
            const GENERIC_SEND_CHANNELS = [
                PRELOAD_EVENTS2.FIT_FILE_LOADED,
                PRELOAD_EVENTS2.INSTALL_UPDATE,
                PRELOAD_EVENTS2.MENU_CHECK_FOR_UPDATES,
                PRELOAD_EVENTS2.SET_FULLSCREEN,
                PRELOAD_EVENTS2.THEME_CHANGED,
                "menu-export",
                "menu-save-as",
            ];
            const EXTRA_RENDERER_ON_IPC_CHANNELS = [
                "decoder-options-changed",
                "export-file",
                "fit-browser-enabled-changed",
                "gyazo-oauth-callback",
                "menu-about",
                "menu-export",
                "menu-keyboard-shortcuts",
                "menu-print",
                "menu-restart-update",
                "menu-save-as",
                "open-accent-color-picker",
                "set-font-size",
                "set-high-contrast",
                "show-notification",
                "unload-fit-file",
            ];
            const UPDATE_EVENT_NAMES = [
                "update-available",
                "update-checking",
                "update-download-progress",
                "update-downloaded",
                "update-error",
                "update-not-available",
            ];
            const ALLOWED_GENERIC_INVOKE_CHANNELS = /* @__PURE__ */ new Set([
                ...ADDITIONAL_GENERIC_INVOKE_CHANNELS,
                ...Object.values(PRELOAD_CHANNELS2),
            ]);
            const ALLOWED_GENERIC_SEND_CHANNELS = new Set(
                GENERIC_SEND_CHANNELS
            );
            const ALLOWED_GENERIC_ON_IPC_CHANNELS = /* @__PURE__ */ new Set([
                ...EXTRA_RENDERER_ON_IPC_CHANNELS,
                ...Object.values(PRELOAD_EVENTS2),
                ...UPDATE_EVENT_NAMES,
            ]);
            const ALLOWED_UPDATE_EVENT_NAMES = new Set(UPDATE_EVENT_NAMES);
            module2.exports = {
                PRELOAD_CHANNELS: PRELOAD_CHANNELS2,
                PRELOAD_EVENTS: PRELOAD_EVENTS2,
                isAllowedGenericInvokeChannel: isAllowedGenericInvokeChannel2,
                isAllowedGenericSendChannel: isAllowedGenericSendChannel2,
                isAllowedRendererIpcEventChannel:
                    isAllowedRendererIpcEventChannel2,
                isAllowedUpdateEventName: isAllowedUpdateEventName2,
            };
        }
    },
});

// preload.ts
var preloadRequire = require;
var { createApiDiagnostics } = require_apiDiagnostics();
var { registerPreloadBeforeExitHandler } = require_beforeExitHandler();
var { createClipboardBridge } = require_clipboardBridge();
var { createDevtoolsMenuApi } = require_devtoolsMenuApi();
var { createPreloadValidators } = require_validators();
var { isPreloadDevelopmentMode, shouldEnforceGenericIpcAllowlist } =
    require_environment();
var { createGenericIpcApi } = require_genericIpcApi();
var { resolvePreloadElectronBridge } = require_electronBridge();
var { createMainStateBridge } = require_mainStateBridge();
var { createPreloadIpcHelpers } = require_ipcHelpers();
var { createPreloadLogger } = require_logger();
var { createMainStateApi } = require_mainStateApi();
var ipcBridgeCatalog = require_ipcBridgeCatalog();
var {
    isAllowedGenericInvokeChannel,
    isAllowedGenericSendChannel,
    isAllowedRendererIpcEventChannel,
    isAllowedUpdateEventName,
    PRELOAD_CHANNELS,
    PRELOAD_EVENTS,
} = ipcBridgeCatalog;
var CONSTANTS = {
    CHANNELS: PRELOAD_CHANNELS,
    DEFAULT_VALUES: {
        FIT_FILE_PATH: null,
        THEME: null,
    },
    EVENTS: PRELOAD_EVENTS,
};
var DEVELOPMENT_TOOLS_GLOBAL_NAME = ["dev", "Tools"].join("");
var { contextBridge, ipcRenderer } = resolvePreloadElectronBridge({
    globalScope: getPreloadGlobal(),
    requireModule: preloadRequire,
});
var preloadLog = createPreloadLogger(console);
var {
    validateCallback,
    validateChannelName,
    validateOptionalNonEmptyString,
    validateRequiredNonEmptyString,
} = createPreloadValidators(preloadLog);
function getPreloadGlobal() {
    return globalThis;
}
function isDevelopmentMode() {
    return isPreloadDevelopmentMode(process);
}
var {
    createSafeEventHandler,
    createSafeInvokeHandler,
    createSafeSendHandler,
    removeIpcListener,
} = createPreloadIpcHelpers({
    ipcRenderer,
    preloadLog,
    validateCallback,
});
var SHOULD_ENFORCE_GENERIC_IPC_ALLOWLIST =
    typeof process !== "undefined" && shouldEnforceGenericIpcAllowlist(process);
var mainStateBridge = createMainStateBridge({
    ipcRenderer,
    preloadLog,
    removeIpcListener,
});
var clipboardBridge = createClipboardBridge({
    channels: CONSTANTS.CHANNELS,
    ipcRenderer,
    preloadLog,
});
var devtoolsMenuApi = createDevtoolsMenuApi({
    defaultFitFilePath: CONSTANTS.DEFAULT_VALUES.FIT_FILE_PATH,
    defaultTheme: CONSTANTS.DEFAULT_VALUES.THEME,
    devtoolsInjectMenuChannel: CONSTANTS.CHANNELS.DEVTOOLS_INJECT_MENU,
    ipcRenderer,
    preloadLog,
    validateOptionalNonEmptyString,
});
var apiDiagnostics = createApiDiagnostics({
    channels: CONSTANTS.CHANNELS,
    contextBridge,
    events: CONSTANTS.EVENTS,
    ipcRenderer,
    isDevelopmentMode,
    preloadLog,
});
var mainStateApi = createMainStateApi({
    ipcRenderer,
    mainStateBridge,
    preloadLog,
    validateCallback,
    validateRequiredNonEmptyString,
});
var genericIpcApi = createGenericIpcApi({
    fitFileLoadedChannel: CONSTANTS.EVENTS.FIT_FILE_LOADED,
    ipcRenderer,
    isAllowedGenericInvokeChannel,
    isAllowedGenericSendChannel,
    isAllowedRendererIpcEventChannel,
    isAllowedUpdateEventName,
    preloadLog,
    removeIpcListener,
    shouldEnforceGenericIpcAllowlist: SHOULD_ENFORCE_GENERIC_IPC_ALLOWLIST,
    validateCallback,
    validateChannelName,
});
var electronAPI = {
    /**
     * Adds a file to the recent files list.
     *
     * @param {string} filePath
     *
     * @returns {Promise<string[]>}
     */
    addRecentFile: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.RECENT_FILES_ADD,
        "addRecentFile"
    ),
    /**
     * Approve a recent file path for subsequent readFile() calls.
     *
     * Security model:
     *
     * - The main process will only approve paths that already exist in its
     *   persisted recent-files list.
     * - This avoids granting broad file read access as a side effect of
     *   recentFiles().
     *
     * @param {string} filePath
     *
     * @returns {Promise<boolean>}
     */
    approveRecentFile: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.RECENT_FILES_APPROVE,
        "approveRecentFile"
    ),
    /**
     * Trigger a check for updates (menu or manual).
     */
    checkForUpdates: createSafeSendHandler(
        CONSTANTS.EVENTS.MENU_CHECK_FOR_UPDATES,
        "checkForUpdates"
    ),
    /**
     * Decodes a FIT file from an ArrayBuffer and returns the parsed data.
     *
     * @param {ArrayBuffer} arrayBuffer
     *
     * @returns {Promise<import("./shared/fit").FitDecodeResult>}
     */
    decodeFitFile: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.FIT_DECODE,
        "decodeFitFile"
    ),
    // Application Information
    /**
     * Gets the app version from the main process.
     *
     * @returns {Promise<string>}
     */
    getAppVersion: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.APP_VERSION,
        "getAppVersion"
    ),
    // Development and Debugging Helpers
    /**
     * Get information about available IPC channels for debugging.
     *
     * @returns {Object} Object containing channel information
     */
    /** @returns {ChannelInfo} */
    getChannelInfo: apiDiagnostics.getChannelInfo,
    /**
     * Gets the Chrome version.
     *
     * @returns {Promise<string>}
     */
    getChromeVersion: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.CHROME_VERSION,
        "getChromeVersion"
    ),
    /**
     * Gets the Electron version.
     *
     * @returns {Promise<string>}
     */
    getElectronVersion: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.ELECTRON_VERSION,
        "getElectronVersion"
    ),
    /**
     * Gets recent errors from the main process.
     *
     * @param {number} [limit=50] - Maximum number of errors to retrieve.
     *   Default is `50`
     *
     * @returns {Promise<Array>} Array of recent errors
     */
    getErrors: mainStateApi.getErrors,
    /**
     * Gets the persisted FIT browser folder (main process setting).
     *
     * @returns {Promise<string | null>}
     */
    getFitBrowserFolder: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.FIT_BROWSER_GET_FOLDER,
        "getFitBrowserFolder"
    ),
    /**
     * Gets the license info from the main process.
     *
     * @returns {Promise<string>}
     */
    getLicenseInfo: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.LICENSE_INFO,
        "getLicenseInfo"
    ),
    // Main Process State Management Functions
    /**
     * Gets a value from the main process state.
     *
     * @param {string} [path] - Optional path to a specific state property
     *   (e.g., 'loadedFitFilePath')
     *
     * @returns {Promise<IpcSerializable>} The requested state value or entire
     *   state if no path provided
     */
    getMainState: mainStateApi.getMainState,
    /**
     * Gets performance metrics from the main process.
     *
     * @returns {Promise<Object>} Object containing performance metrics
     */
    getMetrics: mainStateApi.getMetrics,
    /**
     * Gets the Node.js version.
     *
     * @returns {Promise<string>}
     */
    getNodeVersion: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.NODE_VERSION,
        "getNodeVersion"
    ),
    /**
     * Gets the status of a specific operation from the main process.
     *
     * @param {string} operationId - The unique identifier for the operation
     *
     * @returns {Promise<IpcSerializable | null>} The operation status object
     */
    getOperation: mainStateApi.getOperation,
    /**
     * Gets all operations from the main process.
     *
     * @returns {Promise<Object>} Object containing all operations
     */
    getOperations: mainStateApi.getOperations,
    getPlatformInfo: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.PLATFORM_INFO,
        "getPlatformInfo"
    ),
    // Theme Management
    /**
     * Gets the current theme from the main process.
     *
     * @returns {Promise<string>}
     */
    getTheme: createSafeInvokeHandler(CONSTANTS.CHANNELS.THEME_GET, "getTheme"),
    // Development Tools
    /**
     * Manually inject/reset the menu from the renderer (DevTools or app code).
     *
     * @param {string | null} theme - Current theme
     * @param {string | null} fitFilePath - Current FIT file path
     *
     * @returns {Promise<boolean>}
     */
    injectMenu: devtoolsMenuApi.injectMenu,
    /**
     * Trigger install of a downloaded update.
     */
    installUpdate: createSafeSendHandler(
        CONSTANTS.EVENTS.INSTALL_UPDATE,
        "installUpdate"
    ),
    /**
     * Expose ipcRenderer.invoke for direct use with error handling.
     *
     * @param {GenericInvokeChannel} channel - The IPC channel to invoke
     * @param {...IpcRequestPayload} args - Arguments to send
     *
     * @returns {Promise<IpcResponsePayload>}
     */
    invoke: genericIpcApi.invoke,
    /**
     * Whether the experimental Browser tab is enabled.
     *
     * @returns {Promise<boolean>}
     */
    isFitBrowserEnabled: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.FIT_BROWSER_IS_ENABLED,
        "isFitBrowserEnabled"
    ),
    /**
     * Listens for changes to a specific path in the main process state.
     *
     * @param {string} path - Path to listen to (e.g., 'loadedFitFilePath')
     * @param {Function} callback - Callback function to handle state changes
     *
     * @returns {Promise<boolean>} True if listener was registered successfully
     */
    listenToMainState: mainStateApi.listenToMainState,
    /**
     * Lists the current directory under the persisted FIT browser folder.
     *
     * @param {string} [relPath]
     *
     * @returns {Promise<IpcSerializable>}
     */
    listFitBrowserFolder: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.FIT_BROWSER_LIST_FOLDER,
        "listFitBrowserFolder"
    ),
    /**
     * Notify the main process that a file has been loaded (or unloaded).
     *
     * This is the preferred alternative to calling
     * electronAPI.send("fit-file-loaded", ...) because it is explicit and
     * easier to lock down.
     *
     * @param {string | null} filePath
     */
    notifyFitFileLoaded: genericIpcApi.notifyFitFileLoaded,
    // Generic IPC Functions with enhanced validation
    /**
     * Registers a generic handler for any IPC event (for internal use).
     *
     * @param {string} channel - The IPC channel to listen on
     * @param {Function} callback - Callback function to handle the event
     *
     * @returns {(() => void) | undefined} Unsubscribe function when
     *   registration succeeds
     */
    onIpc: genericIpcApi.onIpc,
    // Event Handlers with enhanced error handling
    /**
     * Registers a handler for the 'menu-open-file' event.
     *
     * @param {Function} callback
     */
    onMenuOpenFile: createSafeEventHandler(
        CONSTANTS.EVENTS.MENU_OPEN_FILE,
        "onMenuOpenFile"
    ),
    /**
     * Registers a handler for the 'menu-open-overlay' event.
     *
     * @param {Function} callback
     */
    onMenuOpenOverlay: createSafeEventHandler(
        CONSTANTS.EVENTS.MENU_OPEN_OVERLAY,
        "onMenuOpenOverlay"
    ),
    /**
     * Registers a handler for the 'open-recent-file' event.
     *
     * @param {Function} callback
     */
    onOpenRecentFile: createSafeEventHandler(
        CONSTANTS.EVENTS.OPEN_RECENT_FILE,
        "onOpenRecentFile",
        (filePath) => filePath
        // Transform to extract just the filePath
    ),
    /**
     * Registers a handler for the 'open-summary-column-selector' event.
     *
     * @param {Function} callback
     */
    onOpenSummaryColumnSelector: createSafeEventHandler(
        CONSTANTS.EVENTS.OPEN_SUMMARY_COLUMN_SELECTOR,
        "onOpenSummaryColumnSelector"
    ),
    /**
     * Registers a handler for the 'set-theme' event.
     *
     * @param {Function} callback
     */
    onSetTheme: createSafeEventHandler(
        CONSTANTS.EVENTS.SET_THEME,
        "onSetTheme",
        (theme) => theme
        // Transform to extract just the theme
    ),
    // Auto-Updater Functions with enhanced error handling
    /**
     * Listen for update events from the main process (auto-updater).
     *
     * @param {string} eventName - The update event name to listen for
     * @param {Function} callback - Callback function to handle the event
     */
    onUpdateEvent: genericIpcApi.onUpdateEvent,
    /**
     * Opens a URL in the user's default external browser.
     *
     * @param {string} url - The URL to open (must be HTTP or HTTPS)
     *
     * @returns {Promise<boolean>}
     */
    openExternal: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.SHELL_OPEN_EXTERNAL,
        "openExternal"
    ),
    // File Operations
    /**
     * Opens a file dialog and returns the selected file path. Returns null when
     * the user cancels.
     *
     * @returns {Promise<string | null>}
     */
    openFile: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.DIALOG_OPEN_FILE,
        "openFile"
    ),
    /**
     * Alias for openFile. Returns null when the user cancels.
     *
     * @returns {Promise<string | null>}
     */
    openFileDialog: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.DIALOG_OPEN_FILE,
        "openFileDialog"
    ),
    /**
     * Opens a folder picker dialog and returns the selected folder path.
     * Returns null when the user cancels.
     *
     * @returns {Promise<string | null>}
     */
    openFolderDialog: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.DIALOG_OPEN_FOLDER,
        "openFolderDialog"
    ),
    /**
     * Opens the overlay file dialog with multi-selection support.
     *
     * @returns {Promise<string[]>}
     */
    openOverlayDialog: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.DIALOG_OPEN_OVERLAY_FILES,
        "openOverlayDialog"
    ),
    // FIT File Operations
    /**
     * Parses a FIT file from an ArrayBuffer and returns the decoded data.
     *
     * @param {ArrayBuffer} arrayBuffer
     *
     * @returns {Promise<import("./shared/fit").FitDecodeResult>}
     */
    parseFitFile: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.FIT_PARSE,
        "parseFitFile"
    ),
    /**
     * Reads a file from the given file path and returns its contents as an
     * ArrayBuffer.
     *
     * @param {string} filePath
     *
     * @returns {Promise<ArrayBuffer>}
     */
    readFile: createSafeInvokeHandler(CONSTANTS.CHANNELS.FILE_READ, "readFile"),
    // Recent Files Management
    /**
     * Gets the list of recent files.
     *
     * @returns {Promise<string[]>}
     */
    recentFiles: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.RECENT_FILES_GET,
        "recentFiles"
    ),
    /**
     * Send an IPC message to the main process.
     *
     * @param {GenericSendChannel} channel - The IPC channel to send on
     * @param {...IpcRequestPayload} args - Arguments to send
     */
    send: genericIpcApi.send,
    /**
     * Sends a 'theme-changed' event to the main process.
     *
     * @param {string} theme
     */
    sendThemeChanged: createSafeSendHandler(
        CONSTANTS.EVENTS.THEME_CHANGED,
        "sendThemeChanged"
    ),
    /**
     * Enable/disable the experimental Browser tab.
     *
     * @param {boolean} enabled
     *
     * @returns {Promise<boolean>}
     */
    setFitBrowserEnabled: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.FIT_BROWSER_SET_ENABLED,
        "setFitBrowserEnabled"
    ),
    /**
     * Persist the Browser root folder.
     *
     * @param {string} folderPath
     *
     * @returns {Promise<boolean>}
     */
    setFitBrowserFolder: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.FIT_BROWSER_SET_FOLDER,
        "setFitBrowserFolder"
    ),
    /**
     * Sets the full screen mode.
     *
     * @param {boolean} flag - Whether to enable fullscreen
     */
    setFullScreen: createSafeSendHandler(
        CONSTANTS.EVENTS.SET_FULLSCREEN,
        "setFullScreen"
    ),
    /**
     * Sets a value in the main process state (restricted to allowed paths).
     *
     * @param {string} path - Path to the state property to set (e.g.,
     *   'loadedFitFilePath')
     * @param {import("./shared/ipc").MainStateSetValue} value - The value to
     *   set
     * @param {import("./shared/ipc").MainStateSetOptions} [options] - Optional
     *   metadata for the state change
     *
     * @returns {Promise<boolean>} True if successful, false if path is
     *   restricted
     */
    setMainState: mainStateApi.setMainState,
    // Gyazo OAuth Server Functions
    /**
     * Starts a temporary local server for Gyazo OAuth callback handling.
     *
     * @param {number} port - The port to start the server on (default: 3000)
     *
     * @returns {Promise<{
     *     success: boolean;
     *     port: number;
     *     message?: string;
     * }>}
     */
    startGyazoServer: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.GYAZO_SERVER_START,
        "startGyazoServer"
    ),
    /**
     * Stops the temporary Gyazo OAuth callback server.
     *
     * @returns {Promise<{ success: boolean; message?: string }>}
     */
    stopGyazoServer: createSafeInvokeHandler(
        CONSTANTS.CHANNELS.GYAZO_SERVER_STOP,
        "stopGyazoServer"
    ),
    /**
     * Subscribe to main state changes and get an unsubscribe function.
     *
     * @param {string} path
     * @param {Function} callback
     *
     * @returns {Promise<() => Promise<boolean>>}
     */
    subscribeToMainState: mainStateApi.subscribeToMainState,
    /**
     * Removes a previously registered main state listener.
     *
     * @param {string} path
     * @param {Function} callback
     *
     * @returns {Promise<boolean>}
     */
    unlistenFromMainState: mainStateApi.unlistenFromMainState,
    /**
     * Validate the preload API is working correctly.
     *
     * @returns {boolean} True if API is functional
     */
    validateAPI: apiDiagnostics.validateAPI,
    /**
     * Write a PNG image to the system clipboard.
     *
     * The renderer commonly produces chart images as data URLs. Using
     * Electron's clipboard avoids Chromium permission issues for
     * navigator.clipboard.
     *
     * @param {string} pngDataUrl
     *
     * @returns {Promise<boolean>} True if the write succeeded
     */
    writeClipboardPngDataUrl: clipboardBridge.writeClipboardPngDataUrl,
    /**
     * Write text to the system clipboard using Electron's clipboard module.
     * This avoids browser Clipboard API permission issues in file:// contexts.
     *
     * Important: the renderer is sandboxed (sandbox: true). Clipboard writes
     * are executed in the main process via IPC.
     *
     * @param {string} text
     *
     * @returns {Promise<boolean>} True if the write succeeded
     */
    writeClipboardText: clipboardBridge.writeClipboardText,
};
try {
    if (electronAPI.validateAPI()) {
        const exposeInMainWorld = contextBridge?.exposeInMainWorld;
        if (typeof exposeInMainWorld !== "function") {
            throw new TypeError("contextBridge unavailable");
        }
        exposeInMainWorld("electronAPI", electronAPI);
        if (isDevelopmentMode()) {
            preloadLog(
                "info",
                "[preload.js] Successfully exposed electronAPI to main world"
            );
            const apiKeys = Object.keys(electronAPI),
                apiRecord = electronAPI,
                methods = apiKeys.filter(
                    (key) => typeof apiRecord[key] === "function"
                ),
                properties = apiKeys.filter(
                    (key) => typeof apiRecord[key] !== "function"
                );
            preloadLog("info", "[preload.js] API Structure:", {
                methods,
                properties,
                total: apiKeys.length,
            });
        }
    } else {
        preloadLog(
            "error",
            "[preload.js] API validation failed - not exposing to main world"
        );
    }
} catch (error) {
    preloadLog("error", "[preload.js] Failed to expose electronAPI:", error);
}
if (isDevelopmentMode()) {
    try {
        if (
            contextBridge &&
            typeof contextBridge.exposeInMainWorld === "function"
        ) {
            contextBridge.exposeInMainWorld(DEVELOPMENT_TOOLS_GLOBAL_NAME, {
                /**
                 * Get preload script information for debugging
                 */
                getPreloadInfo: () => ({
                    apiMethods: Object.keys(electronAPI),
                    constants: CONSTANTS,
                    timestamp: /* @__PURE__ */ new Date().toISOString(),
                    version: "1.0.0",
                }),
                /**
                 * Log current API state
                 */
                logAPIState: () => {
                    preloadLog("info", "[preload.js] Current API State:", {
                        constants: CONSTANTS,
                        electronAPI: typeof electronAPI,
                        methodCount: Object.keys(electronAPI).length,
                        timestamp: /* @__PURE__ */ new Date().toISOString(),
                    });
                },
                /**
                 * Test IPC communication
                 */
                testIPC: async () => {
                    try {
                        const version = await electronAPI.getAppVersion();
                        preloadLog(
                            "info",
                            "[preload.js] IPC test successful, app version:",
                            version
                        );
                        return true;
                    } catch (error) {
                        preloadLog(
                            "error",
                            "[preload.js] IPC test failed:",
                            error
                        );
                        return false;
                    }
                },
            });
            preloadLog("info", "[preload.js] Development tools exposed");
        } else {
            throw new Error("contextBridge unavailable");
        }
    } catch (error) {
        preloadLog(
            "error",
            "[preload.js] Failed to expose development tools:",
            error
        );
    }
}
registerPreloadBeforeExitHandler({
    globalScope: globalThis,
    isDevelopmentMode,
    preloadLog,
    processRef: process,
});
if (isDevelopmentMode()) {
    preloadLog("info", "[preload.js] Preload script initialized successfully");
}
