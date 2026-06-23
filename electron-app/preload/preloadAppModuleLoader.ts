import { createApiDiagnostics } from "./apiDiagnostics.js";
import { createAppInfoApi } from "./appInfoApi.js";
import { registerPreloadBeforeExitHandler } from "./beforeExitHandler.js";
import { createClipboardBridge } from "./clipboardBridge.js";
import { createDevtoolsMenuApi } from "./devtoolsMenuApi.js";
import { exposeDevelopmentToolsGlobal } from "./developmentToolsGlobal.js";
import { isPreloadDevelopmentMode } from "./environment.js";
import { createGyazoExternalApi } from "./gyazoExternalApi.js";
import { createShellExternalApi } from "./shellExternalApi.js";
import { createThemeApi } from "./themeApi.js";

type PreloadModuleRegistry =
    import("./preloadModuleTypes").PreloadModuleRegistry;
type PreloadAppModules = Pick<
    PreloadModuleRegistry,
    | "createApiDiagnostics"
    | "createAppInfoApi"
    | "createClipboardBridge"
    | "createDevtoolsMenuApi"
    | "createGyazoExternalApi"
    | "createShellExternalApi"
    | "createThemeApi"
    | "exposeDevelopmentToolsGlobal"
    | "isPreloadDevelopmentMode"
    | "registerPreloadBeforeExitHandler"
>;

export function loadPreloadAppModules(): PreloadAppModules {
    return {
        createApiDiagnostics,
        createAppInfoApi,
        createClipboardBridge,
        createDevtoolsMenuApi,
        createGyazoExternalApi,
        createShellExternalApi,
        createThemeApi,
        exposeDevelopmentToolsGlobal,
        isPreloadDevelopmentMode,
        registerPreloadBeforeExitHandler,
    };
}
