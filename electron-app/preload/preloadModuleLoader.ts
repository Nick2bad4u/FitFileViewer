{
    type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
    type MainStateChange = import("../shared/ipc").MainStateChange;
    type PreloadLog = (
        level: "error" | "info" | "warn",
        message: string,
        ...details: unknown[]
    ) => void;

    interface PreloadContextBridge {
        exposeInMainWorld?: (key: string, api: unknown) => void;
    }

    interface PreloadIpcRenderer {
        invoke?: (channel: string, ...args: unknown[]) => Promise<unknown>;
        off?: (
            channel: string,
            listener: (event: object, ...args: unknown[]) => void
        ) => void;
        on?: (
            channel: string,
            listener: (event: object, ...args: unknown[]) => void
        ) => void;
        removeAllListeners?: (channel: string) => void;
        removeListener?: (
            channel: string,
            listener: (event: object, ...args: unknown[]) => void
        ) => void;
        send?: (channel: string, ...args: unknown[]) => void;
    }

    type PreloadModuleRequire = (moduleId: string) => unknown;

    interface PreloadModuleRegistry {
        createApiDiagnostics: (
            options: Record<string, unknown>
        ) => Pick<ElectronAPI, "getChannelInfo" | "validateAPI">;
        createAppInfoApi: (
            options: Record<string, unknown>
        ) => Pick<
            ElectronAPI,
            | "getAppVersion"
            | "getChromeVersion"
            | "getElectronVersion"
            | "getLicenseInfo"
            | "getNodeVersion"
            | "getPlatformInfo"
        >;
        createClipboardBridge: (
            options: Record<string, unknown>
        ) => Pick<
            ElectronAPI,
            "writeClipboardPngDataUrl" | "writeClipboardText"
        >;
        createDevtoolsMenuApi: (
            options: Record<string, unknown>
        ) => Pick<ElectronAPI, "injectMenu">;
        createExternalApi: (
            options: Record<string, unknown>
        ) => Pick<
            ElectronAPI,
            | "onGyazoOAuthCallback"
            | "openExternal"
            | "startGyazoServer"
            | "stopGyazoServer"
        >;
        createFileApi: (
            options: Record<string, unknown>
        ) => Pick<
            ElectronAPI,
            | "addRecentFile"
            | "approveRecentFile"
            | "decodeFitFile"
            | "openFile"
            | "openFileDialog"
            | "openOverlayDialog"
            | "parseFitFile"
            | "readFile"
            | "recentFiles"
        >;
        createFitBrowserApi: (
            options: Record<string, unknown>
        ) => Pick<
            ElectronAPI,
            | "getFitBrowserFolder"
            | "isFitBrowserEnabled"
            | "listFitBrowserFolder"
            | "onFitBrowserEnabledChanged"
            | "setFitBrowserEnabled"
            | "setFitBrowserFolder"
        >;
        createGenericIpcApi: (
            options: Record<string, unknown>
        ) => Pick<
            ElectronAPI,
            | "invoke"
            | "notifyFitFileLoaded"
            | "onIpc"
            | "onUpdateEvent"
            | "send"
        >;
        createMainStateApi: (
            options: Record<string, unknown>
        ) => Pick<
            ElectronAPI,
            | "getErrors"
            | "getMainState"
            | "getMetrics"
            | "getOperation"
            | "getOperations"
            | "listenToMainState"
            | "setMainState"
            | "subscribeToMainState"
            | "unlistenFromMainState"
        >;
        createMainStateBridge: (options: Record<string, unknown>) => {
            listenToMainState: (
                path: string,
                callback: (change: MainStateChange) => void
            ) => Promise<boolean>;
            unlistenFromMainState: (
                path: string,
                callback: (change: MainStateChange) => void
            ) => Promise<boolean>;
        };
        createMenuEventApi: (
            options: Record<string, unknown>
        ) => Pick<
            ElectronAPI,
            | "checkForUpdates"
            | "installUpdate"
            | "onDecoderOptionsChanged"
            | "onExportFile"
            | "onMenuAbout"
            | "onMenuCheckForUpdates"
            | "onMenuExport"
            | "onMenuKeyboardShortcuts"
            | "onMenuOpenFile"
            | "onMenuOpenOverlay"
            | "onMenuPrint"
            | "onMenuRestartUpdate"
            | "onMenuSaveAs"
            | "onOpenAccentColorPicker"
            | "onOpenRecentFile"
            | "onOpenSummaryColumnSelector"
            | "onSetFontSize"
            | "onSetHighContrast"
            | "onSetTheme"
            | "onShowNotification"
            | "onUnloadFitFile"
            | "requestExport"
            | "requestSaveAs"
            | "sendThemeChanged"
            | "setFullScreen"
        >;
        createPreloadIpcHelpers: (options: Record<string, unknown>) => {
            createSafeEventHandler: (
                channel: string,
                methodName: string,
                transform?: (...args: unknown[]) => unknown
            ) => (callback: unknown) => () => void;
            createSafeInvokeHandler: (
                channel: string,
                methodName: string
            ) => (...args: unknown[]) => Promise<unknown>;
            createSafeSendHandler: (
                channel: string,
                methodName: string
            ) => (...args: unknown[]) => void;
            removeIpcListener: (
                channel: string,
                handler: (event: object, ...args: unknown[]) => void
            ) => void;
        };
        createPreloadLogger: (consoleRef?: Console) => PreloadLog;
        createPreloadValidators: (preloadLog: PreloadLog) => {
            validateCallback: (
                callback: unknown,
                methodName: string
            ) => callback is (...args: unknown[]) => unknown;
            validateChannelName: (
                value: unknown,
                paramName: string,
                methodName: string
            ) => value is string;
            validateOptionalNonEmptyString: (
                value: unknown,
                paramName: string,
                methodName: string
            ) => null | string | undefined;
            validateRequiredNonEmptyString: (
                value: unknown,
                paramName: string,
                methodName: string
            ) => value is string;
        };
        createThemeApi: (
            options: Record<string, unknown>
        ) => Pick<ElectronAPI, "getTheme">;
        exposeDevelopmentToolsGlobal: (
            options: Record<string, unknown>
        ) => boolean;
        exposeElectronApi: (options: Record<string, unknown>) => boolean;
        ipcBridgeCatalog: {
            PRELOAD_CHANNELS: Record<string, string>;
            PRELOAD_EVENTS: Record<string, string>;
            isAllowedGenericInvokeChannel: (channel: unknown) => boolean;
            isAllowedGenericSendChannel: (channel: unknown) => boolean;
            isAllowedRendererIpcEventChannel: (channel: unknown) => boolean;
            isAllowedUpdateEventName: (eventName: unknown) => boolean;
        };
        isPreloadDevelopmentMode: (processRef?: NodeJS.Process) => boolean;
        registerPreloadBeforeExitHandler: (
            options: Record<string, unknown>
        ) => void;
        resolvePreloadElectronBridge: (options: {
            globalScope?: object;
            requireModule: PreloadModuleRequire;
        }) => {
            contextBridge: null | PreloadContextBridge | undefined;
            ipcRenderer: null | PreloadIpcRenderer | undefined;
        };
        shouldAllowGenericIpcBridge: (processRef?: NodeJS.Process) => boolean;
        shouldEnforceGenericIpcAllowlist: (
            processRef?: NodeJS.Process
        ) => boolean;
    }

    function loadPreloadModules(): PreloadModuleRegistry {
        const { createApiDiagnostics } = require("./apiDiagnostics.js") as {
            createApiDiagnostics: PreloadModuleRegistry["createApiDiagnostics"];
        };
        const { createAppInfoApi } = require("./appInfoApi.js") as {
            createAppInfoApi: PreloadModuleRegistry["createAppInfoApi"];
        };
        const { registerPreloadBeforeExitHandler } =
            require("./beforeExitHandler.js") as {
                registerPreloadBeforeExitHandler: PreloadModuleRegistry["registerPreloadBeforeExitHandler"];
            };
        const { createClipboardBridge } = require("./clipboardBridge.js") as {
            createClipboardBridge: PreloadModuleRegistry["createClipboardBridge"];
        };
        const { createDevtoolsMenuApi } = require("./devtoolsMenuApi.js") as {
            createDevtoolsMenuApi: PreloadModuleRegistry["createDevtoolsMenuApi"];
        };
        const { exposeDevelopmentToolsGlobal } =
            require("./developmentToolsGlobal.js") as {
                exposeDevelopmentToolsGlobal: PreloadModuleRegistry["exposeDevelopmentToolsGlobal"];
            };
        const { createFitBrowserApi } = require("./fitBrowserApi.js") as {
            createFitBrowserApi: PreloadModuleRegistry["createFitBrowserApi"];
        };
        const { createFileApi } = require("./fileApi.js") as {
            createFileApi: PreloadModuleRegistry["createFileApi"];
        };
        const { createExternalApi } = require("./externalApi.js") as {
            createExternalApi: PreloadModuleRegistry["createExternalApi"];
        };
        const { createMenuEventApi } = require("./menuEventApi.js") as {
            createMenuEventApi: PreloadModuleRegistry["createMenuEventApi"];
        };
        const { createThemeApi } = require("./themeApi.js") as {
            createThemeApi: PreloadModuleRegistry["createThemeApi"];
        };
        const { createPreloadValidators } = require("./validators.js") as {
            createPreloadValidators: PreloadModuleRegistry["createPreloadValidators"];
        };
        const {
            isPreloadDevelopmentMode,
            shouldAllowGenericIpcBridge,
            shouldEnforceGenericIpcAllowlist,
        } = require("./environment.js") as {
            isPreloadDevelopmentMode: PreloadModuleRegistry["isPreloadDevelopmentMode"];
            shouldAllowGenericIpcBridge: PreloadModuleRegistry["shouldAllowGenericIpcBridge"];
            shouldEnforceGenericIpcAllowlist: PreloadModuleRegistry["shouldEnforceGenericIpcAllowlist"];
        };
        const { createGenericIpcApi } = require("./genericIpcApi.js") as {
            createGenericIpcApi: PreloadModuleRegistry["createGenericIpcApi"];
        };
        const { resolvePreloadElectronBridge } =
            require("./electronBridge.js") as {
                resolvePreloadElectronBridge: PreloadModuleRegistry["resolvePreloadElectronBridge"];
            };
        const { exposeElectronApi } = require("./electronApiExposure.js") as {
            exposeElectronApi: PreloadModuleRegistry["exposeElectronApi"];
        };
        const { createMainStateBridge } = require("./mainStateBridge.js") as {
            createMainStateBridge: PreloadModuleRegistry["createMainStateBridge"];
        };
        const { createPreloadIpcHelpers } = require("./ipcHelpers.js") as {
            createPreloadIpcHelpers: PreloadModuleRegistry["createPreloadIpcHelpers"];
        };
        const { createPreloadLogger } = require("./logger.js") as {
            createPreloadLogger: PreloadModuleRegistry["createPreloadLogger"];
        };
        const { createMainStateApi } = require("./mainStateApi.js") as {
            createMainStateApi: PreloadModuleRegistry["createMainStateApi"];
        };
        const ipcBridgeCatalog =
            require("./ipcBridgeCatalog.js") as PreloadModuleRegistry["ipcBridgeCatalog"];

        return {
            createApiDiagnostics,
            createAppInfoApi,
            createClipboardBridge,
            createDevtoolsMenuApi,
            createExternalApi,
            createFileApi,
            createFitBrowserApi,
            createGenericIpcApi,
            createMainStateApi,
            createMainStateBridge,
            createMenuEventApi,
            createPreloadIpcHelpers,
            createPreloadLogger,
            createPreloadValidators,
            createThemeApi,
            exposeDevelopmentToolsGlobal,
            exposeElectronApi,
            ipcBridgeCatalog,
            isPreloadDevelopmentMode,
            registerPreloadBeforeExitHandler,
            resolvePreloadElectronBridge,
            shouldAllowGenericIpcBridge,
            shouldEnforceGenericIpcAllowlist,
        };
    }

    module.exports = {
        loadPreloadModules,
    };
}
