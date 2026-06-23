import { createMainStateApi } from "./mainStateApi.js";
import { createMainStateBridge } from "./mainStateBridge.js";

type PreloadModuleRegistry =
    import("./preloadModuleTypes").PreloadModuleRegistry;
type PreloadStateModules = Pick<
    PreloadModuleRegistry,
    "createMainStateApi" | "createMainStateBridge"
>;

const createMainStateBridgeModule =
    createMainStateBridge as unknown as PreloadModuleRegistry["createMainStateBridge"];

export function loadPreloadStateModules(): PreloadStateModules {
    return {
        createMainStateApi,
        createMainStateBridge: createMainStateBridgeModule,
    };
}
