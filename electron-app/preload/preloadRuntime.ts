import { assemblePreloadApi, createPreloadConstants } from "./apiAssembly.js";
import { createElectronApi } from "./electronApiFactory.js";
import { loadPreloadModules } from "./preloadModuleLoader.js";

type PreloadModuleRequire = import("./preloadModuleTypes").PreloadModuleRequire;
type PreloadRuntime = import("./preloadModuleTypes").PreloadRuntime;

interface CreatePreloadRuntimeOptions {
    requireModule: PreloadModuleRequire;
}

const createElectronApiModule =
    createElectronApi as unknown as PreloadRuntime["createElectronApi"];

export function createPreloadRuntime({
    requireModule,
}: CreatePreloadRuntimeOptions): PreloadRuntime {
    const modules = loadPreloadModules();

    return {
        assemblePreloadApi,
        constants: createPreloadConstants(modules.ipcBridgeCatalog),
        createElectronApi: createElectronApiModule,
        modules,
        requireModule,
    };
}
