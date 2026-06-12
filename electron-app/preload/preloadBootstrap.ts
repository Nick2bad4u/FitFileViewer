type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
type PreloadElectronBridge =
    import("./preloadModuleTypes").PreloadElectronBridge;
type PreloadModuleRequire = import("./preloadModuleTypes").PreloadModuleRequire;
type PreloadRuntime = import("./preloadModuleTypes").PreloadRuntime;

interface PreloadRuntimeEnvironment {
    consoleRef: Console;
    globalScope: object;
    processRef: NodeJS.Process;
}

interface StartPreloadScriptOptions {
    consoleRef?: Console;
    electronBridgeOverride?: null | PreloadElectronBridge;
    globalScope?: object;
    processRef?: NodeJS.Process;
    requireModule: PreloadModuleRequire;
}

interface ResolvePreloadRuntimeEnvironmentOptions {
    consoleRef: Console | undefined;
    globalScope: object | undefined;
    processRef: NodeJS.Process | undefined;
    requireModule: PreloadModuleRequire;
}

export function startPreloadScript({
    consoleRef,
    electronBridgeOverride,
    globalScope,
    processRef,
    requireModule,
}: StartPreloadScriptOptions): ElectronAPI {
    const runtimeEnvironment = resolvePreloadRuntimeEnvironment({
        consoleRef,
        globalScope,
        processRef,
        requireModule,
    });
    const { createPreloadRuntime } = requireModule(
        "./preload/preloadRuntime.js"
    ) as {
        createPreloadRuntime: (options: {
            requireModule: PreloadModuleRequire;
        }) => PreloadRuntime;
    };
    const runtime = createPreloadRuntime({ requireModule });
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
        requireModule: runtime.requireModule,
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
    globalScope,
    processRef,
    requireModule,
}: ResolvePreloadRuntimeEnvironmentOptions): PreloadRuntimeEnvironment {
    const { getDefaultPreloadRuntimeEnvironment } = requireModule(
        "./preload/preloadRuntimeEnvironment.js"
    ) as {
        getDefaultPreloadRuntimeEnvironment: () => PreloadRuntimeEnvironment;
    };
    const defaults = getDefaultPreloadRuntimeEnvironment();

    return {
        consoleRef: consoleRef ?? defaults.consoleRef,
        globalScope: globalScope ?? defaults.globalScope,
        processRef: processRef ?? defaults.processRef,
    };
}
