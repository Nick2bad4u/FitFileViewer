import { createPreloadRuntime } from "./preloadRuntime.js";
import { getDefaultPreloadRuntimeEnvironment } from "./preloadRuntimeEnvironment.js";

type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
type PreloadElectronBridge =
    import("./preloadModuleTypes").PreloadElectronBridge;

interface PreloadRuntimeEnvironment {
    consoleRef: Console;
    processRef: NodeJS.Process;
}

interface StartPreloadScriptOptions {
    consoleRef?: Console;
    electronBridgeOverride?: null | PreloadElectronBridge;
    processRef?: NodeJS.Process;
}

interface ResolvePreloadRuntimeEnvironmentOptions {
    consoleRef: Console | undefined;
    processRef: NodeJS.Process | undefined;
}

export function startPreloadScript({
    consoleRef,
    electronBridgeOverride,
    processRef,
}: StartPreloadScriptOptions): ElectronAPI {
    const runtimeEnvironment = resolvePreloadRuntimeEnvironment({
        consoleRef,
        processRef,
    });
    const runtime = createPreloadRuntime();
    const { consoleRef: resolvedConsoleRef, processRef: resolvedProcessRef } =
        runtimeEnvironment;
    const {
        assemblePreloadApi,
        constants,
        createElectronApi,
        modules: preloadModules,
    } = runtime;
    const {
        createPreloadLogger,
        exposeDevelopmentToolsGlobal,
        exposeElectronApi,
        isPreloadDevelopmentMode,
        registerPreloadBeforeExitHandler,
        resolvePreloadElectronBridge,
    } = preloadModules;
    const { contextBridge, ipcRenderer } = resolvePreloadElectronBridge({
        ...(electronBridgeOverride === undefined
            ? {}
            : { electronBridgeOverride }),
    });
    const preloadLog = createPreloadLogger(resolvedConsoleRef);
    const isDevelopmentMode = () =>
        isPreloadDevelopmentMode(resolvedProcessRef);
    const electronAPI = assemblePreloadApi({
        constants,
        contextBridge,
        createElectronApi,
        ipcRenderer,
        modules: preloadModules,
        preloadLog,
        processRef: resolvedProcessRef,
    });

    exposeElectronApi({
        api: electronAPI,
        contextBridge,
        isDevelopmentMode,
        preloadLog,
    });

    exposeDevelopmentToolsGlobal({
        api: electronAPI,
        constants,
        contextBridge,
        isDevelopmentMode,
        preloadLog,
    });

    registerPreloadBeforeExitHandler({
        isDevelopmentMode,
        preloadLog,
        processRef: resolvedProcessRef,
    });

    if (isDevelopmentMode()) {
        preloadLog(
            "info",
            "[preload.js] Preload script initialized successfully"
        );
    }

    return electronAPI;
}

function resolvePreloadRuntimeEnvironment({
    consoleRef,
    processRef,
}: ResolvePreloadRuntimeEnvironmentOptions): PreloadRuntimeEnvironment {
    const defaults = getDefaultPreloadRuntimeEnvironment();

    return {
        consoleRef: consoleRef ?? defaults.consoleRef,
        processRef: processRef ?? defaults.processRef,
    };
}
