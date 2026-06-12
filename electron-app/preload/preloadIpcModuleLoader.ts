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

const createMenuEventApiModule =
    createMenuEventApi as unknown as PreloadModuleRegistry["createMenuEventApi"];
const createPreloadEventApiModule =
    createPreloadEventApi as unknown as PreloadModuleRegistry["createPreloadEventApi"];
const createPreloadIpcHelpersModule =
    createPreloadIpcHelpers as unknown as PreloadModuleRegistry["createPreloadIpcHelpers"];
const createPreloadLoggerModule =
    createPreloadLogger as unknown as PreloadModuleRegistry["createPreloadLogger"];
const createPreloadValidatorsModule =
    createPreloadValidators as unknown as PreloadModuleRegistry["createPreloadValidators"];
const exposeElectronApiModule =
    exposeElectronApi as unknown as PreloadModuleRegistry["exposeElectronApi"];
const ipcBridgeCatalogModule =
    ipcBridgeCatalog as unknown as PreloadModuleRegistry["ipcBridgeCatalog"];
const resolvePreloadElectronBridgeModule =
    resolvePreloadElectronBridge as unknown as PreloadModuleRegistry["resolvePreloadElectronBridge"];
const shouldEnforceGenericIpcAllowlistModule =
    shouldEnforceGenericIpcAllowlist as PreloadModuleRegistry["shouldEnforceGenericIpcAllowlist"];

export function loadPreloadIpcModules(): PreloadIpcModules {
    return {
        createMenuEventApi: createMenuEventApiModule,
        createPreloadEventApi: createPreloadEventApiModule,
        createPreloadIpcHelpers: createPreloadIpcHelpersModule,
        createPreloadLogger: createPreloadLoggerModule,
        createPreloadValidators: createPreloadValidatorsModule,
        exposeElectronApi: exposeElectronApiModule,
        ipcBridgeCatalog: ipcBridgeCatalogModule,
        resolvePreloadElectronBridge: resolvePreloadElectronBridgeModule,
        shouldEnforceGenericIpcAllowlist:
            shouldEnforceGenericIpcAllowlistModule,
    };
}
