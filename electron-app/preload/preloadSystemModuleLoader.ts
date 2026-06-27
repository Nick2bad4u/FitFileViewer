import { createAppInfoApi } from "./appInfoApi.js";
import { createThemeApi } from "./themeApi.js";

type PreloadSystemModules = import("./preloadModuleTypes").PreloadSystemModules;

export function loadPreloadSystemModules(): PreloadSystemModules {
    return {
        createAppInfoApi,
        createThemeApi,
    };
}
