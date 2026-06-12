import { assemblePreloadApi, createPreloadConstants } from "./apiAssembly.js";
import { createElectronApi } from "./electronApiFactory.js";
import { loadPreloadModules } from "./preloadModuleLoader.js";

type PreloadRuntime = import("./preloadModuleTypes").PreloadRuntime;

const createElectronApiModule =
    createElectronApi as unknown as PreloadRuntime["createElectronApi"];

export function createPreloadRuntime(): PreloadRuntime {
    const modules = loadPreloadModules();

    return {
        assemblePreloadApi,
        constants: createPreloadConstants(modules.ipcBridgeCatalog),
        createElectronApi: createElectronApiModule,
        modules,
    };
}
