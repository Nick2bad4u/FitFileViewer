import { createGyazoExternalApi } from "./gyazoExternalApi.js";
import { createShellExternalApi } from "./shellExternalApi.js";

type PreloadExternalModules =
    import("./preloadModuleTypes").PreloadExternalModules;

export function loadPreloadExternalModules(): PreloadExternalModules {
    return {
        createGyazoExternalApi,
        createShellExternalApi,
    };
}
