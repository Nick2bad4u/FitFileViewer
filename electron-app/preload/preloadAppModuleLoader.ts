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

const createApiDiagnosticsModule =
    createApiDiagnostics as unknown as PreloadModuleRegistry["createApiDiagnostics"];
const createClipboardBridgeModule =
    createClipboardBridge as unknown as PreloadModuleRegistry["createClipboardBridge"];
const createDevtoolsMenuApiModule =
    createDevtoolsMenuApi as unknown as PreloadModuleRegistry["createDevtoolsMenuApi"];
const createGyazoExternalApiModule =
    createGyazoExternalApi as unknown as PreloadModuleRegistry["createGyazoExternalApi"];
const createShellExternalApiModule =
    createShellExternalApi as unknown as PreloadModuleRegistry["createShellExternalApi"];
const exposeDevelopmentToolsGlobalModule =
    exposeDevelopmentToolsGlobal as unknown as PreloadModuleRegistry["exposeDevelopmentToolsGlobal"];
const isPreloadDevelopmentModeModule =
    isPreloadDevelopmentMode as PreloadModuleRegistry["isPreloadDevelopmentMode"];
const registerPreloadBeforeExitHandlerModule =
    registerPreloadBeforeExitHandler as unknown as PreloadModuleRegistry["registerPreloadBeforeExitHandler"];

export function loadPreloadAppModules(): PreloadAppModules {
    return {
        createApiDiagnostics: createApiDiagnosticsModule,
        createAppInfoApi,
        createClipboardBridge: createClipboardBridgeModule,
        createDevtoolsMenuApi: createDevtoolsMenuApiModule,
        createGyazoExternalApi: createGyazoExternalApiModule,
        createShellExternalApi: createShellExternalApiModule,
        createThemeApi,
        exposeDevelopmentToolsGlobal: exposeDevelopmentToolsGlobalModule,
        isPreloadDevelopmentMode: isPreloadDevelopmentModeModule,
        registerPreloadBeforeExitHandler:
            registerPreloadBeforeExitHandlerModule,
    };
}
