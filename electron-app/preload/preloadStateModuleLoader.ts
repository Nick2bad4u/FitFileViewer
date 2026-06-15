import { createMainStateApi } from "./mainStateApi.js";
import { createMainStateBridge } from "./mainStateBridge.js";

type PreloadModuleRegistry =
    import("./preloadModuleTypes").PreloadModuleRegistry;
type PreloadStateModules = Pick<
    PreloadModuleRegistry,
    "createMainStateApi" | "createMainStateBridge"
>;

const createMainStateApiModule =
    createMainStateApi as unknown as PreloadModuleRegistry["createMainStateApi"];
const createMainStateBridgeModule =
    createMainStateBridge as unknown as PreloadModuleRegistry["createMainStateBridge"];

export function loadPreloadStateModules(): PreloadStateModules {
    return {
        createMainStateApi: createMainStateApiModule,
        createMainStateBridge: createMainStateBridgeModule,
    };
}
