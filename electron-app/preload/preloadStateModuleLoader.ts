import { createMainStateApi } from "./mainStateApi.js";
import { createMainStateBridge } from "./mainStateBridge.js";

type PreloadStateModules = import("./preloadModuleTypes").PreloadStateModules;

export function loadPreloadStateModules(): PreloadStateModules {
    return {
        createMainStateApi,
        createMainStateBridge,
    };
}
