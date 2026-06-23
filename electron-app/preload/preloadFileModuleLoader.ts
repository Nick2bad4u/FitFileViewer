import { createFileApi } from "./fileApi.js";
import { createFitBrowserApi } from "./fitBrowserApi.js";

type PreloadModuleRegistry =
    import("./preloadModuleTypes").PreloadModuleRegistry;
type PreloadFileModules = Pick<
    PreloadModuleRegistry,
    "createFileApi" | "createFitBrowserApi"
>;

export function loadPreloadFileModules(): PreloadFileModules {
    return {
        createFileApi,
        createFitBrowserApi,
    };
}
