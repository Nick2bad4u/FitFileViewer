{
    type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
    type PreloadElectronBridge =
        import("./preloadModuleTypes").PreloadElectronBridge;
    type PreloadModuleRequire =
        import("./preloadModuleTypes").PreloadModuleRequire;
    type PreloadRuntime = import("./preloadModuleTypes").PreloadRuntime;

    type PreloadGlobal = typeof globalThis & {
        __electronHoistedMock?: null | PreloadElectronBridge;
    };

    interface StartPreloadScriptOptions {
        consoleRef?: Console;
        globalScope?: PreloadGlobal;
        processRef?: NodeJS.Process;
        requireModule: PreloadModuleRequire;
    }

    function startPreloadScript({
        consoleRef = console,
        globalScope = globalThis,
        processRef = process,
        requireModule,
    }: StartPreloadScriptOptions): ElectronAPI {
        const { createPreloadRuntime } = requireModule(
            "./preload/preloadRuntime.js"
        ) as {
            createPreloadRuntime: (options: {
                requireModule: PreloadModuleRequire;
            }) => PreloadRuntime;
        };
        const runtime = createPreloadRuntime({ requireModule });
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
            globalScope,
            requireModule: runtime.requireModule,
        });
        const preloadLog = createPreloadLogger(consoleRef);
        const isDevelopmentMode = () => isPreloadDevelopmentMode(processRef);
        const electronAPI = assemblePreloadApi({
            constants,
            contextBridge,
            createElectronApi,
            ipcRenderer,
            modules: preloadModules,
            preloadLog,
            processRef,
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
            processRef,
        });

        if (isDevelopmentMode()) {
            preloadLog(
                "info",
                "[preload.js] Preload script initialized successfully"
            );
        }

        return electronAPI;
    }

    module.exports = {
        startPreloadScript,
    };
}
