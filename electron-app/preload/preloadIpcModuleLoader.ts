import { resolvePreloadElectronBridge } from "./electronBridge.js";
import { exposeElectronApi } from "./electronApiExposure.js";
import { shouldEnforceGenericIpcAllowlist } from "./environment.js";
import { createPreloadIpcHelpers } from "./ipcHelpers.js";
import * as ipcBridgeCatalog from "./ipcBridgeCatalog.js";
import { createPreloadLogger } from "./logger.js";
import { createMenuEventApi } from "./menuEventApi.js";
import { createPreloadEventApi } from "./preloadEventApi.js";
import { createPreloadValidators } from "./validators.js";

type PreloadModuleRegistry =
    import("./preloadModuleTypes").PreloadModuleRegistry;
type PreloadIpcModules = Pick<
    PreloadModuleRegistry,
    | "createMenuEventApi"
    | "createPreloadEventApi"
    | "createPreloadIpcHelpers"
    | "createPreloadLogger"
    | "createPreloadValidators"
    | "exposeElectronApi"
    | "ipcBridgeCatalog"
    | "resolvePreloadElectronBridge"
    | "shouldEnforceGenericIpcAllowlist"
>;

export function loadPreloadIpcModules(): PreloadIpcModules {
    return {
        createMenuEventApi,
        createPreloadEventApi,
        createPreloadIpcHelpers,
        createPreloadLogger,
        createPreloadValidators,
        exposeElectronApi,
        ipcBridgeCatalog,
        resolvePreloadElectronBridge,
        shouldEnforceGenericIpcAllowlist: shouldEnforceGenericIpcAllowlist,
    };
}
