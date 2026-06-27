import { registerPreloadBeforeExitHandler } from "./beforeExitHandler.js";
import { isPreloadDevelopmentMode } from "./environment.js";

type PreloadLifecycleModules =
    import("./preloadModuleTypes").PreloadLifecycleModules;

export function loadPreloadLifecycleModules(): PreloadLifecycleModules {
    return {
        isPreloadDevelopmentMode,
        registerPreloadBeforeExitHandler,
    };
}
