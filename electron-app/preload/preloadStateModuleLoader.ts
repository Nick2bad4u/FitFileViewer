import { createMainStateApi } from "./mainStateApi.js";
import { createMainStateBridge } from "./mainStateBridge.js";

type PreloadModuleRegistry =
    import("./preloadModuleTypes").PreloadModuleRegistry;
type PreloadStateModules = Pick<
    PreloadModuleRegistry,
    "createMainStateApi" | "createMainStateBridge"
>;

export function loadPreloadStateModules(): PreloadStateModules {
    return {
        createMainStateApi,
        createMainStateBridge,
    };
}
