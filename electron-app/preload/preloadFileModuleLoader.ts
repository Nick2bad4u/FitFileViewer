import { createFileApi } from "./fileApi.js";
import { createFitBrowserApi } from "./fitBrowserApi.js";

type PreloadFileModules = import("./preloadAssemblyTypes").PreloadFileModules;

export function loadPreloadFileModules(): PreloadFileModules {
    return {
        createFileApi,
        createFitBrowserApi,
    };
}
