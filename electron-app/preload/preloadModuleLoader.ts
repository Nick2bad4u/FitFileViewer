import { loadPreloadApiAssemblyModules } from "./preloadApiAssemblyModuleLoader.js";
import { loadPreloadAppModules } from "./preloadAppModuleLoader.js";
import { loadPreloadFileModules } from "./preloadFileModuleLoader.js";
import { loadPreloadIpcModules } from "./preloadIpcModuleLoader.js";
import { loadPreloadPolicyModules } from "./preloadPolicyModuleLoader.js";
import { loadPreloadStateModules } from "./preloadStateModuleLoader.js";

type PreloadModuleRegistry =
    import("./preloadModuleTypes").PreloadModuleRegistry;

export function loadPreloadModules(): PreloadModuleRegistry {
    return {
        ...loadPreloadApiAssemblyModules(),
        ...loadPreloadAppModules(),
        ...loadPreloadPolicyModules(),
        ...loadPreloadFileModules(),
        ...loadPreloadIpcModules(),
        ...loadPreloadStateModules(),
    };
}
