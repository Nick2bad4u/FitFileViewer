import { createMainStateApi } from "./mainStateApi.js";
import { createMainStateBridge } from "./mainStateBridge.js";

type PreloadStateModules = import("./preloadAssemblyTypes").PreloadStateModules;

export function loadPreloadStateModules(): PreloadStateModules {
    return {
        createMainStateApi,
        createMainStateBridge,
    };
}
