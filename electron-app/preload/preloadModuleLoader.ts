import { loadPreloadApiAssemblyModules } from "./preloadApiAssemblyModuleLoader.js";
import { loadPreloadClipboardModules } from "./preloadClipboardModuleLoader.js";
import { loadPreloadDeveloperModules } from "./preloadDeveloperModuleLoader.js";
import { loadPreloadExternalModules } from "./preloadExternalModuleLoader.js";
import { loadPreloadFileModules } from "./preloadFileModuleLoader.js";
import { loadPreloadIpcModules } from "./preloadIpcModuleLoader.js";
import { loadPreloadLifecycleModules } from "./preloadLifecycleModuleLoader.js";
import { loadPreloadPolicyModules } from "./preloadPolicyModuleLoader.js";
import { loadPreloadStateModules } from "./preloadStateModuleLoader.js";
import { loadPreloadSystemModules } from "./preloadSystemModuleLoader.js";

type PreloadModuleRegistry =
    import("./preloadAssemblyTypes").PreloadModuleRegistry;

export function loadPreloadModules(): PreloadModuleRegistry {
    return {
        ...loadPreloadApiAssemblyModules(),
        ...loadPreloadSystemModules(),
        ...loadPreloadClipboardModules(),
        ...loadPreloadDeveloperModules(),
        ...loadPreloadExternalModules(),
        ...loadPreloadFileModules(),
        ...loadPreloadIpcModules(),
        ...loadPreloadLifecycleModules(),
        ...loadPreloadPolicyModules(),
        ...loadPreloadStateModules(),
    };
}
