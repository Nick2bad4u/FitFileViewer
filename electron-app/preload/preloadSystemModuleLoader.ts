import { createAppInfoApi } from "./appInfoApi.js";
import { createThemeApi } from "./themeApi.js";

type PreloadSystemModules =
    import("./preloadAssemblyTypes").PreloadSystemModules;

export function loadPreloadSystemModules(): PreloadSystemModules {
    return {
        createAppInfoApi,
        createThemeApi,
    };
}
