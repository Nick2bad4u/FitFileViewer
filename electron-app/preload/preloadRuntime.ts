import { assemblePreloadApi, createPreloadConstants } from "./apiAssembly.js";
import { createElectronApi } from "./electronApiFactory.js";
import { loadPreloadModules } from "./preloadModuleLoader.js";

type PreloadRuntime = import("./preloadModuleTypes").PreloadRuntime;

const createElectronApiModule: PreloadRuntime["createElectronApi"] =
    createElectronApi;

export function createPreloadRuntime(): PreloadRuntime {
    const modules = loadPreloadModules();

    return {
        assemblePreloadApi,
        constants: createPreloadConstants(modules.ipcBridgeCatalog),
        createElectronApi: createElectronApiModule,
        modules,
    };
}
